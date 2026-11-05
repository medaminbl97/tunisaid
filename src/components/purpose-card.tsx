import type { ReactNode } from 'react'
import { Heart } from 'lucide-react'
import { GlassCard } from '#/components/glass-card'
import { IconChip } from '#/components/icon-chip'

type PurposeCardProps = {
  icon: ReactNode
  category: string
  title: string
  description: string
  impact: string
  amount: string
  unit: string
  action: ReactNode
}

export function PurposeCard(props: PurposeCardProps) {
  return (
    <GlassCard variant="solid" className="flex h-full flex-col gap-5 p-6">
      <div className="flex items-center justify-between gap-4">
        <IconChip
          tone="sun"
          className="size-16 rounded-[22px] text-brand-lagoon-deep"
        >
          {props.icon}
        </IconChip>
        <p className="text-right text-[11px] font-extrabold uppercase">
          {props.category}
        </p>
      </div>
      <h3 className="font-display text-[28px] leading-tight font-bold">
        {props.title}
      </h3>
      <p className="grow text-sm leading-relaxed text-brand-ink-soft">
        {props.description}
      </p>
      <p className="flex items-center gap-3 text-xs font-bold">
        <Heart
          aria-hidden="true"
          className="size-6 shrink-0 text-brand-lagoon-deep"
        />
        {props.impact}
      </p>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p>
          <span className="block font-display text-[32px] leading-tight font-bold">
            {props.amount}
          </span>
          <span className="text-xs text-brand-ink-soft">{props.unit}</span>
        </p>
        {props.action}
      </div>
    </GlassCard>
  )
}
