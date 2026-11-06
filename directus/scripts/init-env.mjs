import { randomBytes } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'

const value = () => randomBytes(32).toString('hex')

async function readEnv(url) {
  try {
    return await readFile(url, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

const keyOf = (line) => line.match(/^([A-Z0-9_]+)=/)?.[1]
const valueOf = (content, key) =>
  content
    ?.split('\n')
    .find((line) => keyOf(line) === key)
    ?.slice(key.length + 1)

// Adds missing keys only; existing values are never changed or printed.
async function fill(url, entries) {
  const current = await readEnv(url)
  const present = new Set((current ?? '').split('\n').map(keyOf))
  const missing = entries.filter(([key]) => !present.has(key))
  if (!missing.length) return []
  const prefix = current && !current.endsWith('\n') ? '\n' : ''
  const lines = missing.map(([key, entryValue]) => `${key}=${entryValue}`)
  await writeFile(url, `${current ?? ''}${prefix}${lines.join('\n')}\n`, {
    mode: 0o600,
  })
  return missing.map(([key]) => key)
}

const directusEnv = new URL('../.env', import.meta.url)
const websiteEnv = new URL('../../.env', import.meta.url)

const directusAdded = await fill(directusEnv, [
  ['DIRECTUS_PORT', '8056'],
  ['ADMIN_EMAIL', 'admin@example.com'],
  ['ADMIN_PASSWORD', value()],
  ['DATABASE_PASSWORD', value()],
  ['DIRECTUS_SECRET', value()],
  ['DONATION_SERVICE_TOKEN', value()],
])
const directus = await readEnv(directusEnv)
const websiteAdded = await fill(websiteEnv, [
  [
    'DIRECTUS_URL',
    `http://localhost:${valueOf(directus, 'DIRECTUS_PORT') || '8056'}`,
  ],
  ['DIRECTUS_SERVICE_TOKEN', valueOf(directus, 'DONATION_SERVICE_TOKEN')],
  ['DONATION_SIGNING_SECRET', value()],
  ['PAYMENT_PROVIDER', 'mock'],
])

console.log(
  [
    `directus/.env: ${directusAdded.length ? `added ${directusAdded.join(', ')}` : 'complete'}`,
    `.env: ${websiteAdded.length ? `added ${websiteAdded.join(', ')}` : 'complete'}`,
    'Existing values were not changed.',
  ].join('\n'),
)
