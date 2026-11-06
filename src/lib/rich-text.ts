import createDOMPurify from 'dompurify'
import type { WindowLike } from 'dompurify'

export type RichTextHeading = {
  id: string
  text: string
  level: 2 | 3
}

export type PreparedRichText = {
  html: string
  headings: Array<RichTextHeading>
}

type RichTextOptions = {
  assetBaseUrl: string
}

const allowedTags = [
  'h2',
  'h3',
  'h4',
  'p',
  'br',
  'hr',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'sub',
  'sup',
  'blockquote',
  'ul',
  'ol',
  'li',
  'a',
  'img',
  'figure',
  'figcaption',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'caption',
  'pre',
  'code',
  'span',
]

const allowedAttributes = [
  'href',
  'title',
  'src',
  'alt',
  'width',
  'height',
  'colspan',
  'rowspan',
  'scope',
]

export function slugifyHeading(text: string) {
  return (
    text
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64) || 'section'
  )
}

export function prepareRichText(
  html: string,
  window: WindowLike,
  options: RichTextOptions,
): PreparedRichText {
  const purify = createDOMPurify(window)
  const assetBase = new URL(options.assetBaseUrl)
  const fragment = purify.sanitize(html, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttributes,
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|\/|#)/i,
    ADD_URI_SAFE_ATTR: ['width', 'height', 'colspan', 'rowspan', 'scope'],
    RETURN_DOM_FRAGMENT: true,
  })

  // Directus stores uploaded images as root-relative /assets/<id> paths.
  for (const image of fragment.querySelectorAll('img')) {
    const src = image.getAttribute('src') ?? ''
    if (src.startsWith('/assets/')) {
      image.setAttribute('src', new URL(src, assetBase).href)
    }
    image.setAttribute('loading', 'lazy')
    image.setAttribute('decoding', 'async')
    if (!image.hasAttribute('alt')) image.setAttribute('alt', '')
  }

  for (const link of fragment.querySelectorAll('a[href]')) {
    if (/^https?:/i.test(link.getAttribute('href') ?? '')) {
      link.setAttribute('target', '_blank')
      link.setAttribute('rel', 'noopener noreferrer')
    }
  }

  const used = new Set<string>()
  const headings: Array<RichTextHeading> = []
  for (const element of fragment.querySelectorAll('h2, h3')) {
    const text = element.textContent.replace(/\s+/g, ' ').trim()
    if (!text) continue
    const base = slugifyHeading(text)
    let id = base
    for (let suffix = 2; used.has(id); suffix += 1) id = `${base}-${suffix}`
    used.add(id)
    element.id = id
    headings.push({ id, text, level: element.tagName === 'H2' ? 2 : 3 })
  }

  const container = fragment.ownerDocument.createElement('div')
  container.append(fragment)
  return { html: container.innerHTML, headings }
}
