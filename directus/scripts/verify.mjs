import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { authenticate } from './client.mjs'
import {
  collections as definitions,
  relations as expectedRelations,
  translatedCollections,
} from '../migrations/001-initial-schema.mjs'
import { campaignSeeds } from '../seeds/campaigns.mjs'
import { projectSeeds } from '../seeds/projects.mjs'

const request = await authenticate()
const existing = new Set(
  (await request('/collections')).map((item) => item.collection),
)
for (const definition of definitions)
  assert.ok(existing.has(definition.collection), definition.collection)

const relations = new Map(
  (await request('/relations')).map((item) => [
    `${item.collection}.${item.field}`,
    item,
  ]),
)
for (const expected of expectedRelations) {
  const key = `${expected.collection}.${expected.field}`
  const actual = relations.get(key)
  assert.equal(actual?.related_collection, expected.related_collection, key)
  assert.equal(actual.schema.on_delete, expected.schema.on_delete, key)
  assert.equal(actual.meta.one_field, expected.meta.one_field, key)
}
for (const removed of [
  'allocations',
  'material_donations',
  'material_donation_events',
  'project_partners',
  'project_updates',
]) {
  assert.ok(!existing.has(removed), `${removed} must not exist`)
}

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
const seedStatus =
  process.env.SEED_PUBLISH_DEMO === 'true' ? 'published' : 'draft'

function anonymous(path, method = 'GET') {
  return fetch(new URL(path, process.env.DIRECTUS_URL), {
    method,
    ...(method === 'POST'
      ? { headers: { 'Content-Type': 'application/json' }, body: '{}' }
      : {}),
    signal: AbortSignal.timeout(10_000),
  })
}

for (const name of [
  ...definitions.map((item) => item.collection),
  'backend_migrations',
]) {
  for (const method of ['GET', 'POST']) {
    const response = await anonymous(`/items/${name}?limit=1`, method)
    if (method === 'GET' && publicReadable.has(name)) {
      assert.equal(response.status, 200, `Anonymous GET ${name}`)
      continue
    }
    assert.ok(
      [401, 403].includes(response.status),
      `Anonymous ${method} ${name} returned ${response.status}`,
    )
  }
}

const categories = await request('/items/categories?limit=-1')
for (const slug of ['essentials', 'mobility', 'education']) {
  const matches = categories.filter((item) => item.slug === slug)
  assert.equal(matches.length, 1)
  assert.equal(matches[0].status, seedStatus)
}
const purposes = await request(
  '/items/donation_purposes?fields=*,project.slug&limit=-1',
)
for (const [slug, cents, project] of [
  ['koffa', 3500, 'ramadan-food-boxes'],
  ['wheelchair', 3000, 'wheelchairs-for-students'],
  ['school', 2500, 'school-supplies-support'],
  ['warmth', 4500, null],
]) {
  const matches = purposes.filter((item) => item.slug === slug)
  assert.equal(matches.length, 1)
  assert.equal(matches[0].unit_amount_cents, cents)
  assert.equal(matches[0].status, seedStatus)
  assert.equal(matches[0].is_illustrative, true)
  if (seedStatus === 'published') {
    assert.equal(matches[0].project?.slug ?? null, project)
  }
}
assert.equal(
  (await request('/items/donation_purposes_translations?limit=-1')).length,
  8,
)
assert.equal((await request('/items/backend_migrations?limit=-1')).length, 1)

for (const [collection, name] of [
  ['projects_translations', 'body'],
  ['campaigns_translations', 'body'],
  ['donation_purposes_translations', 'description'],
]) {
  const richField = await request(`/fields/${collection}/${name}`)
  assert.equal(richField.type, 'text')
  assert.equal(richField.meta.interface, 'input-rich-text-html')
  assert.ok(richField.meta.options.toolbar.includes('bold'))
}
for (const row of await request(
  '/items/donation_purposes_translations?fields=description&limit=-1',
)) {
  assert.match(row.description, /^<p>/)
}

const projects = await request('/items/projects?limit=-1')
const projectTranslations = await request(
  '/items/projects_translations?limit=-1',
)
for (const definition of projectSeeds) {
  const matches = projects.filter((item) => item.slug === definition.slug)
  assert.equal(matches.length, 1)
  assert.equal(matches[0].status, seedStatus)
  const copies = projectTranslations.filter(
    (item) => item.parent === matches[0].id,
  )
  assert.equal(copies.length, 2)
  for (const [language, expected] of Object.entries(definition.translations)) {
    const copy = copies.find((item) => item.language === language)
    assert.equal(copy?.title, expected.title)
    assert.equal(copy?.summary, expected.summary)
    assert.ok(copy?.body.includes('https://tunisaid.org/'))
    assert.match(copy.body, /<p>/)
  }
}

const campaigns = await request('/items/campaigns?limit=-1')
const campaignTranslations = await request(
  '/items/campaigns_translations?limit=-1',
)
const campaignProjects = await request(
  '/items/campaign_projects?fields=campaign,project.slug&limit=-1',
)
for (const definition of campaignSeeds) {
  const matches = campaigns.filter((item) => item.slug === definition.slug)
  assert.equal(matches.length, 1)
  assert.equal(matches[0].status, seedStatus)
  assert.equal(matches[0].goal_cents, definition.goalCents)
  const copies = campaignTranslations.filter(
    (item) => item.parent === matches[0].id,
  )
  assert.deepEqual(copies.map((item) => item.language).sort(), ['de', 'en'])
  for (const copy of copies) assert.match(copy.body, /<h2>/)
  assert.deepEqual(
    campaignProjects
      .filter((item) => item.campaign === matches[0].id)
      .map((item) => item.project.slug)
      .sort(),
    [...definition.projects].sort(),
  )
}

for (const parent of Object.keys(translatedCollections)) {
  const field = await request(`/fields/${parent}/translations`)
  assert.equal(field.meta.interface, 'translations')
  assert.equal(field.meta.options.languageField, 'name')
  assert.equal(
    relations.get(`${parent}_translations.parent`).meta.junction_field,
    'language',
  )
  assert.equal(
    relations.get(`${parent}_translations.language`).meta.junction_field,
    'parent',
  )
}
for (const [parent, alias, owner, target] of [
  ['campaigns', 'projects', 'campaign', 'project'],
  ['projects', 'campaigns', 'project', 'campaign'],
]) {
  const field = await request(`/fields/${parent}/${alias}`)
  assert.equal(field.meta.interface, 'list-m2m')
  assert.equal(
    relations.get(`campaign_projects.${owner}`).meta.junction_field,
    target,
  )
}

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
  `Verified ${definitions.length} collections (public read limited to published projects, campaigns and donation purposes), all relations, seeded catalog, amount/status validation, event deduplication, deletion protection, derived refund state${serviceChecked ? ' and least-privilege service access' : ''}. Synthetic fixtures removed.`,
)
