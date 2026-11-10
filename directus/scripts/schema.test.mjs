import assert from 'node:assert/strict'
import test from 'node:test'
import { applySchema, collection, required, relation } from './schema.mjs'
import { createClient } from './client.mjs'
import {
  collections,
  donationStatuses,
  relations,
  serviceGrants,
  translatedCollections,
} from '../migrations/001-initial-schema.mjs'
import { seed } from './seed.mjs'
import { migrate } from './migrate.mjs'
import { escapeHtml } from './rich-text.mjs'

test('migrations resume after failure, run once and reject changed checksums', async () => {
  const stored = new Map()
  const ledger = []
  const links = []
  const accessLinks = []
  const servicePermissions = []
  let fail = true
  let writes = 0
  const request = async (path, options = {}) => {
    if (path === '/collections' && !options.method) return [...stored.values()]
    if (path === '/collections') {
      if (fail && options.body.collection === 'donations')
        throw new Error('Synthetic migration interruption')
      writes++
      stored.set(options.body.collection, structuredClone(options.body))
      return
    }
    if (options.method === 'PATCH') {
      assert.ok(path.startsWith('/fields/') || path.startsWith('/relations/'))
      if (path.startsWith('/relations/')) {
        const [, , collectionName, fieldName] = path.split('/')
        assert.equal(options.body.collection, collectionName)
        assert.equal(options.body.field, fieldName)
        assert.ok(
          options.body.related_collection === 'directus_files' ||
            collections.some(
              (item) => item.collection === options.body.related_collection,
            ),
        )
      }
      writes++
      return
    }
    if (path.startsWith('/fields/'))
      return stored.get(path.split('/')[2]).fields
    if (path === '/relations' && !options.method) return links
    if (path === '/relations') {
      writes++
      links.push(structuredClone(options.body))
      return
    }
    if (path.startsWith('/items/backend_migrations?')) {
      return ledger.filter(
        (row) =>
          row.id ===
          new URL(path, 'http://localhost').searchParams.get('filter[id][_eq]'),
      )
    }
    if (path === '/items/backend_migrations' && options.method === 'POST') {
      writes++
      ledger.push(structuredClone(options.body))
      return
    }
    if (
      path.startsWith('/items/projects_translations?') ||
      path.startsWith('/items/campaigns_translations?')
    )
      return []
    if (path.startsWith('/roles?') || path.startsWith('/policies?')) return []
    if (
      (path === '/roles' || path === '/policies') &&
      options.method === 'POST'
    ) {
      assert.equal(options.body.admin_access ?? false, false)
      writes++
      return { id: `service-${path.slice(1)}` }
    }
    if (path.startsWith('/access?filter[role][_eq]=service-roles')) {
      assert.match(path, /filter\[policy\]\[_eq\]=service-policies/)
      return accessLinks
    }
    if (path.startsWith('/access?')) return [{ policy: 'public-policy' }]
    if (path === '/access' && options.method === 'POST') {
      assert.deepEqual(options.body, {
        role: 'service-roles',
        policy: 'service-policies',
      })
      writes++
      accessLinks.push({ id: 'service-access' })
      return
    }
    if (path.startsWith('/permissions?')) return []
    if (path === '/permissions' && options.method === 'POST') {
      if (options.body.policy === 'service-policies') {
        servicePermissions.push(options.body)
      } else {
        assert.equal(options.body.policy, 'public-policy')
        assert.equal(options.body.action, 'read')
      }
      writes++
      return
    }
    throw new Error(`Unexpected migration test request ${path}`)
  }
  await assert.rejects(migrate(request), /Synthetic migration interruption/)
  assert.deepEqual(ledger, [])
  fail = false
  await migrate(request)
  assert.deepEqual(
    ledger.map((row) => row.id),
    ['001', '002'],
  )
  assert.equal(accessLinks.length, 1)
  const grants = new Set(
    servicePermissions.map((grant) => `${grant.collection}:${grant.action}`),
  )
  assert.ok(grants.has('checkouts:create'))
  assert.ok(grants.has('donations:create'))
  assert.ok(!grants.has('donations:update'))
  assert.ok(grants.has('campaign_projects:read'))
  assert.ok(grants.has('payment_events:create'))
  assert.ok(
    servicePermissions
      .find((grant) => grant.collection === 'donations')
      .fields.every((name) => !name.includes('allocation')),
  )
  // Provider refund webhooks record refunds from migration 002 on.
  assert.ok(grants.has('refunds:create'))
  assert.ok(grants.has('refunds:update'))
  assert.ok(
    servicePermissions
      .filter((grant) => grant.collection === 'refunds')
      .every(
        (grant) =>
          !grant.fields.includes('reason_code') || grant.action === 'create',
      ),
  )
  assert.ok(servicePermissions.every((grant) => !grant.fields.includes('*')))
  const completedWrites = writes
  await migrate(request)
  assert.equal(writes, completedWrites)
  ledger[0].checksum = 'changed'
  await assert.rejects(migrate(request), /Applied migration changed/)
})

