import type { ReactNode } from 'react'
import { GlassCard } from '#/components/glass-card'
import { cn } from '#/lib/utils'

type StatementCardProps = {
  eyebrow: string
  title: string
  description: string
  icon?: ReactNode
  tone?: 'white' | 'lagoon'
  as?: 'h2' | 'h3'
  size?: 'default' | 'compact'
  className?: string
}

export function StatementCard({
  tone = 'white',
  as: Heading = 'h3',
  size = 'default',
  ...props
}: StatementCardProps) {
  return (
    <GlassCard
      variant="solid"
      className={cn(
        'flex h-full flex-col items-start gap-5 border-0 p-8',
        size === 'compact' ? 'rounded-[28px]' : 'rounded-[40px] sm:p-10',
        tone === 'lagoon' && 'bg-brand-lagoon-tint',
        props.className,
      )}
    >
      {props.icon}
      <p
        className={cn(
          'text-xs font-extrabold tracking-wider uppercase',
          tone === 'lagoon'
            ? 'text-brand-terracotta'
            : 'text-brand-lagoon-deep',
        )}
      >
        {props.eyebrow}
      </p>
      <Heading
        className={cn(
          'font-display leading-[1.14] font-bold text-balance',
          size === 'compact' ? 'text-[28px]' : 'text-[30px]',
        )}
      >
        {props.title}
      </Heading>
      <p
        className={cn(
          'leading-relaxed text-brand-ink-soft',
          size === 'compact' ? 'text-base' : 'text-[17px]',
        )}
      >
        {props.description}
      </p>
    </GlassCard>
  )
}
