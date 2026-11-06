import type { ReactNode } from 'react'

type RelationshipBadgeProps = {
  children: ReactNode
}

export function RelationshipBadge(props: RelationshipBadgeProps) {
  return (
    <span className="inline-flex max-w-full items-center rounded-full border border-brand-lagoon-deep/15 bg-brand-white/80 px-3 py-1 text-xs leading-relaxed font-bold text-brand-lagoon-deep">
      {props.children}
    </span>
  )
}
