import { cn } from '#/lib/utils'

type RichTextProps = {
  html: string
  size?: 'article' | 'compact'
  className?: string
}

const sizes = {
  article: [
    'prose-lg',
    'prose-headings:font-display prose-headings:font-bold prose-headings:text-brand-ink',
    'prose-h2:mt-14 prose-h2:text-[clamp(1.75rem,2.6vw,2.25rem)] prose-h2:leading-tight prose-h3:mt-10 prose-h3:text-2xl',
    'prose-blockquote:border-l-brand-terracotta prose-blockquote:font-display prose-blockquote:text-brand-ink prose-blockquote:not-italic',
    'prose-img:rounded-[24px] prose-hr:border-brand-line',
    'prose-th:text-brand-ink prose-table:block prose-table:overflow-x-auto',
    '[&_:is(h2,h3)]:scroll-mt-(--brand-scroll-offset)',
  ],
  compact: [
    'prose-sm leading-relaxed',
    'prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0 [&>:first-child]:mt-0 [&>:last-child]:mb-0',
  ],
}

export function RichText(props: RichTextProps) {
  return (
    <div
      className={cn(
        'prose max-w-none text-brand-ink-soft',
        'prose-strong:text-brand-ink prose-a:font-semibold prose-a:text-brand-lagoon-deep prose-a:underline-offset-4',
        'prose-li:marker:text-brand-lagoon-blue',
        sizes[props.size ?? 'article'],
        props.className,
      )}
      dangerouslySetInnerHTML={{ __html: props.html }}
    />
  )
}
