import { GlassCard } from '#/components/glass-card'

type DirectContactCardProps = {
  label: string
  value: string
  hint: string
  href: string
}

export function DirectContactCard(props: DirectContactCardProps) {
  return (
    <GlassCard
      variant="solid"
      className="rounded-[20px] border-0 bg-brand-lagoon-tint"
    >
      <a
        href={props.href}
        className="group flex flex-col items-start gap-2 rounded-[20px] p-6 outline-none focus-visible:ring-3 focus-visible:ring-brand-lagoon-blue"
      >
        <span className="text-xs font-extrabold text-brand-ink-soft uppercase">
          {props.label}
        </span>
        <span className="text-[17px] font-bold break-words [overflow-wrap:anywhere] group-hover:underline">
          {props.value}
        </span>
        <span className="text-sm leading-normal text-brand-ink-soft">
          {props.hint}
        </span>
      </a>
    </GlassCard>
  )
}
