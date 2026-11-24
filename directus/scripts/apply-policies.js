import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'

const defaultAccessDir = fileURLToPath(new URL('../access/', import.meta.url))
const NAME = /^[a-zA-Z][a-zA-Z0-9_]*$/
const ACTIONS = new Set(['create', 'read', 'update', 'delete', 'share'])

const isObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const hasOnly = (value, keys) =>
  Object.keys(value).every((key) => keys.includes(key))

const primaryKey = (definition) =>
  definition.fields.find((field) => field.schema?.is_primary_key === true)

// CORE_SCHEMA keeps unquoted dates as strings instead of JavaScript dates.
async function readYaml(file) {
  return yaml.load(await readFile(file, 'utf8'), { schema: yaml.CORE_SCHEMA })
}

async function listYaml(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  return entries
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => {
      if (!entry.isFile() || !/\.ya?ml$/i.test(entry.name)) {
        throw new Error(`Expected a YAML file in ${directory}: ${entry.name}`)
      }
      return path.join(directory, entry.name)
    })
}

export async function loadAccess(accessDir, definitions) {
  const policies = []
  for (const file of await listYaml(accessDir)) {
    const doc = await readYaml(file)
    const fail = (message) => {
      throw new Error(`${message} (${file})`)
    }
    if (
      !isObject(doc) ||
      !hasOnly(doc, ['policy', 'role', 'user', 'permissions']) ||
      !Array.isArray(doc.permissions)
    ) {
      fail('Invalid access definition')
    }
    const isPublic = doc.policy === 'public'
    if (!isPublic && (!isObject(doc.policy) || !doc.policy.name)) {
      fail('Expected `policy: public` or a policy with a name')
    }
    if (isPublic && (doc.role || doc.user)) {
      fail('The public policy cannot have a role or user')
    }
    if (
      doc.user &&
      (!doc.role?.name || !doc.user.email || !doc.user.token_env)
    ) {
      fail('A service user needs a role, an email and a token_env')
    }
    if (doc.user && !NAME.test(doc.user.token_env.toLowerCase())) {
      fail('token_env must be an environment variable name')
    }
    if (doc.policy?.admin_access === true) {
      fail('Managed policies must not grant admin access')
    }

    const grants = new Set()
    for (const grant of doc.permissions) {
      const definition = definitions.find(
        (item) => item.collection === grant?.collection,
      )
      if (
        !isObject(grant) ||
        !definition ||
        !ACTIONS.has(grant.action) ||
        !Array.isArray(grant.fields) ||
        !hasOnly(grant, [
          'collection',
          'action',
          'fields',
          'permissions',
          'validation',
        ])
      ) {
        fail(`Invalid permission ${grant?.collection}.${grant?.action}`)
      }
      for (const name of grant.fields) {
        if (name !== '*' && !definition.fields.some((f) => f.field === name)) {
          fail(`Unknown field ${grant.collection}.${name} in a permission`)
        }
      }
      const id = `${grant.collection}.${grant.action}`
      if (grants.has(id)) fail(`Duplicate permission ${id}`)
      grants.add(id)
    }
    policies.push(doc)
  }
  return policies
}

const json = (value) => encodeURIComponent(JSON.stringify(value))

async function findPublicPolicy(request, token) {
  const { data } = await request(
    '/access?filter[role][_null]=true&filter[user][_null]=true&fields=policy&limit=1',
    { token },
  )
  if (!data[0]?.policy) throw new Error('Directus Public policy not found.')
  return data[0].policy
}

async function ensurePolicy(request, token, definition) {
  const { name, ...body } = definition
  const { data } = await request(
    `/policies?filter=${json({ name: { _eq: name } })}&fields=id&limit=1`,
    { token },
  )
  if (data[0]) {
    // The YAML owns the policy flags so they cannot drift to wider access.
    await request(`/policies/${data[0].id}`, { method: 'PATCH', token, body })
    return data[0].id
  }
  const created = await request('/policies', {
    method: 'POST',
    token,
    body: { name, ...body },
  })
  return created.data.id
}

