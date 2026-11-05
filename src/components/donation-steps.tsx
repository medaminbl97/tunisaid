import { cn } from '#/lib/utils'

type DonationStepsProps = {
  label: string
  steps: readonly string[]
  current: number
}

export function DonationSteps(props: DonationStepsProps) {
  return (
    <nav aria-label={props.label}>
      <ol className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
        {props.steps.map((step, index) => (
          <li
            key={step}
            aria-current={index === props.current ? 'step' : undefined}
            className={cn(
              'flex gap-2 text-brand-ink-soft',
              index === props.current && 'font-bold text-brand-ink',
              index < props.current && 'text-brand-lagoon-deep',
            )}
          >
            <span aria-hidden="true">{index + 1}</span> {step}
          </li>
        ))}
      </ol>
    </nav>
  )
}
