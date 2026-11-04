import type { ReactNode } from 'react'
import { GlassCard } from '#/components/glass-card'
import { IconChip } from '#/components/icon-chip'
import { cn } from '#/lib/utils'

type ActionCardProps = {
  icon: ReactNode
  title: string
  description: string
  action: ReactNode
  featured?: boolean
  delay?: number
}

export function ActionCard(props: ActionCardProps) {
  return (
    <GlassCard
      variant={props.featured ? 'featured' : 'soft'}
      delay={props.delay}
      className="flex h-full flex-col items-start gap-4 rounded-[32px] px-7 py-8"
    >
      <IconChip
        className={props.featured ? 'bg-brand-glass-bright' : undefined}
      >
        {props.icon}
      </IconChip>
      <h3 className="font-display text-2xl leading-[1.2] font-bold">
        {props.title}
      </h3>
      <p
        className={cn(
          'flex-1 text-[15px] leading-normal',
          props.featured
            ? 'text-brand-glass-inverse-label'
            : 'text-brand-ink-soft',
        )}
      >
        {props.description}
      </p>
      <div className="mt-auto max-w-full">{props.action}</div>
    </GlassCard>
  )
}