async function ensureRole(request, token, policyId, definition) {
  const { name, ...body } = definition
  const { data } = await request(
    `/roles?filter=${json({ name: { _eq: name } })}&fields=id&limit=1`,
    { token },
  )
  const id =
    data[0]?.id ??
    (
      await request('/roles', {
        method: 'POST',
        token,
        body: { name, ...body },
      })
    ).data.id
  const links = await request(
    `/access?filter[role][_eq]=${id}&filter[policy][_eq]=${policyId}&fields=id&limit=1`,
    { token },
  )
  if (!links.data.length) {
    await request('/access', {
      method: 'POST',
      token,
      body: { role: id, policy: policyId },
    })
  }
  return id
}

async function syncPermissions(request, token, policyId, label, grants) {
  for (const grant of grants) {
    const body = {
      fields: grant.fields,
      permissions: grant.permissions ?? null,
      validation: grant.validation ?? null,
      presets: null,
    }
    const { data } = await request(
      `/permissions?filter=${json({
        policy: { _eq: policyId },
        collection: { _eq: grant.collection },
        action: { _eq: grant.action },
      })}&fields=id&limit=1`,
      { token },
    )
    if (data[0]) {
      await request(`/permissions/${data[0].id}`, {
        method: 'PATCH',
        token,
        body,
      })
    } else {
      await request('/permissions', {
        method: 'POST',
        token,
        body: {
          ...body,
          policy: policyId,
          collection: grant.collection,
          action: grant.action,
        },
      })
    }
  }

  // Nothing is deleted automatically; surface grants the YAML does not declare.
  const declared = new Set(grants.map((g) => `${g.collection}.${g.action}`))
  const current = await request(
    `/permissions?filter=${json({ policy: { _eq: policyId } })}&fields=collection,action&limit=-1`,
    { token },
  )
  for (const { collection, action } of current.data) {
    if (!declared.has(`${collection}.${action}`)) {
      console.warn(
        `Warning: ${label} has an undeclared ${action} permission on ${collection}; review it in Directus.`,
      )
    }
  }
}

async function ensureServiceUser(request, token, roleId, user, env) {
  const secret = env[user.token_env]
  if (!secret) {
    console.log(
      `${user.token_env} is not set; skipped user ${user.email}. Features that need it stay disabled.`,
    )
    return
  }
  if (!/^[\w-]{32,}$/.test(secret)) {
    throw new Error(
      `${user.token_env} must be at least 32 letters, digits, - or _.`,
    )
  }
  const { token_env, ...profile } = user
  const { data } = await request(
    `/users?filter=${json({ email: { _eq: user.email } })}&fields=id&limit=1`,
    { token },
  )
  const values = { role: roleId, status: 'active', token: secret }
  if (data[0]) {
    await request(`/users/${data[0].id}`, {
      method: 'PATCH',
      token,
      body: values,
    })
  } else {
    await request('/users', {
      method: 'POST',
      token,
      body: { ...profile, ...values },
    })
  }
  console.log(`User ${user.email} is active with the configured token.`)
}

// Reconciles the policies, roles, permissions and service users declared in
// access/*.yaml. Policies are matched by name and owned by the YAML.
export async function applyPolicies(
  request,
  token,
  definitions,
  { env = process.env, accessDir = defaultAccessDir } = {},
) {
  const documents = await loadAccess(accessDir, definitions)
  for (const doc of documents) {
    const isPublic = doc.policy === 'public'
    const label = isPublic ? 'the Public policy' : `policy ${doc.policy.name}`
    const policyId = isPublic
      ? await findPublicPolicy(request, token)
      : await ensurePolicy(request, token, doc.policy)
    const roleId = doc.role
      ? await ensureRole(request, token, policyId, doc.role)
      : undefined
    await syncPermissions(request, token, policyId, label, doc.permissions)
    if (doc.user) await ensureServiceUser(request, token, roleId, doc.user, env)
    console.log(
      `Synchronized ${doc.permissions.length} permissions for ${label}.`,
    )
  }
}
