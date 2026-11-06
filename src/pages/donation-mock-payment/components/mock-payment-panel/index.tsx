import { Link, useRouter } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CircleCheck, CircleX, Undo2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { completeMockPayment } from '#/api/collections/donations/functions'
import { mockPaymentQueryOptions } from '#/api/collections/donations/queries'
import { mockPaymentLookupSchema } from '#/api/collections/donations/schemas'
import type { MockPaymentOutcome } from '#/api/collections/donations/schemas'
import { FactList } from '#/components/fact-list'
import { Button } from '#/components/ui/button'
import { formatDonationAmount } from '#/lib/donation'

type MockPaymentPanelProps = {
  attempt: string
  token: string
}

const outcomes = [
  {
    value: 'succeeded',
    label: 'succeed',
    icon: CircleCheck,
    variant: 'default',
  },
  { value: 'failed', label: 'fail', icon: CircleX, variant: 'brandOutline' },
  { value: 'cancelled', label: 'cancel', icon: Undo2, variant: 'brandOutline' },
] as const

export function MockPaymentPanel(props: MockPaymentPanelProps) {
  const { t, i18n } = useTranslation('donation', { keyPrefix: 'mockPayment' })
  const router = useRouter()
  const valid = mockPaymentLookupSchema.safeParse(props).success
  const payment = useQuery({
    ...mockPaymentQueryOptions(props.attempt, props.token),
    enabled: valid,
  })
  const complete = useMutation({
    mutationFn: (outcome: MockPaymentOutcome) =>
      completeMockPayment({
        data: { attempt: props.attempt, token: props.token, outcome },
      }),
    onSuccess: async (result) => {
      if (!result.ok) return
      await router.navigate({
        to: '/donate/thank-you',
        search: { reference: result.reference, token: result.token },
      })
    },
  })

  if (valid && payment.isPending) {
    return (
      <p role="status" className="text-center text-brand-ink-soft">
        {t('loading')}
      </p>
    )
  }

  if (!valid || payment.data === null || complete.data?.ok === false) {
    return (
      <div className="space-y-5 rounded-[24px] bg-brand-sun-soft p-6 text-center">
        <p role="alert" className="font-bold">
          {t('invalid')}
        </p>
        <Button asChild variant="brandOutline" shape="pill" size="cta">
          <Link to="/donate/checkout">{t('back')}</Link>
        </Button>
      </div>
    )
  }

  if (payment.isError || complete.isError) {
    return (
      <div className="space-y-5 rounded-[24px] bg-brand-sun-soft p-6 text-center">
        <p role="alert" className="font-bold">
          {t('error')}
        </p>
        <Button
          type="button"
          shape="pill"
          size="cta"
          onClick={() => {
            complete.reset()
            void payment.refetch()
          }}
        >
          {t('retry')}
        </Button>
      </div>
    )
  }

  const details = payment.data
  if (!details) return null
  const open = details.status === 'created' || details.status === 'pending'

  return (
    <section
      aria-labelledby="mock-payment-title"
      aria-busy={complete.isPending}
      className="space-y-8 rounded-[28px] border border-brand-line bg-brand-white p-7 sm:p-9"
    >
      <FactList
        items={[
          { label: t('reference'), value: details.reference },
          {
            label: t('amount'),
            value: formatDonationAmount(
              details.amountCents,
              i18n.resolvedLanguage ?? 'en',
            ),
          },
        ]}
      />
      {open ? (
        <div className="flex flex-col gap-3">
          {outcomes.map((outcome) => (
            <Button
              key={outcome.value}
              type="button"
              variant={outcome.variant}
              shape="pill"
              size="cta"
              className="w-full whitespace-normal"
              disabled={complete.isPending}
              onClick={() => complete.mutate(outcome.value)}
            >
              <outcome.icon aria-hidden="true" /> {t(outcome.label)}
            </Button>
          ))}
          {complete.isPending && (
            <p
              role="status"
              className="text-center text-sm text-brand-ink-soft"
            >
              {t('processing')}
            </p>
          )}
        </div>
      ) : (
        <p className="font-bold text-brand-lagoon-deep">{t('done')}</p>
      )}
    </section>
  )
}