test('every website body and description is a rich-text HTML field', () => {
  const rich = collections.flatMap((item) =>
    item.fields
      .filter((entry) => entry.meta?.interface === 'input-rich-text-html')
      .map((entry) => `${item.collection}.${entry.field}`),
  )
  assert.deepEqual(rich.sort(), [
    'campaigns_translations.body',
    'donation_purposes_translations.description',
    'projects_translations.body',
  ])
  for (const item of collections) {
    for (const entry of item.fields) {
      if (/^(body|description)$/.test(entry.field)) {
        assert.equal(entry.type, 'text', `${item.collection}.${entry.field}`)
        assert.equal(entry.meta.interface, 'input-rich-text-html')
      }
    }
  }
  assert.equal(
    escapeHtml(`A & B < 5 "Quote"`),
    'A &amp; B &lt; 5 &quot;Quote&quot;',
  )
})

test('only the essential collections exist and refund state is not stored', () => {
  const names = collections.map((item) => item.collection)
  for (const removed of [
    'allocations',
    'material_donations',
    'material_donation_events',
    'project_partners',
    'project_updates',
    'project_updates_translations',
  ]) {
    assert.ok(!names.includes(removed), removed)
  }
  assert.deepEqual(donationStatuses, [
    'pending',
    'paid',
    'failed',
    'cancelled',
    'expired',
  ])
  const fieldsOf = (name) =>
    collections
      .find((item) => item.collection === name)
      .fields.map((entry) => entry.field)
  // A checkout holds the single payment; donations are its campaign shares.
  assert.ok(fieldsOf('checkouts').includes('status'))
  assert.ok(fieldsOf('payment_attempts').includes('checkout'))
  for (const field of ['checkout', 'campaign', 'items', 'refunds'])
    assert.ok(fieldsOf('donations').includes(field), field)
  for (const field of ['status', 'reference', 'donor', 'paid_at'])
    assert.ok(!fieldsOf('donations').includes(field), field)
  assert.ok(
    fieldsOf('donations').every((field) => !field.includes('allocation')),
  )
  assert.ok(
    serviceGrants.every(
      (grant) => grant.collection !== 'refunds' || grant.action === 'read',
    ),
    'the baseline only reads refunds; migration 002 adds the webhook grants',
  )
})

test('schema creation resumes after partial failure and is repeatable', async () => {
  const definitions = [
    collection('parents', [required('title')]),
    collection('children', [required('title')]),
  ]
  const relations = [relation('children', 'parent', 'parents')]
  const stored = new Map()
  const links = []
  let writes = 0
  const request = async (path, options = {}) => {
    if (path === '/collections' && !options.method) return [...stored.values()]
    if (path === '/collections') {
      writes++
      stored.set(options.body.collection, structuredClone(options.body))
      return
    }
    if (path.startsWith('/fields/')) {
      const current = stored.get(path.split('/')[2])
      if (!options.method) return current.fields
      writes++
      current.fields.push(options.body)
      return
    }
    if (path === '/relations' && !options.method) return links
    if (path === '/relations') {
      writes++
      links.push(options.body)
      return
    }
    throw new Error(`Unexpected test request ${path}`)
  }
  stored.set('parents', {
    collection: 'parents',
    fields: [definitions[0].fields[0]],
  })
  await applySchema(request, definitions, relations)
  assert.equal(stored.get('parents').fields.length, 2)
  assert.equal(writes, 3)
  await applySchema(request, definitions, relations)
  assert.equal(writes, 3)
})

test('schema drift and API failures are surfaced', async () => {
  const definition = collection('parents', [required('title')])
  await assert.rejects(
    applySchema(
      async (path) => {
        if (path === '/collections') return [{ collection: 'parents' }]
        return [{ field: 'id', type: 'integer' }]
      },
      [definition],
      [],
    ),
    /Schema drift/,
  )
  await assert.rejects(
    applySchema(
      async () => {
        throw new Error('HTTP 503')
      },
      [definition],
      [],
    ),
    /HTTP 503/,
  )
  await assert.rejects(
    applySchema(
      async (path) => {
        if (path === '/collections') return []
        return [
          {
            collection: 'children',
            field: 'parent',
            related_collection: 'wrong',
          },
        ]
      },
      [],
      [relation('children', 'parent', 'parents')],
    ),
    /Relation drift/,
  )
})

