import { Minus, Plus } from 'lucide-react'
import { Button } from '#/components/ui/button'

type QuantityStepperProps = {
  value: number
  label: string
  decreaseLabel: string
  increaseLabel: string
  onChange: (value: number) => void
  canIncrease?: boolean
}

export function QuantityStepper(props: QuantityStepperProps) {
  return (
    <div
      role="group"
      aria-label={props.label}
      className="inline-flex items-center rounded-[14px] border border-brand-line bg-brand-white"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        aria-label={props.decreaseLabel}
        disabled={props.value <= 0}
        onClick={() => props.onChange(props.value - 1)}
      >
        <Minus aria-hidden="true" />
      </Button>
      <output
        aria-live="polite"
        className="min-w-6 text-center text-sm font-bold"
      >
        {props.value}
      </output>
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        aria-label={props.increaseLabel}
        disabled={
          props.canIncrease === false || props.value >= Number.MAX_SAFE_INTEGER
        }
        onClick={() => props.onChange(props.value + 1)}
      >
        <Plus aria-hidden="true" />
      </Button>
    </div>
  )
}
