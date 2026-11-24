import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { applyPolicies, loadAccess } from './apply-policies.js'
import { loadDefinitions } from './schema-model.js'

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

// The OpenAPI export for the generated client runs with the donation service's
// token, and Directus only lists what the caller may read. So the service must
// be able to read every field of the published content the Public policy exposes.
test('the donation service can read everything the public can read', async () => {
  const documents = await loadAccess(accessDir, definitions)
  const reads = (doc) =>
    new Map(
      doc.permissions
        .filter((grant) => grant.action === 'read')
        .map((grant) => [grant.collection, grant.fields]),
    )
  const publicReads = reads(documents.find((doc) => doc.policy === 'public'))
  const service = documents.find(
    (doc) => doc.policy?.name === 'donation-service-policy',
  )
  assert.ok(service, 'the donation service policy exists')
  const serviceReads = reads(service)
  for (const [collection, fields] of publicReads) {
    const allowed = serviceReads.get(collection)
    assert.ok(allowed, `the service cannot read ${collection}`)
    const missing = fields.filter((field) => !allowed.includes(field))
    assert.deepEqual(
      missing,
      [],
      `${collection}: fields the service cannot read`,
    )
  }
})

// The generated client's types come from the OpenAPI spec, which Directus builds
// from the fields the caller may read. A field the service writes but cannot read is
// missing from its types, so every written field must be readable too, except the
// ones listed here on purpose (secrets the service must not read back).
const WRITE_ONLY = new Map([
  // Donor details are personal data: the service creates the row and reads back
  // only its id (tools/verify.mjs asserts that reading them is forbidden).
  [
    'donors',
    [
      'country_code',
      'created_at',
      'display_name',
      'email',
      'keep_name_private',
      'preferred_language',
    ],
  ],
])

test('the donation service can read every field it writes', async () => {
  const documents = await loadAccess(accessDir, definitions)
  const service = documents.find(
    (doc) => doc.policy?.name === 'donation-service-policy',
  )
  const fieldsOf = (action, collection) =>
    service.permissions
      .filter(
        (grant) => grant.action === action && grant.collection === collection,
      )
      .flatMap((grant) => grant.fields)
  const unreadable = []
  for (const grant of service.permissions) {
    if (!['create', 'update'].includes(grant.action)) continue
    const readable = fieldsOf('read', grant.collection)
    const exempt = WRITE_ONLY.get(grant.collection) ?? []
    for (const field of grant.fields) {
      if (!readable.includes(field) && !exempt.includes(field)) {
        unreadable.push(`${grant.collection}.${field}`)
      }
    }
  }
  assert.deepEqual(
    [...new Set(unreadable)].sort(),
    [],
    'fields the service writes but cannot read',
  )
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
