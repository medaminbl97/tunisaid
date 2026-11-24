import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import yaml from 'js-yaml'

// The project's schema model: the YAML format, the snapshot the YAML implies,
// and the Directus REST helpers shared by revisions.js and sync.js.

const NAME = /^[a-zA-Z][a-zA-Z0-9_]*$/
const FIELD_TYPES = new Set([
  'alias',
  'bigInteger',
  'boolean',
  'csv',
  'date',
  'dateTime',
  'decimal',
  'float',
  'geometry',
  'hash',
  'integer',
  'json',
  'string',
  'text',
  'time',
  'timestamp',
  'unknown',
  'uuid',
])
const ACTIONS = new Set(['create', 'read', 'update', 'delete', 'share'])

export const isObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const hasOnly = (value, keys) =>
  Object.keys(value).every((key) => keys.includes(key))

// CORE_SCHEMA keeps unquoted dates as strings instead of JavaScript dates.
async function readYaml(file) {
  return yaml.load(await readFile(file, 'utf8'), { schema: yaml.CORE_SCHEMA })
}

async function listYaml(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  return entries
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => {
      if (!entry.isFile() || !/\.ya?ml$/i.test(entry.name)) {
        throw new Error(`Expected a YAML file in ${directory}: ${entry.name}`)
      }
      return path.join(directory, entry.name)
    })
}

export const primaryKey = (definition) =>
  definition.fields.find((field) => field.schema?.is_primary_key === true)

function validateDefinition(definition, file) {
  const fail = (message) => {
    throw new Error(`${message} (${file})`)
  }
  if (
    !isObject(definition) ||
    typeof definition.collection !== 'string' ||
    !NAME.test(definition.collection) ||
    definition.collection.startsWith('directus_') ||
    !isObject(definition.schema) ||
    !isObject(definition.meta) ||
    !Array.isArray(definition.fields)
  ) {
    fail('Invalid collection definition')
  }
  if (
    !hasOnly(definition, [
      'collection',
      'schema',
      'meta',
      'fields',
      'relations',
    ])
  ) {
    fail('Unsupported collection property')
  }

  const names = new Set()
  for (const field of definition.fields) {
    if (
      !isObject(field) ||
      typeof field.field !== 'string' ||
      !NAME.test(field.field) ||
      !FIELD_TYPES.has(field.type) ||
      !isObject(field.meta) ||
      (field.type === 'alias'
        ? field.schema !== null
        : field.schema !== undefined && !isObject(field.schema))
    ) {
      fail(`Invalid field ${field?.field ?? ''}`)
    }
    if (!hasOnly(field, ['field', 'type', 'schema', 'meta'])) {
      fail(`Unsupported field property in ${field.field}`)
    }
    if (names.has(field.field)) fail(`Duplicate field ${field.field}`)
    names.add(field.field)
  }
  if (!primaryKey(definition)) {
    fail(`Collection ${definition.collection} must declare a primary key`)
  }

  const relationFields = new Set()
  for (const relation of definition.relations ?? []) {
    if (
      !isObject(relation) ||
      !names.has(relation.field) ||
      typeof relation.related_collection !== 'string' ||
      !isObject(relation.schema) ||
      !isObject(relation.meta) ||
      !hasOnly(relation, ['field', 'related_collection', 'schema', 'meta']) ||
      relationFields.has(relation.field)
    ) {
      fail(`Invalid or duplicate relation ${relation?.field ?? ''}`)
    }
    if (
      relation.meta.junction_field &&
      !names.has(relation.meta.junction_field)
    ) {
      fail(`Unknown junction field in relation ${relation.field}`)
    }
    relationFields.add(relation.field)
  }
  if (
    definition.relations !== undefined &&
    !Array.isArray(definition.relations)
  ) {
    fail('Expected a relations array')
  }
}

export async function loadDefinitions(schemasDir) {
  const definitions = []
  const seen = new Set()
  const namespaces = await readdir(schemasDir, { withFileTypes: true })
  for (const namespace of namespaces.sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    if (!namespace.isDirectory()) {
      throw new Error(
        `Expected a namespace directory in ${schemasDir}: ${namespace.name}`,
      )
    }
    for (const file of await listYaml(path.join(schemasDir, namespace.name))) {
      const definition = await readYaml(file)
      validateDefinition(definition, file)
      if (seen.has(definition.collection)) {
        throw new Error(
          `Duplicate collection ${definition.collection} (${file})`,
        )
      }
      seen.add(definition.collection)
      definitions.push(definition)
    }
  }
  if (!definitions.length) {
    throw new Error(`No collection definitions found in ${schemasDir}.`)
  }

  for (const definition of definitions) {
    for (const relation of definition.relations ?? []) {
      const target = definitions.find(
        (item) => item.collection === relation.related_collection,
      )
      const label = `${definition.collection}.${relation.field}`
      if (!target && !relation.related_collection.startsWith('directus_')) {
        throw new Error(
          `Relation ${label} references unknown collection ${relation.related_collection}`,
        )
      }
      const alias = relation.meta.one_field
      if (
        alias &&
        target &&
        !target.fields.some((f) => f.field === alias && f.type === 'alias')
      ) {
        throw new Error(
          `Relation ${label} references missing alias ${relation.related_collection}.${alias}`,
        )
      }
    }
  }
  return definitions
}