test('collection and relation identities are unique and resolve', () => {
  const names = new Set(collections.map((item) => item.collection))
  assert.equal(names.size, collections.length)
  for (const item of collections) {
    assert.equal(
      new Set(item.fields.map((entry) => entry.field)).size,
      item.fields.length,
    )
    assert.equal(item.fields[0].schema.is_primary_key, true)
  }
  assert.equal(
    new Set(relations.map((item) => `${item.collection}.${item.field}`)).size,
    relations.length,
  )
  for (const item of relations) {
    assert.ok(names.has(item.collection))
    assert.ok(
      names.has(item.related_collection) ||
        item.related_collection === 'directus_files',
    )
    assert.ok(
      collections
        .find((entry) => entry.collection === item.collection)
        .fields.some((entry) => entry.field === item.field),
    )
    const owned =
      item.collection === 'campaign_projects' ||
      (item.collection.endsWith('_translations') && item.field === 'parent')
    assert.equal(item.schema.on_delete, owned ? 'CASCADE' : 'RESTRICT')
    if (item.meta.one_field) {
      assert.ok(
        collections
          .find((entry) => entry.collection === item.related_collection)
          .fields.some((entry) => entry.field === item.meta.one_field),
        `${item.related_collection}.${item.meta.one_field}`,
      )
    }
  }
  for (const parent of Object.keys(translatedCollections)) {
    assert.ok(names.has(`${parent}_translations`))
  }
})

test('seed preserves existing edits and produces exact localized draft catalog', async () => {
  const tables = new Map()
  const request = async (path, options = {}) => {
    const url = new URL(path, 'http://localhost')
    const name = url.pathname.split('/')[2]
    if (!tables.has(name)) tables.set(name, [])
    const rows = tables.get(name)
    if (options.method === 'POST') {
      const row = {
        id: options.body.id ?? `${name}-${rows.length}`,
        ...options.body,
      }
      rows.push(row)
      return row
    }
    const filter = JSON.parse(url.searchParams.get('filter'))
    return rows.filter((row) =>
      Object.entries(filter).every(
        ([key, condition]) => row[key] === condition._eq,
      ),
    )
  }
  await seed(request)
  const purposes = tables.get('donation_purposes')
  assert.deepEqual(
    purposes.map((row) => row.unit_amount_cents),
    [3500, 3000, 2500, 4500],
  )
  assert.ok(
    purposes.every(
      (row) =>
        row.status === 'draft' && row.is_illustrative && row.currency === 'EUR',
    ),
  )
  assert.equal(tables.get('donation_purposes_translations').length, 8)
  const projects = tables.get('projects')
  assert.deepEqual(
    projects.map((row) => row.slug),
    [
      'school-supplies-support',
      'ramadan-food-boxes',
      'wheelchairs-for-students',
    ],
  )
  assert.ok(
    projects.every(
      (row) =>
        row.status === 'draft' &&
        !row.cover_image &&
        !row.starts_at &&
        !row.ends_at,
    ),
  )
  const projectTranslations = tables.get('projects_translations')
  assert.equal(projectTranslations.length, 6)
  assert.ok(
    projectTranslations.every(
      (row) =>
        row.body.startsWith('<h2>') &&
        row.body.includes('<a href="https://tunisaid.org/">'),
    ),
  )
  for (const project of projects) {
    const copies = projectTranslations.filter(
      (row) => row.parent === project.id,
    )
    assert.deepEqual(copies.map((row) => row.language).sort(), ['de', 'en'])
    assert.ok(
      copies.every(
        (row) =>
          row.title &&
          row.summary &&
          row.body.includes('https://tunisaid.org/'),
      ),
    )
  }
  assert.ok(
    tables
      .get('donation_purposes_translations')
      .every(
        (row) =>
          row.title && row.description.startsWith('<p>') && row.basket_title,
      ),
  )
  assert.deepEqual(
    tables
      .get('donation_purposes')
      .map((row) => row.project && row.project.split('-')[0]),
    ['projects', 'projects', 'projects', null],
  )
  assert.equal(tables.get('campaign_projects').length, 3)
  assert.ok(
    tables
      .get('campaigns_translations')
      .every((row) => row.body.startsWith('<h2>')),
  )
  purposes[0].unit_amount_cents = 1234
  projects[0].status = 'published'
  projectTranslations[0].title = 'Editor changed title'
  projectTranslations.pop()
  await seed(request)
  assert.equal(purposes.length, 4)
  assert.equal(purposes[0].unit_amount_cents, 1234)
  assert.equal(projects.length, 3)
  assert.equal(projects[0].status, 'published')
  assert.equal(projectTranslations.length, 6)
  assert.equal(projectTranslations[0].title, 'Editor changed title')
})

test('HTTP client rejects invalid URLs, supplies a timeout and surfaces server errors', async (context) => {
  assert.throws(() => createClient('file:///etc/hosts'), /HTTP or HTTPS/)
  assert.throws(
    () => createClient('http://user:pass@localhost'),
    /environment credentials/,
  )
  context.mock.method(globalThis, 'fetch', async (_url, options) => {
    assert.ok(options.signal)
    assert.equal(options.headers.Authorization, 'Bearer synthetic-test-value')
    return new Response('{"errors":[{"message":"sensitive-detail"}]}', {
      status: 403,
    })
  })
  await assert.rejects(
    createClient('http://localhost', 'synthetic-test-value')('/items/donors'),
    (error) => {
      assert.match(error.message, /HTTP 403/)
      assert.ok(!error.message.includes('sensitive-detail'))
      return true
    },
  )
})
