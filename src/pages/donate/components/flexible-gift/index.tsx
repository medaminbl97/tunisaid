import { useId, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDonationBasket } from '#/components/donation-provider'
import { SectionHeading } from '#/components/section-heading'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  donationTotal,
  formatDonationAmount,
  parseDonationAmount,
} from '#/lib/donation'

export function FlexibleGift() {
  const { t, i18n } = useTranslation('donation')
  const { basket, setFlexibleCents } = useDonationBasket()
  const id = useId()
  const [amount, setAmount] = useState('50')
  const [error, setError] = useState(false)
  const [lastAddedCents, setLastAddedCents] = useState<number | null>(null)

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="bg-brand-flow-glow px-6 py-12 sm:px-10 lg:py-16"
    >
      <div className="mx-auto grid max-w-[75rem] items-center gap-8 rounded-[32px] bg-brand-sun-soft p-6 sm:p-10 lg:grid-cols-[1.5fr_1fr]">
        <SectionHeading
          id={`${id}-title`}
          align="left"
          size="compact"
          eyebrow={t('flexible.eyebrow')}
          title={t('flexible.title')}
          description={t('flexible.description')}
        />
        <form
          className="space-y-3"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            const cents = parseDonationAmount(amount)
            if (
              cents === null ||
              !Number.isSafeInteger(
                donationTotal(basket) - basket.flexibleCents + cents,
              )
            ) {
              setError(true)
              setLastAddedCents(null)
              return
            }
            setFlexibleCents(cents)
            setError(false)
            setLastAddedCents(cents)
          }}
        >
          <Label htmlFor={id} className="font-bold text-brand-ink">
            {t('flexible.label')}
          </Label>
          <Input
            id={id}
            variant="brand"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            aria-invalid={error}
            aria-describedby={error ? `${id}-error` : `${id}-hint`}
            className="text-right font-display text-3xl md:text-3xl"
          />
          <p id={`${id}-hint`} className="text-xs text-brand-ink-soft">
            {t('flexible.hint')}
          </p>
          {error && (
            <p
              id={`${id}-error`}
              role="alert"
              className="text-sm font-bold text-brand-ink"
            >
              {t('flexible.error')}
            </p>
          )}
          <Button
            type="submit"
            className="w-full whitespace-normal"
            size="cta"
            shape="pill"
          >
            {t('flexible.action')} <ArrowRight aria-hidden="true" />
          </Button>
          <p role="status" className="text-sm text-brand-ink-soft">
            {lastAddedCents !== null &&
              t('flexible.added', {
                amount: formatDonationAmount(lastAddedCents, i18n.language),
              })}
          </p>
        </form>
      </div>
    </section>
  )
}
