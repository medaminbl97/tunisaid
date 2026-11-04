import type { ReactNode } from 'react'
import { GlassCard } from '#/components/glass-card'
import { IconChip } from '#/components/icon-chip'
import { cn } from '#/lib/utils'

type InfoCardProps = {
  icon: ReactNode
  title: ReactNode
  description: ReactNode
  animation?: 'reveal' | 'float'
  className?: string
}

export function InfoCard(props: InfoCardProps) {
  return (
    <GlassCard
      animation={props.animation}
      className={cn(
        'flex max-w-full items-center gap-3 p-4 sm:gap-4 sm:py-5 sm:pr-7 sm:pl-5',
        props.className,
      )}
    >
      <IconChip tone="sun" className="size-12 sm:size-14">
        {props.icon}
      </IconChip>
      <div className="min-w-0">
        <p className="font-display text-[17px] leading-[1.2] font-bold">
          {props.title}
        </p>
        <p className="mt-0.5 text-[13px] leading-[1.3] font-medium text-brand-ink-soft">
          {props.description}
        </p>
      </div>
    </GlassCard>
  )
}
