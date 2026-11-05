import { useId } from 'react'
import type { ReactNode } from 'react'
import { GlassCard } from '#/components/glass-card'
import { cn } from '#/lib/utils'

type DonationSummaryProps = {
  title: string
  eyebrow?: string
  lines: ReadonlyArray<{
    id: string
    title: string
    detail: string
    amount: string
    controls?: ReactNode
  }>
  totalLabel: string
  total: string
  emptyMessage: string
  note?: string
  action?: ReactNode
  children?: ReactNode
  tone?: 'sun' | 'lagoon' | 'white'
}

export function DonationSummary({
  tone = 'sun',
  ...props
}: DonationSummaryProps) {
  const id = useId()

  return (
    <GlassCard
      variant="solid"
      className={cn(
        'space-y-6 border-0 p-6 sm:p-8',
        tone === 'sun' && 'bg-brand-sun-soft',
        tone === 'lagoon' && 'bg-brand-lagoon-tint',
      )}
    >
      {props.eyebrow && (
        <p className="text-xs font-bold uppercase text-brand-lagoon-deep">
          {props.eyebrow}
        </p>
      )}
      <h2
        id={id}
        className="font-display text-[30px] leading-tight font-bold text-balance"
      >
        {props.title}
      </h2>
      {props.lines.length ? (
        <ul
          aria-labelledby={id}
          className="space-y-6 border-y border-brand-line py-6"
        >
          {props.lines.map((line) => (
            <li key={line.id} className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-bold">{line.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-brand-ink-soft">
                    {line.detail}
                  </p>
                </div>
                <p className="shrink-0 font-bold">{line.amount}</p>
              </div>
              {line.controls}
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-y border-brand-line py-6 text-sm leading-relaxed text-brand-ink-soft">
          {props.emptyMessage}
        </p>
      )}
      <p className="flex flex-wrap items-center justify-between gap-3 font-bold">
        <span>{props.totalLabel}</span>
        <span
          aria-live="polite"
          aria-atomic="true"
          className="font-display text-[36px]"
        >
          <span className="sr-only">{props.totalLabel}: </span>
          {props.total}
        </span>
      </p>
      {props.note && (
        <p className="text-xs leading-relaxed text-brand-ink-soft">
          {props.note}
        </p>
      )}
      {props.action}
      {props.children}
    </GlassCard>
  )
}
