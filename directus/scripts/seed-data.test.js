import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { loadDefinitions } from './schema-model.js'
import { loadSeeds, seedData, seedEnvironment, seedItems } from './seed-data.js'

const schemasDir = fileURLToPath(new URL('../schemas/', import.meta.url))
const seedsDir = fileURLToPath(new URL('../seeds/', import.meta.url))

// An in-memory stand-in for the Directus items API.
function fakeApi(rows = {}) {
  const request = async (endpoint, { method = 'GET', body } = {}) => {
    const url = new URL(endpoint, 'http://localhost')
    const [, , collection, id] = url.pathname.split('/')
    const table = (rows[collection] ??= [])
    if (method === 'GET') {
      const [key, condition] = Object.entries(
        JSON.parse(url.searchParams.get('filter')),
      )[0]
      return {
        data: table.filter((row) => row[key] === condition._eq).slice(0, 1),
      }
    }
    if (method === 'POST') {
      table.push({ ...body })
      return { data: body }
    }
    Object.assign(
      table.find((row) => String(row.id) === decodeURIComponent(id)),
      body,
    )
    return { data: body }
  }
  return { rows, request }
}

const seeds = [
  {
    collection: 'categories',
    key: 'id',
    items: [
      { id: 'a', status: 'draft' },
      { id: 'b', status: 'draft' },
    ],
  },
]

test('creates missing rows and never overwrites existing ones', async () => {
  const api = fakeApi({ categories: [{ id: 'a', status: 'archived' }] })
  const result = await seedItems(api.request, 't', seeds)
  assert.deepEqual(result, { created: 1, published: 0 })
  assert.equal(
    api.rows.categories.find((row) => row.id === 'a').status,
    'archived',
  )
})

test('is idempotent', async () => {
  const api = fakeApi()
  await seedItems(api.request, 't', seeds)
  const second = await seedItems(api.request, 't', seeds)
  assert.deepEqual(second, { created: 0, published: 0 })
  assert.equal(api.rows.categories.length, 2)
})

test('publishDraft publishes new and still-draft seed rows only', async () => {
  const api = fakeApi({ categories: [{ id: 'a', status: 'archived' }] })
  const result = await seedItems(api.request, 't', seeds, {
    publishDraft: true,
  })
  assert.deepEqual(result, { created: 1, published: 1 })
  const status = (id) => api.rows.categories.find((r) => r.id === id).status
  assert.equal(status('a'), 'archived')
  assert.equal(status('b'), 'published')
})

test('example seeds are skipped outside dev, reference seeds are not', async () => {
  const definitions = await loadDefinitions(schemasDir)
  const prod = fakeApi()
  await seedData(definitions, prod.request, 't', {
    environment: 'prod',
    seedsDir,
  })
  assert.ok(prod.rows.languages.length > 0)
  assert.equal(prod.rows.categories, undefined)

  const dev = fakeApi()
  await seedData(definitions, dev.request, 't', {
    environment: 'dev',
    seedsDir,
  })
  assert.ok(dev.rows.categories.length > 0)
})

test('CMS_ENV accepts only dev or prod', () => {
  assert.equal(seedEnvironment('prod'), 'prod')
  assert.throws(() => seedEnvironment('staging'), /dev" or "prod/)
})

test('rejects a seed for an unmanaged collection', async () => {
  const definitions = await loadDefinitions(schemasDir)
  const root = await mkdtemp(path.join(os.tmpdir(), 'directus-seeds-'))
  try {
    await mkdir(path.join(root, 'reference'))
    await writeFile(
      path.join(root, 'reference', '01-x.yaml'),
      'collection: not_a_collection\nitems:\n  - id: a\n',
    )
    await assert.rejects(
      loadSeeds(root, 'reference', definitions),
      /unmanaged collection/,
    )
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('the repository seeds load', async () => {
  const definitions = await loadDefinitions(schemasDir)
  assert.ok((await loadSeeds(seedsDir, 'reference', definitions)).length > 0)
  assert.ok((await loadSeeds(seedsDir, 'examples', definitions)).length > 0)
})
