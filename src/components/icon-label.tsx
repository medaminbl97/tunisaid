import type { ReactNode } from 'react'

type IconLabelProps = {
  icon: ReactNode
  children: ReactNode
}

export function IconLabel(props: IconLabelProps) {
  return (
    <p className="flex items-center gap-3 text-sm font-bold text-brand-ink">
      <span aria-hidden="true" className="shrink-0 text-brand-lagoon-deep">
        {props.icon}
      </span>
      {props.children}
    </p>
  )
}
