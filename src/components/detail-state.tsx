import { Link } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import { GlassCard } from '#/components/glass-card'
import { Button } from '#/components/ui/button'

type DetailStateLabels = {
  loading: string
  notFoundTitle: string
  notFoundDescription: string
  errorTitle: string
  errorDescription: string
  retry: string
  back: string
}

type DetailStateProps = {
  labels: DetailStateLabels
  backTo: LinkProps['to']
  backHash?: string
} & (
  | { state: 'loading' }
  | { state: 'not-found' }
  | { state: 'error'; onRetry: () => void }
)

export function DetailState(props: DetailStateProps) {
  if (props.state === 'loading') {
    return (
      <div
        role="status"
        className="mx-auto flex max-w-[75rem] flex-col gap-6 px-6 pt-[calc(var(--brand-header-height)+var(--brand-header-offset)+3rem)] pb-24 sm:px-10"
      >
        <span className="sr-only">{props.labels.loading}</span>
        <div aria-hidden className="flex animate-pulse flex-col gap-5">
          <div className="h-4 w-28 rounded-full bg-brand-line" />
          <div className="h-12 w-full max-w-[40rem] rounded-2xl bg-brand-line" />
          <div className="h-5 w-full max-w-[32rem] rounded-full bg-brand-line" />
          <div className="mt-10 h-72 w-full max-w-[46rem] rounded-[28px] bg-brand-line" />
        </div>
      </div>
    )
  }

  const notFound = props.state === 'not-found'

  return (
    <div className="px-6 pt-[calc(var(--brand-header-height)+var(--brand-header-offset)+4rem)] pb-24 sm:px-10">
      <GlassCard
        variant="solid"
        className="mx-auto flex max-w-[36rem] flex-col items-start gap-4 p-8 sm:p-10"
      >
        <h1
          role={notFound ? undefined : 'alert'}
          className="font-display text-[clamp(1.75rem,3vw,2.25rem)] leading-tight font-bold"
        >
          {notFound ? props.labels.notFoundTitle : props.labels.errorTitle}
        </h1>
        <p className="text-base text-brand-ink-soft">
          {notFound
            ? props.labels.notFoundDescription
            : props.labels.errorDescription}
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          {props.state === 'error' && (
            <Button shape="pill" size="cta" onClick={props.onRetry}>
              {props.labels.retry}
            </Button>
          )}
          <Button asChild variant="brandOutline" shape="pill" size="cta">
            <Link to={props.backTo} hash={props.backHash}>
              {props.labels.back}
            </Link>
          </Button>
        </div>
      </GlassCard>
    </div>
  )
}
