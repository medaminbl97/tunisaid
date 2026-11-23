import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { applyPolicies, loadAccess } from './apply-policies.js'
import { loadDefinitions } from './apply-schemas.js'

const schemasDir = fileURLToPath(new URL('../schemas/', import.meta.url))
const accessDir = fileURLToPath(new URL('../access/', import.meta.url))
const token = 'x'.repeat(40)

async function withAccess(files, run) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'directus-access-'))
  try {
    for (const [name, content] of Object.entries(files)) {
      await writeFile(path.join(root, name), content)
    }
    return await run(root)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

// An in-memory stand-in for the Directus access API.
function fakeApi() {
  const rows = {
    policies: [],
    roles: [],
    permissions: [],
    users: [],
    access: [{ policy: 'public-policy', role: null, user: null }],
  }
  let writes = 0
  let counter = 0
  const matches = (row, condition) =>
    Object.entries(condition).every(([field, rule]) => {
      if ('_eq' in rule) return row[field] === rule._eq
      return false
    })
  const request = async (endpoint, { method = 'GET', body } = {}) => {
    const url = new URL(endpoint, 'http://localhost')
    const collection = url.pathname.split('/')[1]
    const id = url.pathname.split('/')[2]
    if (method === 'GET') {
      const filter = url.searchParams.get('filter')
      let data = rows[collection]
      if (collection === 'access' && !filter) {
        data = rows.access.filter((row) => !row.role && !row.user)
      } else if (filter) {
        const condition = JSON.parse(filter)
        data = data.filter((row) => matches(row, condition))
      } else {
        // bracket-style filters, e.g. filter[role][_eq]=1
        const pairs = [...url.searchParams].filter(([k]) =>
          k.startsWith('filter['),
        )
        data = data.filter((row) =>
          pairs.every(([key, value]) => {
            const [, field, op] = key.match(/^filter\[(\w+)\]\[(\w+)\]$/)
            return op === '_null'
              ? !row[field] === (value === 'true')
              : String(row[field]) === value
          }),
        )
      }
      return { data: data.map((row) => ({ ...row })) }
    }
    writes++
    if (method === 'PATCH') {
      Object.assign(
        rows[collection].find((row) => String(row.id) === id),
        body,
      )
      return { data: body }
    }
    const row = { id: `${collection}-${++counter}`, ...body }
    rows[collection].push(row)
    return { data: row }
  }
  return {
    rows,
    request,
    get writes() {
      return writes
    },
  }
}

const definitions = await loadDefinitions(schemasDir)
const env = { DONATION_SERVICE_TOKEN: token }

test('the repository access files validate', async () => {
  const documents = await loadAccess(accessDir, definitions)
  assert.ok(documents.length > 0)
  assert.ok(documents.every((doc) => !doc.policy.admin_access))
})

test('reconciles policies, role and service user idempotently', async () => {
  const api = fakeApi()
  const options = { env, accessDir }
  await applyPolicies(api.request, 't', definitions, options)
  assert.equal(api.rows.users.length, 1)
  assert.equal(api.rows.users[0].token, token)
  assert.ok(api.rows.policies.every((policy) => !policy.admin_access))
  const afterFirst = api.writes
  await applyPolicies(api.request, 't', definitions, options)
  // Second run only patches existing rows, it never creates duplicates.
  assert.equal(api.rows.users.length, 1)
  assert.equal(api.rows.policies.length, 1)
  assert.equal(api.rows.roles.length, 1)
  assert.ok(api.writes >= afterFirst)
})

test('skips the service user when its token is not set', async () => {
  const api = fakeApi()
  await applyPolicies(api.request, 't', definitions, { env: {}, accessDir })
  assert.equal(api.rows.users.length, 0)
  assert.ok(api.rows.permissions.length > 0)
})

test('rejects a token that is too short', async () => {
  const api = fakeApi()
  await assert.rejects(
    applyPolicies(api.request, 't', definitions, {
      env: { DONATION_SERVICE_TOKEN: 'short' },
      accessDir,
    }),
    /at least 32/,
  )
})

test('undeclared permissions are reported, never deleted', async () => {
  const api = fakeApi()
  const options = { env, accessDir }
  await applyPolicies(api.request, 't', definitions, options)
  const policy = api.rows.policies[0].id
  api.rows.permissions.push({
    id: 'extra',
    policy,
    collection: 'projects',
    action: 'delete',
  })
  await applyPolicies(api.request, 't', definitions, options)
  assert.ok(api.rows.permissions.some((row) => row.id === 'extra'))
})

test('rejects managed policies that grant admin access', async () => {
  await withAccess(
    {
      'bad.yaml':
        'policy:\n  name: bad\n  admin_access: true\npermissions: []\n',
    },
    (root) => assert.rejects(loadAccess(root, definitions), /admin access/),
  )
})

test('rejects a permission on an unknown field', async () => {
  await withAccess(
    {
      'bad.yaml':
        'policy: public\npermissions:\n  - collection: projects\n    action: read\n    fields: [no_such_field]\n',
    },
    (root) => assert.rejects(loadAccess(root, definitions), /Unknown field/),
  )
})
