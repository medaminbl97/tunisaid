import type { ReactNode } from 'react'
import { cn } from '#/lib/utils'

type IconChipProps = {
  children: ReactNode
  tone?: 'glass' | 'sun'
  className?: string
}

export function IconChip({ tone = 'glass', ...props }: IconChipProps) {
  return (
    <span
      className={cn(
        'flex size-[60px] shrink-0 items-center justify-center rounded-full',
        tone === 'sun' ? 'bg-brand-sun-soft' : 'bg-brand-glass-chip',
        props.className,
      )}
    >
      {props.children}
    </span>
  )
}