function merge(base, changes) {
  const result = { ...base }
  for (const [key, value] of Object.entries(changes ?? {})) {
    result[key] =
      isObject(value) && isObject(result[key])
        ? merge(result[key], value)
        : value
  }
  return result
}

// Directus 11.17.4 applies full version-1 snapshots, so the desired snapshot
// starts from the instance's own snapshot. Anything the YAML does not declare
// (other collections, extra fields, relations, system-field indexes, snapshot
// metadata) is preserved, so only what the YAML describes can change.
// `dropCollections` names collections that are ours (created by an earlier
// revision) but no longer declared: they are left out, so the diff reports them
// as deletions for a revision to contain.
export function desiredSnapshot(
  snapshot,
  definitions,
  { dropCollections = [] } = {},
) {
  const desired = structuredClone(snapshot)

  const foreignKey = (name) => {
    const own = definitions.find((item) => item.collection === name)
    if (own) return primaryKey(own).field
    return (
      snapshot.fields.find(
        (field) => field.collection === name && field.schema?.is_primary_key,
      )?.field ?? 'id'
    )
  }

  for (const definition of definitions) {
    const name = definition.collection

    const collection = {
      collection: name,
      schema: merge(
        snapshot.collections.find((item) => item.collection === name)
          ?.schema ?? { name },
        definition.schema,
      ),
      meta: merge(
        snapshot.collections.find((item) => item.collection === name)?.meta ?? {
          collection: name,
        },
        definition.meta,
      ),
    }
    upsert(desired.collections, (item) => item.collection === name, collection)

    for (const field of definition.fields) {
      const existing = snapshot.fields.find(
        (item) => item.collection === name && item.field === field.field,
      )
      upsert(
        desired.fields,
        (item) => item.collection === name && item.field === field.field,
        {
          ...existing,
          ...field,
          collection: name,
          schema:
            field.type === 'alias'
              ? null
              : merge(
                  existing?.schema ?? { name: field.field, table: name },
                  field.schema,
                ),
          meta: merge(
            existing?.meta ?? { collection: name, field: field.field },
            field.meta,
          ),
        },
      )
    }

    for (const relation of definition.relations ?? []) {
      const existing = snapshot.relations.find(
        (item) => item.collection === name && item.field === relation.field,
      )
      upsert(
        desired.relations,
        (item) => item.collection === name && item.field === relation.field,
        {
          ...existing,
          collection: name,
          field: relation.field,
          related_collection: relation.related_collection,
          schema: merge(
            existing?.schema ?? {
              table: name,
              column: relation.field,
              foreign_key_table: relation.related_collection,
              foreign_key_column: foreignKey(relation.related_collection),
            },
            relation.schema,
          ),
          meta: merge(
            existing?.meta ?? {
              many_collection: name,
              many_field: relation.field,
              one_collection: relation.related_collection,
            },
            relation.meta,
          ),
        },
      )
    }
  }

  // The YAML is the complete definition of the collections it declares: fields
  // and relations of those collections that it no longer mentions are left out,
  // so the diff reports them as deletions. Collections the YAML does not
  // declare stay untouched, unless they are listed in `dropCollections`.
  const removed = new Set(
    dropCollections.filter(
      (name) => !definitions.some((item) => item.collection === name),
    ),
  )
  desired.collections = desired.collections.filter(
    (item) => !removed.has(item.collection),
  )
  desired.fields = desired.fields.filter(
    (item) => !removed.has(item.collection),
  )
  desired.relations = desired.relations.filter(
    (item) => !removed.has(item.collection),
  )
  const declared = new Map(definitions.map((item) => [item.collection, item]))
  desired.fields = desired.fields.filter((field) => {
    const owner = declared.get(field.collection)
    return !owner || owner.fields.some((item) => item.field === field.field)
  })
  desired.relations = desired.relations.filter((relation) => {
    const owner = declared.get(relation.collection)
    return (
      !owner ||
      (owner.relations ?? []).some((item) => item.field === relation.field)
    )
  })
  return desired
}

function upsert(list, matches, value) {
  const index = list.findIndex(matches)
  if (index === -1) list.push(value)
  else list[index] = value
}

const baseUrl = () => process.env.DIRECTUS_URL ?? 'http://127.0.0.1:8057'

// Minimal REST helper shared by the sync steps. Errors name the endpoint and
// status; they never include the request body, so credentials stay out of logs.
export async function request(endpoint, { method = 'GET', body, token } = {}) {
  const response = await fetch(`${baseUrl()}${endpoint}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(30_000),
  })
  const text = await response.text()
  if (!response.ok) {
    throw new Error(
      `${method} ${endpoint.split('?')[0]} failed (${response.status}): ${text.slice(0, 500)}`,
    )
  }
  if (!text) return null
  return response.headers.get('content-type')?.includes('application/json')
    ? JSON.parse(text)
    : text
}

export async function waitForDirectus(timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs
  let lastError
  while (Date.now() < deadline) {
    try {
      if ((await request('/server/ping')) === 'pong') return
    } catch (error) {
      lastError = error
    }
    await sleep(1_000)
  }
  throw new Error(`Directus did not become ready: ${lastError?.message}`)
}

export async function loginAsAdmin(env = process.env) {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required.')
  }
  const login = await request('/auth/login', {
    method: 'POST',
    body: { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD },
  })
  return login.data.access_token
}
