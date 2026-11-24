import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { desiredSnapshot, loadDefinitions } from './schema-model.js'

const dir = (name) => fileURLToPath(new URL(`../${name}/`, import.meta.url))

async function withTree(files, run) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'directus-defs-'))
  try {
    for (const [name, content] of Object.entries(files)) {
      const file = path.join(root, name)
      await mkdir(path.dirname(file), { recursive: true })
      await writeFile(file, content)
    }
    return await run(root)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

const article = (extra = '') => `
collection: articles
schema: {}
meta: {}
fields:
  - field: id
    type: uuid
    schema: { is_primary_key: true }
    meta: {}
${extra}`

test('the repository schemas load and cross-reference', async () => {
  const definitions = await loadDefinitions(dir('schemas'))
  assert.ok(definitions.length > 0)
})

test('rejects an unknown top-level key', async () => {
  await withTree(
    { 'schemas/content/a.yaml': `${article()}\nsurprise: true\n` },
    (root) =>
      assert.rejects(
        loadDefinitions(path.join(root, 'schemas')),
        /Unsupported collection property/,
      ),
  )
})

test('rejects duplicate collections across namespaces', async () => {
  await withTree(
    {
      'schemas/one/a.yaml': article(),
      'schemas/two/a.yaml': article(),
    },
    (root) =>
      assert.rejects(
        loadDefinitions(path.join(root, 'schemas')),
        /Duplicate collection/,
      ),
  )
})

test('rejects an empty schemas directory', async () => {
  await withTree({}, async (root) => {
    await mkdir(path.join(root, 'schemas'))
    await assert.rejects(
      loadDefinitions(path.join(root, 'schemas')),
      /No collection definitions/,
    )
  })
})

const definition = {
  collection: 'articles',
  schema: {},
  meta: { icon: 'article' },
  fields: [
    {
      field: 'id',
      type: 'uuid',
      schema: { is_primary_key: true },
      meta: {},
    },
    { field: 'title', type: 'string', schema: {}, meta: {} },
  ],
  relations: [],
}

const snapshot = () => ({
  version: 1,
  vendor: 'postgres',
  collections: [{ collection: 'other', meta: {}, schema: { name: 'other' } }],
  fields: [
    {
      collection: 'other',
      field: 'id',
      type: 'integer',
      schema: { is_primary_key: true },
      meta: {},
    },
  ],
  relations: [],
})

test('keeps collections the YAML does not declare', () => {
  const desired = desiredSnapshot(snapshot(), [definition])
  assert.ok(desired.collections.some((item) => item.collection === 'other'))
  assert.ok(desired.fields.some((item) => item.collection === 'other'))
  assert.ok(desired.collections.some((item) => item.collection === 'articles'))
})

test('does not mutate the instance snapshot', () => {
  const original = snapshot()
  desiredSnapshot(original, [definition])
  assert.deepEqual(original, snapshot())
})

test('is stable when applied to its own result', () => {
  const once = desiredSnapshot(snapshot(), [definition])
  const twice = desiredSnapshot(once, [definition])
  assert.deepEqual(twice, once)
})

test('defaults a relation to the target primary key', () => {
  const child = {
    collection: 'comments',
    schema: {},
    meta: {},
    fields: [
      {
        field: 'id',
        type: 'integer',
        schema: { is_primary_key: true },
        meta: {},
      },
      { field: 'article', type: 'uuid', schema: {}, meta: {} },
    ],
    relations: [
      {
        field: 'article',
        related_collection: 'articles',
        schema: { on_delete: 'CASCADE' },
        meta: {},
      },
    ],
  }
  const desired = desiredSnapshot(snapshot(), [definition, child])
  const [relation] = desired.relations
  assert.equal(relation.schema.foreign_key_column, 'id')
  assert.equal(relation.schema.on_delete, 'CASCADE')
})

test('drops undeclared fields and relations of managed collections only', () => {
  const instance = snapshot()
  instance.collections.push({
    collection: 'articles',
    meta: {},
    schema: { name: 'articles' },
  })
  instance.fields.push(
    { collection: 'articles', field: 'id', type: 'uuid', schema: {}, meta: {} },
    {
      collection: 'articles',
      field: 'old_title',
      type: 'string',
      schema: {},
      meta: {},
    },
    {
      collection: 'other',
      field: 'legacy',
      type: 'string',
      schema: {},
      meta: {},
    },
  )
  instance.relations.push({
    collection: 'articles',
    field: 'old_title',
    related_collection: 'other',
    schema: {},
    meta: {},
  })
  const desired = desiredSnapshot(instance, [definition])
  const has = (collection, field) =>
    desired.fields.some(
      (item) => item.collection === collection && item.field === field,
    )
  assert.equal(has('articles', 'old_title'), false)
  assert.equal(desired.relations.length, 0)
  assert.equal(has('articles', 'title'), true)
  // Not declared in the YAML, so not managed: untouched.
  assert.equal(has('other', 'legacy'), true)
})

test('drops collections that were ours but are no longer declared', () => {
  const instance = snapshot()
  instance.collections.push(
    { collection: 'legacy', meta: {}, schema: { name: 'legacy' } },
    { collection: 'unmanaged', meta: {}, schema: { name: 'unmanaged' } },
  )
  instance.fields.push(
    { collection: 'legacy', field: 'id', type: 'uuid', schema: {}, meta: {} },
    {
      collection: 'unmanaged',
      field: 'id',
      type: 'uuid',
      schema: {},
      meta: {},
    },
  )
  instance.relations.push({
    collection: 'legacy',
    field: 'id',
    related_collection: 'unmanaged',
    schema: {},
    meta: {},
  })
  const desired = desiredSnapshot(instance, [definition], {
    dropCollections: ['legacy', definition.collection],
  })
  const names = desired.collections.map((item) => item.collection)
  assert.equal(names.includes('legacy'), false)
  assert.equal(names.includes('unmanaged'), true)
  assert.equal(
    desired.fields.some((item) => item.collection === 'legacy'),
    false,
  )
  assert.equal(desired.relations.length, 0)
  // A collection that is still declared is never dropped.
  assert.equal(names.includes(definition.collection), true)
})
