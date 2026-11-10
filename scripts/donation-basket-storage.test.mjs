import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

let server
let storage

before(async () => {
  server = await createServer({
    configFile: false,
    appType: 'custom',
    server: { middlewareMode: true },
    resolve: {
      alias: { '#': fileURLToPath(new URL('../src', import.meta.url)) },
    },
  })
  storage = await server.ssrLoadModule('/src/lib/donation-storage.ts')
})

after(async () => {
  await server?.close()
})

const empty = { items: {}, flexibleCents: 0 }
const now = Date.parse('2026-03-01T12:00:00.000Z')
const basket = {
  items: { koffa: { quantity: 2, unitCents: 3500 } },
  flexibleCents: 1000,
}

const stored = (overrides = {}) =>
  JSON.stringify({ version: 1, savedAt: now, basket, ...overrides })

test('a saved basket survives a round trip', () => {
  assert.deepEqual(
    storage.parseStoredBasket(storage.serializeBasket(basket, now), now),
    basket,
  )
})

test('missing, unreadable and unknown data counts as an empty basket', () => {
  for (const raw of [
    null,
    '',
    'not json',
    '[]',
    '{}',
    stored({ version: 2 }),
  ]) {
    assert.deepEqual(storage.parseStoredBasket(raw, now), empty, String(raw))
  }
})

test('out-of-range baskets are discarded instead of reaching checkout', () => {
  const bad = [
    { items: { koffa: { quantity: 0, unitCents: 3500 } }, flexibleCents: 0 },
    { items: { koffa: { quantity: 1.5, unitCents: 3500 } }, flexibleCents: 0 },
    { items: { koffa: { quantity: 1001, unitCents: 3500 } }, flexibleCents: 0 },
    { items: { koffa: { quantity: 1, unitCents: 0 } }, flexibleCents: 0 },
    { items: { koffa: { quantity: 1, unitCents: 2 ** 31 } }, flexibleCents: 0 },
    {
      items: { 'bad slug!': { quantity: 1, unitCents: 100 } },
      flexibleCents: 0,
    },
    { items: {}, flexibleCents: -1 },
    {
      items: Object.fromEntries(
        Array.from({ length: 51 }, (_, index) => [
          `purpose-${index}`,
          { quantity: 1, unitCents: 100 },
        ]),
      ),
      flexibleCents: 0,
    },
    {
      items: {
        a: { quantity: 1000, unitCents: 2 ** 31 - 1 },
        b: { quantity: 1000, unitCents: 2 ** 31 - 1 },
        c: { quantity: 1000, unitCents: 2 ** 31 - 1 },
        d: { quantity: 1000, unitCents: 2 ** 31 - 1 },
        e: { quantity: 1000, unitCents: 2 ** 31 - 1 },
      },
      flexibleCents: 0,
    },
  ]
  for (const value of bad) {
    assert.deepEqual(
      storage.parseStoredBasket(stored({ basket: value }), now),
      empty,
    )
  }
})

test('a basket nobody came back to expires after 30 days', () => {
  const day = 24 * 60 * 60 * 1000
  assert.deepEqual(storage.parseStoredBasket(stored(), now + 29 * day), basket)
  assert.deepEqual(storage.parseStoredBasket(stored(), now + 31 * day), empty)
})

test('the badge counts every gift plus the flexible amount once', () => {
  assert.equal(storage.basketItemCount(empty), 0)
  assert.equal(storage.basketItemCount(basket), 3)
  assert.equal(
    storage.basketItemCount({
      items: { a: { quantity: 4, unitCents: 100 } },
      flexibleCents: 0,
    }),
    4,
  )
  assert.equal(storage.basketItemCount({ items: {}, flexibleCents: 500 }), 1)
})
