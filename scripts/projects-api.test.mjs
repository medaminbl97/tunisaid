import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

let server
let api
let client
let createQueryClient
let getQueryClient
let respond
let captured

const id = '11111111-1111-4111-8111-111111111111'
const translation = {
  id: '22222222-2222-4222-8222-222222222222',
  parent: id,
  language: 'en',
  title: 'School support',
  summary: 'A project summary',
  body: '<h2>Project</h2><p><strong>Support</strong></p>',
}
const project = {
  id,
  slug: 'school-support',
  status: 'published',
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
  api = await server.ssrLoadModule('/src/api/collections/projects/queries.ts')
  ;({ client } = await server.ssrLoadModule('/src/api/generated/client.gen.ts'))
  ;({ createQueryClient, getQueryClient } = await server.ssrLoadModule(
    '/src/integration/tanstack-query.ts',
  ))
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
  respond = () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
}

test('projects use generated SDK, JSON filters, localization and rich HTML', async () => {
  reply({ data: [project] })
  const result = await api.getProjects({ language: 'en', limit: 3, offset: 2 })
  const url = new URL(captured.url)
  assert.equal(url.pathname, '/items/projects')
  assert.deepEqual(JSON.parse(url.searchParams.get('filter')), {
    status: { _eq: 'published' },
  })
  assert.equal(url.searchParams.get('limit'), '3')
  assert.equal(url.searchParams.get('offset'), '2')
  assert.ok(url.searchParams.get('fields').includes('translations.body'))
  assert.equal(result[0].translation.body, translation.body)
  assert.equal(result[0].translation.title, translation.title)
})

test('only an actual empty data array is an empty result', async () => {
  reply({ data: [] })
  assert.deepEqual(await api.getProjects({ language: 'en' }), [])
  for (const body of [
    {},
    { data: null },
    { data: [{ ...project, id: 'invalid' }] },
  ]) {
    reply(body)
    await assert.rejects(api.getProjects({ language: 'en' }))
  }
})

test('missing, unresolved or duplicate translations reject instead of falling back', async () => {
  for (const translations of [
    [],
    [translation.id],
    [translation, translation],
  ]) {
    reply({ data: [{ ...project, translations }] })
    await assert.rejects(api.getProjects({ language: 'en' }))
  }
  reply({ data: [project] })
  await assert.rejects(
    api.getProjects({ language: 'de' }),
    /exactly one de translation/,
  )
})

test('HTTP errors and aborted requests reject', async () => {
  reply({ errors: [{ message: 'Forbidden' }] }, 403)
  await assert.rejects(api.getProjects({ language: 'en' }))
  const controller = new AbortController()
  controller.abort()
  respond = (request) => {
    assert.equal(request.signal.aborted, true)
    request.signal.throwIfAborted()
  }
  await assert.rejects(api.getProjects({ language: 'en' }, controller.signal), {
    name: 'AbortError',
  })
})

test('detail uses generated path and rejects non-published projects', async () => {
  reply({ data: project })
  assert.equal((await api.getProject(id, 'en')).id, id)
  assert.equal(new URL(captured.url).pathname, `/items/projects/${id}`)
  reply({ data: { ...project, status: 'draft' } })
  await assert.rejects(api.getProject(id, 'en'), /not published/)
  reply({})
  await assert.rejects(api.getProject(id, 'en'))
})

test('slug lookup filters published slug and maps empty results to not found', async () => {
  reply({ data: [project] })
  const result = await api.getProjectBySlug('school-support', 'en')
  assert.equal(result.translation.title, translation.title)
  const url = new URL(captured.url)
  assert.equal(url.pathname, '/items/projects')
  assert.deepEqual(JSON.parse(url.searchParams.get('filter')), {
    _and: [
      { slug: { _eq: 'school-support' } },
      { status: { _eq: 'published' } },
    ],
  })
  assert.equal(url.searchParams.get('limit'), '1')

  reply({ data: [] })
  await assert.rejects(
    api.getProjectBySlug('missing', 'en'),
    api.ProjectNotFoundError,
  )
  captured = undefined
  await assert.rejects(
    api.getProjectBySlug('../items/donations', 'en'),
    api.ProjectNotFoundError,
  )
  assert.equal(captured, undefined, 'invalid slugs must not hit the API')

  const options = api.projectBySlugQueryOptions('missing', 'en')
  assert.equal(options.retry(0, new api.ProjectNotFoundError('missing')), false)
  assert.equal(options.retry(0, new Error('network')), true)
  assert.notDeepEqual(
    api.projectKeys.bySlug('school-support', 'en'),
    api.projectKeys.bySlug('school-support', 'de'),
  )
})

