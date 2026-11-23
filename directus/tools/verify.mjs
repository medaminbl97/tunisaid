import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import {
  loadDefinitions,
  loginAsAdmin,
  waitForDirectus,
} from '../scripts/apply-schemas.js'
import { loadSeeds } from '../scripts/seed-data.js'

// Live check of a running, freshly synchronized backend. It reads the same
// YAML the image bakes in, so the expectations cannot drift from the schemas.
const baseUrl = (process.env.DIRECTUS_URL ??= 'http://127.0.0.1:8056')
const dir = (name) => fileURLToPath(new URL(`../${name}/`, import.meta.url))

const definitions = await loadDefinitions(dir('schemas'))
const reference = await loadSeeds(dir('seeds'), 'reference', definitions)
const examples = await loadSeeds(dir('seeds'), 'examples', definitions)
const withExamples = process.env.CMS_ENV === 'dev'
const seedStatus =
  process.env.SEED_PUBLISH_DEMO === 'true' ? 'published' : 'draft'

await waitForDirectus()
const token = await loginAsAdmin()

async function request(path, { method = 'GET', body } = {}) {
  const response = await fetch(new URL(path, baseUrl), {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) {
    throw new Error(
      `${method} ${path.split('?')[0]} failed: HTTP ${response.status}`,
    )
  }
  if (response.status === 204) return undefined
  return (await response.json()).data
}

function anonymous(path, method = 'GET') {
  return fetch(new URL(path, baseUrl), {
    method,
    ...(method === 'POST'
      ? { headers: { 'Content-Type': 'application/json' }, body: '{}' }
      : {}),
    signal: AbortSignal.timeout(10_000),
  })
}

const existing = new Set(
  (await request('/collections')).map((item) => item.collection),
)
for (const definition of definitions) {
  assert.ok(existing.has(definition.collection), definition.collection)
}
assert.ok(
  !existing.has('backend_migrations'),
  'The API migration ledger no longer exists',
)

const relations = new Map(
  (await request('/relations')).map((item) => [
    `${item.collection}.${item.field}`,
    item,
  ]),
)
let relationCount = 0
for (const definition of definitions) {
  for (const expected of definition.relations ?? []) {
    const key = `${definition.collection}.${expected.field}`
    const actual = relations.get(key)
    assert.equal(actual?.related_collection, expected.related_collection, key)
    assert.equal(actual.schema.on_delete, expected.schema.on_delete, key)
    assert.equal(actual.meta.one_field, expected.meta.one_field, key)
    assert.equal(actual.meta.junction_field, expected.meta.junction_field, key)
    relationCount++
  }
}

let richTextCount = 0
for (const definition of definitions) {
  for (const field of definition.fields) {
    const live = await request(
      `/fields/${definition.collection}/${field.field}`,
    )
    assert.equal(
      live.type,
      field.type,
      `${definition.collection}.${field.field}`,
    )
    assert.equal(
      live.meta?.interface,
      field.meta?.interface,
      `${definition.collection}.${field.field} interface`,
    )
    if (field.meta?.interface === 'input-rich-text-html') {
      assert.equal(live.type, 'text')
      assert.ok(live.meta.options.toolbar.includes('bold'))
      richTextCount++
    }
  }
}
assert.ok(richTextCount >= 3, 'Rich-text fields are present')

const publicReadable = new Set([
  'projects',
  'projects_translations',
  'campaigns',
  'campaigns_translations',
  'campaign_projects',
  'categories',
  'categories_translations',
  'donation_purposes',
  'donation_purposes_translations',
])
for (const { collection } of definitions) {
  for (const method of ['GET', 'POST']) {
    const response = await anonymous(`/items/${collection}?limit=1`, method)
    if (method === 'GET' && publicReadable.has(collection)) {
      assert.equal(response.status, 200, `Anonymous GET ${collection}`)
      continue
    }
    assert.ok(
      [401, 403].includes(response.status),
      `Anonymous ${method} ${collection} returned ${response.status}`,
    )
  }
}

// Every baked-in seed row exists with the YAML values. Only example rows
// carry a status; they follow SEED_PUBLISH_DEMO.
let seedCount = 0
async function checkSeeds(seeds, expectedStatus) {
  for (const { collection, key, items } of seeds) {
    const rows = await request(`/items/${collection}?limit=-1&fields=*`)
    for (const item of items) {
      const row = rows.find((candidate) => candidate[key] === item[key])
      assert.ok(row, `${collection} seed ${item[key]} is missing`)
      for (const [name, value] of Object.entries(item)) {
        const expected =
          name === 'status' && value === 'draft' ? expectedStatus : value
        const label = `${collection}.${name} of ${item[key]}`
        // Directus returns timestamps in UTC; compare the instant.
        if (/^\d{4}-\d\d-\d\dT/.test(String(expected))) {
          assert.equal(
            new Date(row[name]).getTime(),
            new Date(expected).getTime(),
            label,
          )
        } else {
          assert.equal(row[name], expected, label)
        }
      }
      seedCount++
    }
  }
}
await checkSeeds(reference, 'published')
if (withExamples) await checkSeeds(examples, seedStatus)

function asService(path, method = 'GET', body) {
  return fetch(new URL(path, process.env.DIRECTUS_URL), {
    method,
    headers: {
      Authorization: `Bearer ${process.env.DONATION_SERVICE_TOKEN}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(10_000),
  })
}

const serviceChecked = Boolean(process.env.DONATION_SERVICE_TOKEN)
if (serviceChecked) {
  assert.equal(
    (await asService('/items/donation_purposes?fields=id&limit=1')).status,
    200,
  )
  for (const path of [
    '/items/donors?fields=email&limit=1',
    '/items/refunds?fields=reason&limit=1',
    '/users?limit=1',
  ]) {
    assert.equal((await asService(path)).status, 403, `Service GET ${path}`)
  }
  for (const [path, body] of [
    ['/items/refunds', {}],
    [
      '/items/checkouts',
      {
        reference: `invalid-${randomUUID()}`,
        status: 'paid',
        total_cents: 1000,
      },
    ],
  ]) {
    const response = await asService(path, 'POST', body)
    assert.ok(
      [400, 403].includes(response.status),
      `Service POST ${path} returned ${response.status}`,
    )
  }
}

const cleanup = []
async function create(name, body) {
  const item = await request(`/items/${name}`, { method: 'POST', body })
  cleanup.unshift([name, item.id])
  return item
}

try {
  const project = await create('projects', {
    slug: `verification-${randomUUID()}`,
    status: 'draft',
  })
  const richBody =
    '<h2>Synthetic heading</h2><p><strong>Formatted content</strong></p><p><img src="/assets/synthetic-image" alt="Synthetic image"></p>'
  const translation = await create('projects_translations', {
    parent: project.id,
    language: 'en',
    title: 'Synthetic verification fixture',
    body: richBody,
  })
  assert.equal(
    (await request(`/items/projects_translations/${translation.id}`)).body,
    richBody,
  )
  const published = await create('projects', {
    slug: `verification-${randomUUID()}`,
    status: 'published',
  })
  await create('projects_translations', {
    parent: published.id,
    language: 'en',
    title: 'Synthetic published fixture',
  })
  const visible = await (
    await anonymous(
      '/items/projects?fields=id,status,translations.title&limit=-1',
    )
  ).json()
  assert.ok(visible.data.every((row) => row.status === 'published'))
  assert.ok(visible.data.some((row) => row.id === published.id))
  assert.ok(!visible.data.some((row) => row.id === project.id))
  assert.equal(
    (await anonymous(`/items/projects_translations/${translation.id}`)).status,
    403,
  )
  const exposed = await (
    await anonymous(`/items/projects/${published.id}?fields=*`)
  ).json()
  assert.deepEqual(Object.keys(exposed.data).sort(), [
    'cover_image',
    'ends_at',
    'id',
    'slug',
    'starts_at',
    'status',
    'translations',
  ])
  const publicCampaign = await create('campaigns', {
    slug: `verification-${randomUUID()}`,
    status: 'published',
    goal_cents: 1000,
  })
  const draftCampaign = await create('campaigns', {
    slug: `verification-${randomUUID()}`,
    status: 'draft',
    goal_cents: 1000,
  })
  await create('campaign_projects', {
    campaign: publicCampaign.id,
    project: published.id,
  })
  await create('campaign_projects', {
    campaign: publicCampaign.id,
    project: project.id,
  })
  const exposedCampaign = await (
    await anonymous(
      `/items/campaigns/${publicCampaign.id}?fields=*,projects.project.id`,
    )
  ).json()
  assert.deepEqual(Object.keys(exposedCampaign.data).sort(), [
    'cover_image',
    'currency',
    'ends_at',
    'goal_cents',
    'id',
    'projects',
    'slug',
    'starts_at',
    'status',
    'translations',
  ])
  assert.deepEqual(
    exposedCampaign.data.projects.map((item) => item.project.id),
    [published.id],
  )
  assert.equal(
    (await anonymous(`/items/campaigns/${draftCampaign.id}`)).status,
    403,
  )
  const publicCategory = await create('categories', {
    slug: `verification-${randomUUID()}`,
    status: 'published',
  })
  const publicPurpose = await create('donation_purposes', {
    slug: `verification-${randomUUID()}`,
    status: 'published',
    category: publicCategory.id,
    unit_amount_cents: 1000,
  })
  const draftPurpose = await create('donation_purposes', {
    slug: `verification-${randomUUID()}`,
    status: 'draft',
    unit_amount_cents: 1000,
  })
  const exposedPurpose = await (
    await anonymous(
      `/items/donation_purposes/${publicPurpose.id}?fields=*,category.slug`,
    )
  ).json()
  assert.deepEqual(Object.keys(exposedPurpose.data).sort(), [
    'category',
    'currency',
    'id',
    'image',
    'is_illustrative',
    'project',
    'slug',
    'sort',
    'status',
    'translations',
    'unit_amount_cents',
  ])
  assert.equal(exposedPurpose.data.category.slug, publicCategory.slug)
  assert.equal(
    (await anonymous(`/items/donation_purposes/${draftPurpose.id}`)).status,
    403,
  )
  const checkout = await create('checkouts', {
    reference: `verification-${randomUUID()}`,
    total_cents: 1000,
  })
  assert.equal(checkout.status, 'pending')
  const donation = await create('donations', {
    checkout: checkout.id,
    campaign: publicCampaign.id,
    total_cents: 1000,
  })
  const item = await create('donation_items', {
    donation: donation.id,
    kind: 'flexible',
    title_snapshot: 'Synthetic verification fixture',
    quantity: 1,
    unit_amount_cents: 1000,
    total_cents: 1000,
  })
  assert.equal(item.donation, donation.id)
  for (const path of [
    `/items/donations/${donation.id}`,
    `/items/checkouts/${checkout.id}`,
  ]) {
    await assert.rejects(
      request(path, { method: 'DELETE' }),
      /HTTP (400|409|500)/,
    )
  }
  await assert.rejects(
    request('/items/checkouts', {
      method: 'POST',
      body: { reference: `invalid-${randomUUID()}`, total_cents: -1 },
    }),
    /HTTP 400/,
  )
  await assert.rejects(
    request('/items/checkouts', {
      method: 'POST',
      body: { reference: `invalid-${randomUUID()}`, status: 'invented' },
    }),
    /HTTP 400/,
  )
  const key = `verification:${randomUUID()}`
  await create('payment_events', {
    provider: 'synthetic',
    provider_event_key: key,
    event_type: 'verification',
  })
  await assert.rejects(
    request('/items/payment_events', {
      method: 'POST',
      body: {
        provider: 'synthetic',
        provider_event_key: key,
        event_type: 'verification',
      },
    }),
    /HTTP (400|409)/,
  )

  const paidCheckout = await create('checkouts', {
    reference: `verification-${randomUUID()}`,
    status: 'paid',
    total_cents: 1000,
  })
  const paid = await create('donations', {
    checkout: paidCheckout.id,
    total_cents: 1000,
  })
  const paidAttempt = await create('payment_attempts', {
    checkout: paidCheckout.id,
    provider: 'synthetic',
    provider_payment_id: `synthetic_${randomUUID()}`,
    idempotency_key: `verification:${randomUUID()}`,
    status: 'succeeded',
    amount_cents: 1000,
  })
  await create('refunds', {
    donation: paid.id,
    payment_attempt: paidAttempt.id,
    provider: 'synthetic',
    idempotency_key: `verification:${randomUUID()}`,
    amount_cents: 400,
    status: 'succeeded',
  })
  // Owned rows follow their parent: translations and campaign links cascade.
  const disposable = await request('/items/projects', {
    method: 'POST',
    body: { slug: `verification-${randomUUID()}`, status: 'draft' },
  })
  const ownedTranslation = await request('/items/projects_translations', {
    method: 'POST',
    body: { parent: disposable.id, language: 'en', title: 'Disposable' },
  })
  const ownedLink = await request('/items/campaign_projects', {
    method: 'POST',
    body: { campaign: publicCampaign.id, project: disposable.id },
  })
  await request(`/items/projects/${disposable.id}`, { method: 'DELETE' })
  await assert.rejects(
    request(`/items/projects_translations/${ownedTranslation.id}`),
    /HTTP (403|404)/,
  )
  await assert.rejects(
    request(`/items/campaign_projects/${ownedLink.id}`),
    /HTTP (403|404)/,
  )

  // Refund state is derived from the relation; the stored status stays paid.
  const linked = await request(
    `/items/donations/${paid.id}?fields=checkout.status,refunds.amount_cents`,
  )
  assert.equal(linked.checkout.status, 'paid')
  assert.deepEqual(
    linked.refunds.map((refund) => refund.amount_cents),
    [400],
  )
  await assert.rejects(
    request('/items/checkouts', {
      method: 'POST',
      body: {
        reference: `invalid-${randomUUID()}`,
        status: 'partially_refunded',
      },
    }),
    /HTTP 400/,
  )
} finally {
  for (const [name, id] of cleanup)
    await request(`/items/${name}/${id}`, { method: 'DELETE' })
}

console.log(
  `Verified ${definitions.length} collections, ${relationCount} relations, ${richTextCount} rich-text fields, ${seedCount} seed rows, public read limited to published content, amount/status validation, event deduplication, deletion protection and derived refund state${serviceChecked ? ', plus least-privilege service access' : ''}. Synthetic fixtures removed.`,
)

// The SDK's token refresh timer would otherwise keep the process alive.
process.exit(0)
