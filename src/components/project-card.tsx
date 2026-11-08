import type { ReactNode } from 'react'
import { GlassCard } from '#/components/glass-card'
import { cn } from '#/lib/utils'

type ProjectCardProps = {
  title: string
  description: string
  tag: string
  action: ReactNode
  relationships?: ReactNode
  cover?: 'lagoon' | 'terracotta'
  delay?: number
  coverImage?: ReactNode
}

export function ProjectCard({ cover = 'lagoon', ...props }: ProjectCardProps) {
  return (
    <GlassCard
      variant="solid"
      delay={props.delay}
      className="flex h-full flex-col overflow-clip rounded-[32px]"
    >
      <div
        className={cn(
          'relative flex min-h-60 flex-col items-start justify-end overflow-hidden p-6',
          cover === 'lagoon'
            ? 'bg-brand-project-lagoon'
            : 'bg-brand-project-terracotta',
        )}
      >
        {props.coverImage && (
          <div className="absolute inset-0">{props.coverImage}</div>
        )}
        <span className="relative rounded-full border border-brand-header-border bg-brand-glass-chip px-3.5 py-[7px] text-[13px] leading-none font-bold text-brand-lagoon-deep backdrop-blur-[6px]">
          {props.tag}
        </span>
      </div>
      <div className="flex flex-1 flex-col items-start gap-3 px-6 pt-7 pb-8 sm:px-8">
        <h3 className="font-display text-[28px] leading-[1.2] font-bold text-brand-ink">
          {props.title}
        </h3>
        <p className="min-h-[72px] text-base leading-normal text-brand-ink-soft">
          {props.description}
        </p>
        {props.relationships}
        <div className="mt-auto">{props.action}</div>
      </div>
    </GlassCard>
  )
}
