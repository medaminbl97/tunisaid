import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'

let server
let richText
const { window } = new JSDOM('')
const options = { assetBaseUrl: 'http://cms.example.test' }

before(async () => {
  server = await createServer({
    configFile: false,
    appType: 'custom',
    server: { middlewareMode: true },
    resolve: {
      alias: { '#': fileURLToPath(new URL('../src', import.meta.url)) },
    },
  })
  richText = await server.ssrLoadModule('/src/lib/rich-text.ts')
})

after(async () => {
  await server?.close()
})

test('extracts H2/H3 headings with unique, readable ids', () => {
  const result = richText.prepareRichText(
    '<h2>Our Goal</h2><p>Text</p><h3>Über   Djerba</h3><h2>Our goal</h2><h2> </h2><h4>Ignored</h4>',
    window,
    options,
  )
  assert.deepEqual(result.headings, [
    { id: 'our-goal', text: 'Our Goal', level: 2 },
    { id: 'uber-djerba', text: 'Über Djerba', level: 3 },
    { id: 'our-goal-2', text: 'Our goal', level: 2 },
  ])
  assert.match(result.html, /<h2 id="our-goal">Our Goal<\/h2>/)
  assert.match(result.html, /<h2 id="our-goal-2">/)
})

test('removes scripts, event handlers, unsafe URLs and editor ids', () => {
  const { html } = richText.prepareRichText(
    '<h2 id="evil" class="x" style="color:red" onclick="alert(1)">Title</h2>' +
      '<script>alert(1)</script><iframe src="https://evil.test"></iframe>' +
      '<a href="javascript:alert(1)">bad</a><img src="x" onerror="alert(1)">' +
      '<a href="data:text/html,hi">data</a>',
    window,
    options,
  )
  assert.doesNotMatch(
    html,
    /script|iframe|onclick|onerror|javascript:|data:|style=|class=/,
  )
  assert.match(html, /<h2 id="title">Title<\/h2>/)
})

test('resolves Directus asset paths and hardens links and images', () => {
  const { html } = richText.prepareRichText(
    '<p><img src="/assets/abc-123?width=800" alt="Kids" width="800" height="600"><img src="https://img.example.test/a.png"></p>' +
      '<p><a href="https://tunisaid.org/">site</a> <a href="/donate">donate</a> <a href="#goal">goal</a></p>',
    window,
    options,
  )
  assert.match(
    html,
    /src="http:\/\/cms\.example\.test\/assets\/abc-123\?width=800"/,
  )
  assert.match(html, /width="800" height="600"/)
  assert.match(html, /src="https:\/\/img\.example\.test\/a\.png"[^>]*alt=""/)
  assert.equal(html.match(/loading="lazy"/g)?.length, 2)
  assert.match(
    html,
    /<a href="https:\/\/tunisaid\.org\/" target="_blank" rel="noopener noreferrer">/,
  )
  assert.match(html, /<a href="\/donate">donate<\/a>/)
  assert.match(html, /<a href="#goal">goal<\/a>/)
})

test('keeps rich formatting, tables and lists', () => {
  const source =
    '<p><strong>Bold</strong> <em>it</em> <u>u</u></p><ul><li>One</li></ul><blockquote><p>Quote</p></blockquote>' +
    '<table><thead><tr><th scope="col">A</th></tr></thead><tbody><tr><td colspan="2">1</td></tr></tbody></table>'
  const { html, headings } = richText.prepareRichText(source, window, options)
  assert.equal(html, source)
  assert.deepEqual(headings, [])
})
