import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { after, before, beforeEach, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

let server
let service
let signing
let config
let db

const now = new Date('2026-03-01T12:00:00.000Z')
const winterId = '11111111-1111-4111-8111-111111111111'
const springId = '22222222-2222-4222-8222-222222222222'
const project = {
  food: randomUUID(),
  mobility: randomUUID(),
  school: randomUUID(),
  shared: randomUUID(),
}

function purpose(slug, unitCents, projectId, title, status = 'published') {
  return {
    id: randomUUID(),
    slug,
    status,
    project: projectId,
    unit_amount_cents: unitCents,
    currency: 'EUR',
    translations: [{ language: 'en', title, basket_title: null }],
  }
}

function seed() {
  const koffa = purpose('koffa', 2500, project.food, 'Food basket')
  koffa.translations = [
    { language: 'en', title: 'Food basket', basket_title: 'Koffa' },
    { language: 'de', title: 'Lebensmittelkorb', basket_title: null },
  ]
  db = {
    donation_purposes: [
      koffa,
      purpose('wheelchair', 3000, project.mobility, 'Wheelchair share'),
      purpose('school-bag', 1500, project.school, 'School bag'),
      purpose('blanket', 1200, null, 'Blanket'),
      purpose('shared', 1000, project.shared, 'Shared project'),
      purpose('draft-purpose', 1000, null, 'Draft', 'draft'),
    ],
    campaigns: [
      {
        id: winterId,
        slug: 'winter',
        status: 'published',
        starts_at: '2026-01-01T00:00:00.000Z',
        ends_at: '2026-12-31T00:00:00.000Z',
        translations: [{ language: 'en', title: 'Winter appeal' }],
      },
      {
        id: springId,
        slug: 'spring',
        status: 'published',
        starts_at: '2026-04-01T00:00:00.000Z',
        ends_at: null,
        translations: [{ language: 'en', title: 'Spring appeal' }],
      },
      {
        id: randomUUID(),
        slug: 'ended',
        status: 'published',
        starts_at: '2025-01-01T00:00:00.000Z',
        ends_at: '2025-02-01T00:00:00.000Z',
        translations: [{ language: 'en', title: 'Ended appeal' }],
      },
    ],
    campaign_projects: [],
    donors: [],
    checkouts: [],
    donations: [],
    donation_items: [],
    payment_attempts: [],
    payment_events: [],
    refunds: [],
  }
  const link = (campaignSlug, projectId) =>
    db.campaign_projects.push({
      id: randomUUID(),
      campaign: db.campaigns.find((item) => item.slug === campaignSlug).id,
      project: projectId,
    })
  link('winter', project.food)
  link('spring', project.mobility)
  link('ended', project.school)
  link('winter', project.shared)
  link('spring', project.shared)
}

// Many-to-one fields the service filters or expands through.
const references = {
  campaign_projects: { campaign: 'campaigns' },
  donations: { checkout: 'checkouts', campaign: 'campaigns' },
  donation_items: { donation: 'donations' },
  refunds: { donation: 'donations' },
}

function related(collection, key, id) {
  const target = references[collection]?.[key]
  return target ? db[target].find((row) => row.id === id) : undefined
}

function matches(collection, row, filter) {
  return Object.entries(filter).every(([key, condition]) => {
    if (key === '_and') {
      return condition.every((part) => matches(collection, row, part))
    }
    const value = row[key]
    if (!('_eq' in condition) && !('_in' in condition)) {
      const target = references[collection][key]
      const linked = related(collection, key, value)
      return Boolean(linked) && matches(target, linked, condition)
    }
    return Object.entries(condition).every(([operator, expected]) => {
      if (operator === '_eq') return value === expected
      if (operator === '_in') return expected.includes(value)
      throw new Error(`Unsupported operator ${operator}`)
    })
  })
}

function expand(collection, row) {
  if (collection === 'campaign_projects') {
    return { ...row, campaign: related(collection, 'campaign', row.campaign) }
  }
  if (collection === 'donation_items') {
    const donation = related(collection, 'donation', row.donation)
    const campaign = related('donations', 'campaign', donation.campaign)
    return {
      ...row,
      donation: {
        campaign: campaign
          ? { slug: campaign.slug, translations: campaign.translations }
          : null,
      },
    }
  }
  if (collection === 'refunds') {
    const donation = related(collection, 'donation', row.donation)
    return { ...row, donation: { campaign: donation.campaign } }
  }
  return row
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function fakeDirectus(input, init = {}) {
  const request = input instanceof Request ? input : new Request(input, init)
  assert.equal(request.headers.get('authorization'), 'Bearer service-token')
  const url = new URL(request.url)
  const [, , collection, id] = url.pathname.split('/')
  const rows = db[collection]
  assert.ok(rows, `Unexpected collection ${collection}`)
  const filter = JSON.parse(url.searchParams.get('filter') ?? '{}')

  if (request.method === 'GET' && url.searchParams.has('aggregate[sum]')) {
    const groups = new Map()
    for (const row of rows.filter((item) =>
      matches(collection, item, filter),
    )) {
      const group = groups.get(row.campaign) ?? { sum: 0, count: 0 }
      group.sum += row.total_cents
      group.count += 1
      groups.set(row.campaign, group)
    }
    return json({
      data: [...groups].map(([campaign, group]) => ({
        campaign,
        sum: { total_cents: String(group.sum) },
        count: { id: String(group.count) },
      })),
    })
  }
  if (request.method === 'GET') {
    return json({
      data: rows
        .filter((row) => matches(collection, row, filter))
        .map((row) => expand(collection, row)),
    })
  }
  const body = JSON.parse(await request.text())
  if (request.method === 'POST') {
    const created = (Array.isArray(body) ? body : [body]).map((item) => {
      if (
        collection === 'payment_events' &&
        rows.some((row) => row.provider_event_key === item.provider_event_key)
      ) {
        return null
      }
      return { id: randomUUID(), ...item }
    })
    if (created.includes(null)) {
      return json(
        { errors: [{ extensions: { code: 'RECORD_NOT_UNIQUE' } }] },
        400,
      )
    }
    rows.push(...created)
    return json({ data: Array.isArray(body) ? created : created[0] })
  }
  if (request.method === 'PATCH') {
    const row = rows.find((item) => item.id === id)
    Object.assign(row, body)
    return json({ data: row })
  }
  throw new Error(`Unexpected ${request.method} ${url}`)
}

before(async () => {
  server = await createServer({
    configFile: false,
    appType: 'custom',
    server: { middlewareMode: true },
    resolve: {
      alias: { '#': fileURLToPath(new URL('../src', import.meta.url)) },
    },
  })
  service = await server.ssrLoadModule('/src/server/donations/service.ts')
  signing = await server.ssrLoadModule('/src/server/donations/signing.ts')
  config = await server.ssrLoadModule('/src/server/donations/config.ts')
})

after(async () => {
  await server?.close()
})

beforeEach(seed)

function donationService() {
  return service.createDonationService({
    directusUrl: 'http://directus.test',
    serviceToken: 'service-token',
    fetch: fakeDirectus,
    now: () => now,
    createReference: () => 'TA-ABCDEFGHJKLM',
  })
}

const checkout = (overrides = {}) => ({
  language: 'en',
  items: [{ slug: 'koffa', quantity: 2, unitCents: 2500 }],
  flexibleCents: 1000,
  expectedTotalCents: 6000,
  donor: { keepNamePrivate: true },
  ...overrides,
})

const shares = () =>
  db.donations.map((donation) => ({
    campaign:
      db.campaigns.find((item) => item.id === donation.campaign)?.slug ?? null,
    total: donation.total_cents,
    items: db.donation_items
      .filter((item) => item.donation === donation.id)
      .map((item) => item.title_snapshot),
  }))

test('checkout splits one payment into one donation per campaign', async () => {
  const result = await donationService().createCheckout(
    checkout({
      items: [
        { slug: 'koffa', quantity: 2, unitCents: 2500 },
        { slug: 'wheelchair', quantity: 1, unitCents: 3000 },
        { slug: 'school-bag', quantity: 1, unitCents: 1500 },
        { slug: 'blanket', quantity: 1, unitCents: 1200 },
      ],
      expectedTotalCents: 11700,
    }),
    'mock',
  )
  assert.equal(result.ok, true)
  assert.equal(result.reference, 'TA-ABCDEFGHJKLM')
  assert.equal(db.donors.length, 0)
  assert.equal(db.checkouts.length, 1)
  assert.deepEqual(
    {
      reference: db.checkouts[0].reference,
      status: db.checkouts[0].status,
      total: db.checkouts[0].total_cents,
      donor: db.checkouts[0].donor,
    },
    {
      reference: 'TA-ABCDEFGHJKLM',
      status: 'pending',
      total: 11700,
      donor: null,
    },
  )
  // The ended campaign no longer accepts gifts; flexible support is general.
  assert.deepEqual(shares(), [
    { campaign: 'winter', total: 5000, items: ['Koffa'] },
    { campaign: 'spring', total: 3000, items: ['Wheelchair share'] },
    {
      campaign: null,
      total: 3700,
      items: ['School bag', 'Blanket', 'Flexible support'],
    },
  ])
  assert.ok(db.donations.every((item) => item.checkout === db.checkouts[0].id))
  assert.ok(db.donation_items.every((item) => !('project' in item)))
  assert.equal(db.payment_attempts.length, 1)
  assert.equal(db.payment_attempts[0].checkout, db.checkouts[0].id)
  assert.equal(db.payment_attempts[0].status, 'pending')
  assert.equal(db.payment_attempts[0].amount_cents, 11700)
  assert.equal(result.attemptId, db.payment_attempts[0].id)
})

test('checkout stores optional donor details normalized', async () => {
  await donationService().createCheckout(
    checkout({
      language: 'de',
      donor: {
        name: '  Amina ',
        email: ' Amina@Example.ORG ',
        countryCode: 'DE',
        keepNamePrivate: false,
      },
    }),
    'mock',
  )
  assert.deepEqual(
    {
      name: db.donors[0].display_name,
      email: db.donors[0].email,
      country: db.donors[0].country_code,
      language: db.donors[0].preferred_language,
    },
    {
      name: 'Amina',
      email: 'amina@example.org',
      country: 'DE',
      language: 'de',
    },
  )
  assert.equal(db.checkouts[0].donor, db.donors[0].id)
  assert.deepEqual(
    db.donation_items.map((item) => item.title_snapshot),
    ['Lebensmittelkorb', 'Flexible Unterstützung'],
  )
})

test('checkout rejects stale prices, drafts, bad totals and campaign conflicts', async () => {
  const api = donationService()
  const cases = [
    [
      checkout({ items: [{ slug: 'koffa', quantity: 2, unitCents: 2000 }] }),
      'catalog_changed',
    ],
    [
      checkout({
        items: [{ slug: 'draft-purpose', quantity: 1, unitCents: 1000 }],
        flexibleCents: 0,
        expectedTotalCents: 1000,
      }),
      'catalog_changed',
    ],
    [checkout({ expectedTotalCents: 5000 }), 'catalog_changed'],
    [
      checkout({
        items: [{ slug: 'shared', quantity: 1, unitCents: 1000 }],
        flexibleCents: 0,
        expectedTotalCents: 1000,
      }),
      'campaign_conflict',
    ],
  ]
  for (const [input, code] of cases) {
    assert.deepEqual(await api.createCheckout(input, 'mock'), {
      ok: false,
      code,
    })
  }
  await assert.rejects(
    api.createCheckout(
      checkout({ items: [], flexibleCents: 50, expectedTotalCents: 50 }),
      'mock',
    ),
  )
  assert.equal(db.checkouts.length, 0)
  assert.equal(db.donations.length, 0)
})

test('payment events are deduplicated and only move open records forward', async () => {
  const api = donationService()
  const { attemptId } = await api.createCheckout(checkout(), 'mock')
  const event = (outcome) =>
    api.recordPaymentEvent({
      provider: 'mock',
      eventId: `${attemptId}:${outcome}`,
      attemptId,
      outcome,
    })

  assert.deepEqual(await event('succeeded'), {
    duplicate: false,
    applied: true,
  })
  assert.equal(db.payment_attempts[0].status, 'succeeded')
  assert.equal(db.checkouts[0].status, 'paid')
  assert.equal(db.checkouts[0].paid_at, now.toISOString())
  assert.equal(db.payment_events[0].status, 'processed')

  assert.deepEqual(await event('succeeded'), {
    duplicate: true,
    applied: false,
  })
  assert.deepEqual(await event('failed'), { duplicate: false, applied: false })
  assert.equal(db.checkouts[0].status, 'paid')
  assert.equal(db.payment_events.length, 2)
  assert.equal(db.payment_events[1].error_code, 'stale_transition')
})

test('a received event left behind by a crash is reprocessed', async () => {
  const api = donationService()
  const { attemptId } = await api.createCheckout(checkout(), 'mock')
  db.payment_events.push({
    id: randomUUID(),
    provider_event_key: `mock:${attemptId}:failed`,
    status: 'received',
  })
  const result = await api.recordPaymentEvent({
    provider: 'mock',
    eventId: `${attemptId}:failed`,
    attemptId,
    outcome: 'failed',
  })
  assert.deepEqual(result, { duplicate: false, applied: true })
  assert.equal(db.payment_attempts[0].failure_code, 'mock_declined')
  assert.equal(db.checkouts[0].status, 'failed')
})

test('receipts show each line with its campaign and no donor details', async () => {
  const api = donationService()
  const { attemptId, reference } = await api.createCheckout(
    checkout({
      items: [
        { slug: 'koffa', quantity: 2, unitCents: 2500 },
        { slug: 'wheelchair', quantity: 1, unitCents: 3000 },
      ],
      expectedTotalCents: 9000,
      donor: { email: 'a@example.org', keepNamePrivate: true },
    }),
    'mock',
  )
  assert.deepEqual(await api.getMockPayment(attemptId), {
    reference,
    amountCents: 9000,
    currency: 'EUR',
    status: 'pending',
  })
  const receipt = await api.getReceipt(reference)
  assert.equal(receipt.status, 'pending')
  assert.equal(receipt.totalCents, 9000)
  assert.deepEqual(
    receipt.items.map((item) => [item.kind, item.campaign?.slug ?? null]),
    [
      ['purpose', 'winter'],
      ['purpose', 'spring'],
      ['flexible', null],
    ],
  )
  assert.deepEqual(receipt.items[0].campaign.titles, { en: 'Winter appeal' })
  assert.doesNotMatch(JSON.stringify(receipt), /example\.org/)
  assert.equal(await api.getReceipt('TA-MISSINGMISSI'), null)
  assert.equal(await api.getMockPayment(randomUUID()), null)
})

function paidShare(campaign, totalCents, status = 'paid') {
  const checkoutRow = { id: randomUUID(), status, total_cents: totalCents }
  const donation = {
    id: randomUUID(),
    checkout: checkoutRow.id,
    campaign,
    total_cents: totalCents,
  }
  db.checkouts.push(checkoutRow)
  db.donations.push(donation)
  return donation
}

test('campaign raised totals count paid shares minus succeeded refunds', async () => {
  const api = donationService()
  const first = paidShare(winterId, 5000)
  const second = paidShare(winterId, 2000)
  paidShare(winterId, 9000, 'pending')
  paidShare(springId, 3000)
  paidShare(null, 4000)
  db.refunds.push(
    {
      id: randomUUID(),
      donation: second.id,
      status: 'succeeded',
      amount_cents: 2000,
    },
    {
      id: randomUUID(),
      donation: first.id,
      status: 'failed',
      amount_cents: 1000,
    },
  )
  assert.deepEqual(
    await api.getCampaignRaised(['winter', 'spring', 'ended', 'unknown']),
    {
      winter: { raisedCents: 5000, donationCount: 2 },
      spring: { raisedCents: 3000, donationCount: 1 },
      ended: { raisedCents: 0, donationCount: 0 },
    },
  )
})

test('receipt refund state is derived from refunds across the checkout', async () => {
  assert.equal(service.receiptStatus('pending', 1000, 1000), 'pending')
  assert.equal(service.receiptStatus('paid', 1000, 0), 'paid')
  assert.equal(service.receiptStatus('paid', 1000, 400), 'partially_refunded')
  assert.equal(service.receiptStatus('paid', 1000, 1000), 'refunded')

  const api = donationService()
  const winterShare = paidShare(winterId, 600)
  const generalShare = { ...paidShare(null, 400) }
  const checkoutRow = db.checkouts.find(
    (item) => item.id === winterShare.checkout,
  )
  Object.assign(checkoutRow, {
    reference: 'TA-REFUNDREFUND',
    currency: 'EUR',
    total_cents: 1000,
  })
  db.donations.find((item) => item.id === generalShare.id).checkout =
    checkoutRow.id
  db.refunds.push(
    {
      id: randomUUID(),
      donation: winterShare.id,
      status: 'succeeded',
      amount_cents: 600,
    },
    {
      id: randomUUID(),
      donation: generalShare.id,
      status: 'pending',
      amount_cents: 400,
    },
  )
  assert.equal(
    (await api.getReceipt(checkoutRow.reference)).status,
    'partially_refunded',
  )
  db.refunds[1].status = 'succeeded'
  assert.equal((await api.getReceipt(checkoutRow.reference)).status, 'refunded')
  assert.equal(checkoutRow.status, 'paid')
})

test('signed tokens are bound to purpose and value', () => {
  const token = signing.signValue('s'.repeat(32), 'attempt', 'abc')
  assert.equal(
    signing.verifyValue('s'.repeat(32), 'attempt', 'abc', token),
    true,
  )
  assert.equal(
    signing.verifyValue('s'.repeat(32), 'donation', 'abc', token),
    false,
  )
  assert.equal(
    signing.verifyValue('s'.repeat(32), 'attempt', 'abd', token),
    false,
  )
  assert.equal(
    signing.verifyValue('t'.repeat(32), 'attempt', 'abc', token),
    false,
  )
  assert.equal(
    signing.verifyValue('s'.repeat(32), 'attempt', 'abc', 'short'),
    false,
  )
})

test('donation config requires credentials and blocks mock payments in production', () => {
  const env = {
    DIRECTUS_SERVICE_TOKEN: 'x'.repeat(32),
    DONATION_SIGNING_SECRET: 'y'.repeat(32),
    PAYMENT_PROVIDER: 'mock',
  }
  assert.equal(config.readDonationConfig(env).enabled, true)
  assert.deepEqual(
    config.readDonationConfig({ ...env, DONATION_SIGNING_SECRET: '' }),
    {
      enabled: false,
      reason: 'missing_credentials',
    },
  )
  assert.deepEqual(
    config.readDonationConfig({ ...env, NODE_ENV: 'production' }),
    {
      enabled: false,
      reason: 'mock_in_production',
    },
  )
  assert.equal(
    config.readDonationConfig({
      ...env,
      NODE_ENV: 'production',
      ALLOW_MOCK_PAYMENTS: 'true',
    }).enabled,
    true,
  )
})
