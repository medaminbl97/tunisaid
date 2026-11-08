import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

let server
let api
let respond
let captured

const uuid = (group, index) =>
  `${group.repeat(8)}-${group.repeat(4)}-4${group.repeat(3)}-8${group.repeat(3)}-00000000000${index}`

function category(index, slug, status, sort) {
  return {
    id: uuid('1', index),
    slug,
    status,
    sort,
    translations: [
      {
        id: uuid('2', index),
        parent: uuid('1', index),
        language: 'en',
        title: `${slug} title`,
      },
    ],
  }
}

function purpose(index, slug, overrides = {}) {
  return {
    id: uuid('3', index),
    slug,
    status: 'published',
    unit_amount_cents: 1000 * index,
    currency: 'EUR',
    sort: index,
    is_illustrative: true,
    image: null,
    category: category(1, 'essentials', 'published', 2),
    project: null,
    translations: [
      {
        id: uuid('4', index),
        parent: uuid('3', index),
        language: 'en',
        title: `${slug} title`,
        category_label: null,
        description: 'Description',
        impact: null,
        unit_label: 'per kit',
        basket_title: null,
        image_alt: null,
      },
    ],
    ...overrides,
  }
}

function linkedProject(index, slug, status = 'published') {
  const id = uuid('5', index)
  return {
    id,
    slug,
    status,
    translations: [
      {
        id: uuid('6', index),
        parent: id,
        language: 'en',
        title: `${slug} project`,
        summary: null,
      },
    ],
  }
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
  api = await server.ssrLoadModule(
    '/src/api/collections/donation-purposes/queries.ts',
  )
  const { client } = await server.ssrLoadModule(
    '/src/api/generated/client.gen.ts',
  )
  client.setConfig({
    baseUrl: 'http://api.example.test',
    fetch: async (request) => {
      captured = request
      return respond(request)
    },
  })
})

after(async () => {
  await server?.close()
})

function reply(body, status = 200) {
  captured = undefined
  respond = () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
}

test('donation purposes request the published catalog in sort order', async () => {
  reply({ data: [purpose(1, 'koffa')] })
  const result = await api.getDonationPurposes('en')
  const url = new URL(captured.url)
  assert.equal(url.pathname, '/items/donation_purposes')
  assert.deepEqual(JSON.parse(url.searchParams.get('filter')), {
    status: { _eq: 'published' },
  })
  assert.equal(url.searchParams.get('sort'), 'sort,slug')
  assert.ok(
    url.searchParams.get('fields').includes('category.translations.title'),
  )
  assert.ok(
    url.searchParams.get('fields').includes('project.translations.title'),
  )
  assert.deepEqual(result, [
    {
      id: uuid('3', 1),
      slug: 'koffa',
      unitAmountCents: 1000,
      currency: 'EUR',
      isIllustrative: true,
      category: { slug: 'essentials', title: 'essentials title', sort: 2 },
      project: null,
      title: 'koffa title',
      categoryLabel: 'essentials title',
      description: 'Description',
      impact: null,
      unitLabel: 'per kit',
      basketTitle: 'koffa title',
      imageAlt: null,
    },
  ])
})

test('purposes hide untranslated items, draft categories and draft projects', async () => {
  reply({
    data: [
      purpose(1, 'koffa', {
        project: linkedProject(1, 'food'),
      }),
      purpose(2, 'wheelchair', {
        category: category(2, 'mobility', 'draft', 1),
        project: linkedProject(2, 'draft', 'draft'),
      }),
      purpose(3, 'german-only', {
        translations: [
          {
            id: uuid('4', 3),
            parent: uuid('3', 3),
            language: 'de',
            title: 'Nur Deutsch',
          },
        ],
      }),
    ],
  })
  const result = await api.getDonationPurposes('en')
  assert.deepEqual(
    result.map((item) => item.slug),
    ['koffa', 'wheelchair'],
  )
  assert.deepEqual(result[0].project, {
    slug: 'food',
    title: 'food project',
  })
  assert.equal(result[1].category, null)
  assert.equal(result[1].project, null)
})

test('categories are unique and ordered by sort then slug', () => {
  const make = (slug, sort) => ({ category: { slug, title: slug, sort } })
  assert.deepEqual(
    api
      .donationPurposeCategories([
        make('mobility', 2),
        make('education', null),
        make('essentials', 1),
        make('mobility', 2),
        { category: null },
      ])
      .map((item) => item.slug),
    ['essentials', 'mobility', 'education'],
  )
})

test('invalid catalog responses are rejected', async () => {
  reply({ data: [purpose(1, 'koffa', { unit_amount_cents: -5 })] })
  await assert.rejects(api.getDonationPurposes('en'))
  reply({ errors: [{ message: 'Forbidden' }] }, 403)
  await assert.rejects(api.getDonationPurposes('en'))
})
