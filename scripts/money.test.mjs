import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

let server
let money

before(async () => {
  server = await createServer({
    configFile: false,
    appType: 'custom',
    server: { middlewareMode: true },
    resolve: {
      alias: { '#': fileURLToPath(new URL('../src', import.meta.url)) },
    },
  })
  money = await server.ssrLoadModule('/src/lib/money.ts')
})

after(async () => {
  await server?.close()
})

test('parses Directus decimal strings into exact cents', () => {
  assert.equal(money.euroToCents('35.00'), 3500)
  assert.equal(money.euroToCents('0.07'), 7)
  assert.equal(money.euroToCents('19.9'), 1990)
  assert.equal(money.euroToCents('12'), 1200)
  assert.equal(money.euroToCents('-0.05'), -5)
  assert.equal(money.euroToCents('9999999999.99'), 999999999999)
})

test('accepts numbers without floating-point drift', () => {
  assert.equal(money.euroToCents(0.1 + 0.2), 30)
  assert.equal(money.euroToCents(19.99), 1999)
})

test('rejects malformed amounts', () => {
  for (const value of [
    '',
    'abc',
    '1.234',
    '1,50',
    '--1',
    '1e3',
    NaN,
    Infinity,
  ]) {
    assert.throws(
      () => money.euroToCents(value),
      /Invalid euro amount/,
      String(value),
    )
  }
})

test('formats cents as a decimal string for Directus', () => {
  assert.equal(money.centsToEuro(3500), '35.00')
  assert.equal(money.centsToEuro(7), '0.07')
  assert.equal(money.centsToEuro(0), '0.00')
  assert.equal(money.centsToEuro(-5), '-0.05')
  assert.equal(money.centsToEuro(11700), '117.00')
  assert.throws(() => money.centsToEuro(1.5), /Invalid cent amount/)
})

test('round-trips every cent value in a range', () => {
  for (let cents = 0; cents <= 20000; cents += 1) {
    assert.equal(money.euroToCents(money.centsToEuro(cents)), cents)
  }
})

test('euroCents parses strings and numbers and reports bad input', () => {
  assert.equal(money.euroCents.parse('35.00'), 3500)
  assert.equal(money.euroCents.parse(35), 3500)
  assert.equal(money.euroCents.safeParse('nope').success, false)
})
