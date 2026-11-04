import type { ReactNode } from 'react'
import { GlassCard } from '#/components/glass-card'
import { cn } from '#/lib/utils'

type StatCardProps = {
  label: ReactNode
  value: ReactNode
  delay?: number
  className?: string
}

export function StatCard(props: StatCardProps) {
  return (
    <GlassCard
      variant="inverse"
      delay={props.delay}
      className={cn('flex flex-col gap-1.5 p-5 xl:p-7', props.className)}
    >
      <dt className="order-2 text-[15px] leading-normal font-medium text-brand-glass-inverse-label">
        {props.label}
      </dt>
      <dd className="font-display text-[clamp(2.5rem,3.62vw,3.25rem)] leading-[1.1] font-bold">
        {props.value}
      </dd>
    </GlassCard>
  )
}
