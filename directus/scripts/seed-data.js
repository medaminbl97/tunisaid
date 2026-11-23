import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'

const defaultSeedsDir = fileURLToPath(new URL('../seeds/', import.meta.url))

export function seedEnvironment(environment = process.env.CMS_ENV ?? 'dev') {
  if (!['dev', 'prod'].includes(environment)) {
    throw new Error('CMS_ENV must be "dev" or "prod".')
  }
  return environment
}

const isObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const hasOnly = (value, keys) =>
  Object.keys(value).every((key) => keys.includes(key))

const primaryKey = (definition) =>
  definition.fields.find((field) => field.schema?.is_primary_key === true)

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

// Seed files are applied in file-name order, so prefix them with 01-, 02-, ...
// to put referenced rows before the rows that point to them.
export async function loadSeeds(seedsDir, namespace, definitions) {
  let files
  try {
    files = await listYaml(path.join(seedsDir, namespace))
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }

  const seeds = []
  const seen = new Set()
  for (const file of files) {
    const seed = await readYaml(file)
    if (
      !isObject(seed) ||
      typeof seed.collection !== 'string' ||
      !Array.isArray(seed.items) ||
      !seed.items.length ||
      !hasOnly(seed, ['collection', 'items'])
    ) {
      throw new Error(`Invalid seed file: ${file}`)
    }
    const definition = definitions.find(
      (item) => item.collection === seed.collection,
    )
    if (!definition) {
      throw new Error(
        `Seed for unmanaged collection ${seed.collection} (${file})`,
      )
    }
    if (seen.has(seed.collection)) {
      throw new Error(`Duplicate seed for ${seed.collection} (${file})`)
    }
    seen.add(seed.collection)

    const key = primaryKey(definition).field
    const fields = new Set(
      definition.fields.filter((f) => f.type !== 'alias').map((f) => f.field),
    )
    const keys = new Set()
    for (const item of seed.items) {
      if (
        !isObject(item) ||
        !['string', 'number'].includes(typeof item[key]) ||
        !Object.keys(item).every((name) => fields.has(name)) ||
        keys.has(item[key])
      ) {
        throw new Error(
          `Invalid seed item (stable primary key "${key}" required) in ${file}`,
        )
      }
      keys.add(item[key])
    }
    seeds.push({ collection: seed.collection, key, items: seed.items })
  }
  return seeds
}

const filterQuery = (key, value, fields) =>
  `filter=${encodeURIComponent(JSON.stringify({ [key]: { _eq: value } }))}` +
  `&fields=${fields.join(',')}&limit=1`

// Creates only missing rows, identified by their stable primary key. Existing
// rows are never overwritten, so editor changes survive restarts. A seeded row
// that an editor deleted is created again on the next start.
// With `publishDraft`, seed rows are published when created, and seed rows
// that are still drafts become published.
export async function seedItems(
  request,
  token,
  seeds,
  { publishDraft = false } = {},
) {
  let created = 0
  let published = 0
  for (const { collection, key, items } of seeds) {
    for (const item of items) {
      const { data } = await request(
        `/items/${collection}?${filterQuery(key, item[key], 'status' in item ? [key, 'status'] : [key])}`,
        { token },
      )
      const [existing] = data
      if (!existing) {
        const publishNow = publishDraft && item.status === 'draft'
        await request(`/items/${collection}`, {
          method: 'POST',
          token,
          body: publishNow ? { ...item, status: 'published' } : item,
        })
        created++
        if (publishNow) published++
      } else if (
        publishDraft &&
        item.status === 'draft' &&
        existing.status === 'draft'
      ) {
        await request(`/items/${collection}/${encodeURIComponent(item[key])}`, {
          method: 'PATCH',
          token,
          body: { status: 'published' },
        })
        published++
      }
    }
  }
  return { created, published }
}

// Reference seeds load in every environment; example seeds only in dev.
export async function seedData(
  definitions,
  request,
  token,
  {
    environment = seedEnvironment(),
    seedsDir = defaultSeedsDir,
    publishDraft = false,
  } = {},
) {
  const reference = await loadSeeds(seedsDir, 'reference', definitions)
  const examples = await loadSeeds(seedsDir, 'examples', definitions)

  const referenceResult = await seedItems(request, token, reference)
  console.log(`Reference data: ${referenceResult.created} row(s) created.`)
  if (environment === 'dev') {
    const result = await seedItems(request, token, examples, { publishDraft })
    console.log(
      `Example data: ${result.created} row(s) created, ${result.published} draft row(s) published.`,
    )
  } else {
    console.log('Skipped example data; CMS_ENV is not "dev".')
  }
}
