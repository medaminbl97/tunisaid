import { cn } from '#/lib/utils'

type CampaignProgressProps = {
  raisedCents: number
  goalCents: number
  label: string
  formatAmount: (cents: number) => string
  progressLabel: (percent: string) => string
  className?: string
}

export function CampaignProgress(props: CampaignProgressProps) {
  const exact =
    props.goalCents > 0
      ? Math.min(Math.max((props.raisedCents / props.goalCents) * 100, 0), 100)
      : 0
  const started = props.raisedCents > 0 && exact > 0
  const reached = props.goalCents > 0 && props.raisedCents >= props.goalCents
  // Never show 0% once money arrived, nor 100% before the goal is reached.
  const percent = reached ? 100 : Math.min(Math.round(exact), 99)
  const percentText = started && exact < 1 ? '<1' : String(percent)

  return (
    <div className={cn('flex w-full flex-col gap-2', props.className)}>
      <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-xs font-extrabold tracking-wider text-brand-lagoon-deep uppercase">
          {props.label}
        </span>
        <span className="font-display text-lg leading-tight font-bold text-brand-ink">
          {props.formatAmount(props.raisedCents)}
          <span className="font-sans text-sm font-normal text-brand-ink-soft">
            {' / '}
            {props.formatAmount(props.goalCents)}
          </span>
        </span>
      </p>
      <div
        role="progressbar"
        aria-label={props.label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(exact * 10) / 10}
        aria-valuetext={props.progressLabel(percentText)}
        className="h-3 overflow-hidden rounded-full border border-brand-lagoon-deep/20 bg-brand-lagoon-tint"
      >
        <div
          className={cn(
            'h-full rounded-full bg-brand-lagoon-deep transition-[width] duration-500',
            started && 'min-w-3',
          )}
          style={{ width: `${exact}%` }}
        />
      </div>
      <p className="text-xs text-brand-ink-soft">
        {props.progressLabel(percentText)}
      </p>
    </div>
  )
}
