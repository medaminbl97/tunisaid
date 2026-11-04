import { GlassCard } from '#/components/glass-card'
import { IconChip } from '#/components/icon-chip'
import { cn } from '#/lib/utils'

type PartnerCardProps = {
  initials: string
  name: string
  description: string
  tone?: 'lagoon' | 'sun' | 'terracotta'
  delay?: number
}

export function PartnerCard({ tone = 'lagoon', ...props }: PartnerCardProps) {
  return (
    <GlassCard
      variant="soft"
      delay={props.delay}
      className="flex h-full flex-col items-center gap-2 rounded-[32px] px-8 pt-10 pb-9 text-center"
    >
      <IconChip
        className={cn(
          'size-28 font-display leading-none font-bold text-brand-lagoon-deep',
          props.initials.length > 3 ? 'text-xl' : 'text-[26px]',
          tone === 'lagoon' && 'bg-brand-lagoon-tint',
          tone === 'sun' && 'bg-brand-sun-soft',
          tone === 'terracotta' && 'bg-brand-terracotta-soft',
        )}
      >
        {props.initials}
      </IconChip>
      <h3 className="text-[17px] leading-[1.3] font-bold">{props.name}</h3>
      <p className="text-sm leading-[1.3] font-medium text-brand-ink-soft">
        {props.description}
      </p>
    </GlassCard>
  )
}
