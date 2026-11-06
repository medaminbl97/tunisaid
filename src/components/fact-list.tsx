import type { ReactNode } from 'react'
import { cn } from '#/lib/utils'

type FactListItem = {
  label: ReactNode
  value: ReactNode
}

type FactListProps = {
  items: FactListItem[]
  className?: string
}

export function FactList(props: FactListProps) {
  return (
    <dl className={cn('flex flex-wrap gap-3', props.className)}>
      {props.items.map((item, index) => (
        <div
          key={index}
          className="flex min-w-0 flex-col gap-0.5 rounded-[20px] border border-brand-glass-soft-border bg-brand-glass-soft px-4 py-3"
        >
          <dt className="text-xs font-extrabold tracking-wider text-brand-lagoon-deep uppercase">
            {item.label}
          </dt>
          <dd className="font-display text-lg leading-tight font-bold text-brand-ink">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
