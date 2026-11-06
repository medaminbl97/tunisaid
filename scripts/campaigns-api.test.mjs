import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

let server
let api
let respond
let captured

const id = '11111111-1111-4111-8111-111111111111'
const translation = {
  id: '22222222-2222-4222-8222-222222222222',
  parent: id,
  language: 'en',
  title: 'An inclusive school year',
  summary: 'Campaign summary',
  body: '<h2>Why</h2><p>Because</p>',
}

const projectId = (index) => `33333333-3333-4333-8333-00000000000${index}`

function linkedProject(index, projectSlug, status, languages) {
  return {
    id: `44444444-4444-4444-8444-00000000000${index}`,
    campaign: id,
    project: {
      id: projectId(index),
      slug: projectSlug,
      status,
      translations: languages.map((language) => ({
        id: '55555555-5555-4555-8555-555555555555',
        parent: projectId(index),
        language,
        title: `${projectSlug} ${language}`,
        summary: null,
      })),
    },
  }
}

const campaign = {
  id,
  slug: 'inclusive-school-year',
  status: 'published',
  goal_cents: 650000,
  currency: 'EUR',
  starts_at: '2026-10-31T23:00:00.000Z',
  ends_at: '2027-06-30T21:59:59.000Z',
  translations: [translation],
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
  api = await server.ssrLoadModule('/src/api/collections/campaigns/queries.ts')
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

test('active campaigns request published, not-ended campaigns', async () => {
  reply({ data: [campaign] })
  const result = await api.getActiveCampaigns({ language: 'en', limit: 3 })
  const url = new URL(captured.url)
  assert.equal(url.pathname, '/items/campaigns')
  assert.deepEqual(JSON.parse(url.searchParams.get('filter')), {
    _and: [
      { status: { _eq: 'published' } },
      { _or: [{ ends_at: { _null: true } }, { ends_at: { _gte: '$NOW' } }] },
    ],
  })
  assert.equal(url.searchParams.get('limit'), '3')
  assert.ok(!url.searchParams.get('fields').includes('translations.body'))
  assert.equal(result[0].translation.title, translation.title)
  assert.equal(result[0].goal_cents, 650000)
  assert.deepEqual(result[0].projects, [])
})

test('campaign by slug localizes linked published projects only', async () => {
  reply({
    data: [
      {
        ...campaign,
        projects: [
          linkedProject(1, 'school', 'published', ['en', 'de']),
          linkedProject(2, 'draft-project', 'draft', ['en']),
          linkedProject(3, 'german-only', 'published', ['de']),
        ],
      },
    ],
  })
  const result = await api.getCampaignBySlug('inclusive-school-year', 'en')
  const url = new URL(captured.url)
  assert.deepEqual(JSON.parse(url.searchParams.get('filter')), {
    _and: [
      { slug: { _eq: 'inclusive-school-year' } },
      { status: { _eq: 'published' } },
    ],
  })
  assert.ok(url.searchParams.get('fields').includes('translations.body'))
  assert.equal(result.translation.body, translation.body)
  assert.deepEqual(result.projects, [
    { id: projectId(1), slug: 'school', title: 'school en', summary: null },
  ])
})

test('campaigns for a project return localized campaign and project labels', async () => {
  const project = linkedProject(1, 'school', 'published', ['en', 'de'])
  reply({
    data: [
      {
        ...campaign,
        projects: [project],
      },
    ],
  })
  const result = await api.getCampaignsForProject('school', 'en')
  const url = new URL(captured.url)
  assert.deepEqual(JSON.parse(url.searchParams.get('filter')), {
    _and: [
      { status: { _eq: 'published' } },
      {
        projects: {
          project: {
            _and: [
              { slug: { _eq: 'school' } },
              { status: { _eq: 'published' } },
            ],
          },
        },
      },
    ],
  })
  assert.equal(result.length, 1)
  assert.equal(result[0].translation.title, translation.title)
  assert.deepEqual(result[0].projects, [
    { id: projectId(1), slug: 'school', title: 'school en', summary: null },
  ])
})

test('campaigns for several projects are localized and filtered to memberships', async () => {
  const school = linkedProject(1, 'school', 'published', ['en', 'de'])
  const wheelchair = linkedProject(2, 'wheelchair', 'published', ['en', 'de'])
  reply({
    data: [
      {
        ...campaign,
        projects: [school, wheelchair],
      },
    ],
  })
  const result = await api.getCampaignsForProjects(
    ['wheelchair', 'school', 'school'],
    'en',
  )
  const url = new URL(captured.url)
  assert.deepEqual(JSON.parse(url.searchParams.get('filter')), {
    _and: [
      { status: { _eq: 'published' } },
      {
        projects: {
          project: {
            _and: [
              { slug: { _in: ['school', 'wheelchair'] } },
              { status: { _eq: 'published' } },
            ],
          },
        },
      },
    ],
  })
  assert.equal(result.length, 1)
  assert.deepEqual(
    result[0].projects.map((project) => project.slug),
    ['school', 'wheelchair'],
  )
})

test('unknown or invalid campaign slugs throw not-found', async () => {
  reply({ data: [] })
  await assert.rejects(
    api.getCampaignBySlug('missing', 'en'),
    api.CampaignNotFoundError,
  )
  reply({ data: [] })
  await assert.rejects(
    api.getCampaignBySlug('../admin', 'en'),
    api.CampaignNotFoundError,
  )
  assert.equal(captured, undefined)
})
