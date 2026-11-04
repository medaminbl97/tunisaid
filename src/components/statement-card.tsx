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
  className?: string
}

export function StatementCard({
  tone = 'white',
  as: Heading = 'h3',
  ...props
}: StatementCardProps) {
  return (
    <GlassCard
      variant="solid"
      className={cn(
        'flex h-full flex-col items-start gap-5 rounded-[40px] border-0 p-8 sm:p-10',
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
      <Heading className="font-display text-[30px] leading-[1.14] font-bold text-balance">
        {props.title}
      </Heading>
      <p className="text-[17px] leading-relaxed text-brand-ink-soft">
        {props.description}
      </p>
    </GlassCard>
  )
}
