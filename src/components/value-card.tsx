import type { ReactNode } from 'react'
import { GlassCard } from '#/components/glass-card'
import { IconChip } from '#/components/icon-chip'

type ValueCardProps = {
  icon: ReactNode
  title: string
  description: string
  delay?: number
}

export function ValueCard(props: ValueCardProps) {
  return (
    <GlassCard
      variant="soft"
      delay={props.delay}
      className="flex h-full flex-col items-start gap-4 px-7 py-8"
    >
      <IconChip>{props.icon}</IconChip>
      <h3 className="font-display text-[22px] leading-[1.2] font-bold">
        {props.title}
      </h3>
      <p className="text-[15px] leading-normal text-brand-ink-soft">
        {props.description}
      </p>
    </GlassCard>
  )
}