test('inputs and cache keys distinguish language, pagination and project identity', async () => {
  await assert.rejects(api.getProjects({ language: 'fr' }))
  await assert.rejects(api.getProjects({ language: 'en', limit: 101 }))
  await assert.rejects(api.getProjects({ language: 'en', offset: -1 }))
  await assert.rejects(api.getProject('bad-id', 'en'))
  assert.deepEqual(
    api.projectKeys.list({ language: 'en' }),
    api.projectKeys.list({ language: 'en', limit: 12, offset: 0 }),
  )
  assert.notDeepEqual(
    api.projectKeys.list({ language: 'en' }),
    api.projectKeys.list({ language: 'de' }),
  )
  assert.notDeepEqual(
    api.projectKeys.list({ language: 'en' }),
    api.projectKeys.list({ language: 'en', offset: 12 }),
  )
  assert.notDeepEqual(
    api.projectKeys.detail(id, 'en'),
    api.projectKeys.detail(id, 'de'),
  )
  assert.notStrictEqual(
    getQueryClient(),
    getQueryClient(),
    'SSR requests must not share a cache',
  )
  const queryClient = createQueryClient()
  reply({ data: [project] })
  const options = api.projectsQueryOptions({ language: 'en' })
  const result = await queryClient.fetchQuery(options)
  assert.equal(queryClient.getQueryData(options.queryKey), result)
  queryClient.clear()
})

test(
  'live Directus contract, published queries and private access',
  {
    skip: process.env.API_INTEGRATION !== 'true',
  },
  async () => {
    const baseUrl =
      process.env.DIRECTUS_URL ??
      `http://localhost:${process.env.DIRECTUS_PORT ?? '8056'}`
    const cleanup = []
    async function request(path, method = 'GET', body, token) {
      const response = await fetch(new URL(path, baseUrl), {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(30_000),
      })
      assert.ok(response.ok, `${method} ${path}: HTTP ${response.status}`)
      return response.status === 204 ? undefined : (await response.json()).data
    }
    const { access_token: token } = await request('/auth/login', 'POST', {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      mode: 'json',
    })
    // The website reads anonymously: published projects only.
    client.setConfig({ baseUrl, fetch: globalThis.fetch, auth: undefined })
    try {
      const draft = await request(
        '/items/projects',
        'POST',
        { slug: `api-verification-${randomUUID()}`, status: 'draft' },
        token,
      )
      cleanup.unshift(`/items/projects/${draft.id}`)
      await assert.rejects(api.getProject(draft.id, 'en'))
      const project = await request(
        '/items/projects',
        'POST',
        {
          slug: `api-verification-${randomUUID()}`,
          status: 'published',
        },
        token,
      )
      cleanup.unshift(`/items/projects/${project.id}`)
      const copy = await request(
        '/items/projects_translations',
        'POST',
        {
          parent: project.id,
          language: 'en',
          title: 'Synthetic API fixture',
          summary: 'Synthetic test',
          body: translation.body,
        },
        token,
      )
      cleanup.unshift(`/items/projects_translations/${copy.id}`)
      const detail = await api.getProject(project.id, 'en')
      assert.equal(detail.translation.body, translation.body)
      const list = await api.getProjects({ language: 'en', limit: 100 })
      assert.ok(list.some((item) => item.id === project.id))
      assert.ok(list.every((item) => item.status === 'published'))
    } finally {
      for (const path of cleanup)
        await request(path, 'DELETE', undefined, token)
      client.setConfig({ auth: undefined })
    }
  },
)
