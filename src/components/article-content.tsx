import { GlassCard } from '#/components/glass-card'
import { RichText } from '#/components/rich-text'
import { TableOfContents } from '#/components/table-of-contents'
import type { PreparedRichText } from '#/lib/rich-text'

type ArticleContentProps = {
  content: PreparedRichText | null
  contentsLabel: string
  emptyLabel: string
}

const MIN_NAVIGATION_HEADINGS = 2

export function ArticleContent(props: ArticleContentProps) {
  const headings = props.content?.headings ?? []

  if (!props.content?.html.trim()) {
    return (
      <p className="mx-auto max-w-[46rem] text-lg text-brand-ink-soft">
        {props.emptyLabel}
      </p>
    )
  }

  if (headings.length < MIN_NAVIGATION_HEADINGS) {
    return (
      <RichText html={props.content.html} className="mx-auto max-w-[46rem]" />
    )
  }

  const navigation = (
    <TableOfContents title={props.contentsLabel} items={headings} />
  )

  return (
    <div className="mx-auto grid max-w-[75rem] gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-16">
      <GlassCard variant="soft" className="p-2 lg:hidden">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-[20px] px-4 py-3 text-xs font-extrabold tracking-wider text-brand-lagoon-deep uppercase [&::-webkit-details-marker]:hidden">
            {props.contentsLabel}
            <span
              aria-hidden
              className="text-base transition-transform group-open:rotate-180"
            >
              ▾
            </span>
          </summary>
          <div className="px-4 pt-1 pb-3">{navigation}</div>
        </details>
      </GlassCard>
      <RichText html={props.content.html} className="max-w-[46rem]" />
      <aside className="hidden lg:block">
        <div className="sticky top-(--brand-scroll-offset)">
          <GlassCard
            variant="soft"
            className="max-h-[calc(100vh-var(--brand-scroll-offset)-2rem)] overflow-y-auto p-6"
          >
            <p className="mb-4 text-xs font-extrabold tracking-wider text-brand-lagoon-deep uppercase">
              {props.contentsLabel}
            </p>
            {navigation}
          </GlassCard>
        </div>
      </aside>
    </div>
  )
}
