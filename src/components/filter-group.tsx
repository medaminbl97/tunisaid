import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

type FilterGroupProps<TValue extends string> = {
  label: string
  options: ReadonlyArray<{ value: TValue; label: string }>
  value: TValue
  onChange: (value: TValue) => void
}

export function FilterGroup<TValue extends string>(
  props: FilterGroupProps<TValue>,
) {
  return (
    <div role="group" aria-label={props.label} className="flex flex-wrap gap-2">
      {props.options.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant="white"
          shape="pill"
          aria-pressed={props.value === option.value}
          onClick={() => props.onChange(option.value)}
          className={cn(
            'min-h-11 border border-brand-line px-5 text-brand-ink',
            props.value === option.value &&
              'border-brand-ink bg-brand-ink text-brand-white hover:bg-brand-lagoon-deep hover:text-brand-white',
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}
