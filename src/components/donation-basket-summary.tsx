import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'
import { DonationSummary } from '#/components/donation-summary'
import { QuantityStepper } from '#/components/quantity-stepper'
import { useDonationBasket } from '#/components/donation-provider'
import { Button } from '#/components/ui/button'
import {
  donationPurposes,
  donationTotal,
  formatDonationAmount,
} from '#/lib/donation'

type DonationBasketSummaryProps = {
  title: string
  tone?: 'sun' | 'lagoon' | 'white'
  editable?: boolean
  action?: ReactNode
  children?: ReactNode
}

export function DonationBasketSummary(props: DonationBasketSummaryProps) {
  const { t, i18n } = useTranslation('donation')
  const { basket, setQuantity, setFlexibleCents } = useDonationBasket()
  const total = donationTotal(basket)
  const format = (cents: number) => formatDonationAmount(cents, i18n.language)
  const lines = donationPurposes
    .filter((purpose) => basket.quantities[purpose.id] > 0)
    .map((purpose) => {
      const quantity = basket.quantities[purpose.id]
      const title = t(`purposes.${purpose.id}.basketTitle`)
      return {
        id: purpose.id,
        title,
        detail: t('shared.lineDetail', {
          quantity,
          amount: format(purpose.cents),
        }),
        amount: format(quantity * purpose.cents),
        controls: props.editable ? (
          <QuantityStepper
            value={quantity}
            label={t('shared.quantity', { title })}
            decreaseLabel={t('shared.decrease', { title })}
            increaseLabel={t('shared.increase', { title })}
            canIncrease={Number.isSafeInteger(total + purpose.cents)}
            onChange={(value) => setQuantity(purpose.id, value)}
          />
        ) : undefined,
      }
    })
  const flexible =
    basket.flexibleCents > 0
      ? [
          {
            id: 'flexible' as const,
            title: t('shared.flexible'),
            detail: t('shared.flexibleDetail'),
            amount: format(basket.flexibleCents),
            controls: props.editable ? (
              <Button
                type="button"
                variant="link"
                onClick={() => setFlexibleCents(0)}
                className="h-auto p-0 text-brand-lagoon-deep"
              >
                {t('shared.remove', { title: t('shared.flexible') })}
              </Button>
            ) : undefined,
          },
        ]
      : []

  return (
    <DonationSummary
      title={props.title}
      eyebrow={t('shared.illustrative')}
      tone={props.tone}
      lines={[...lines, ...flexible]}
      emptyMessage={t('shared.empty')}
      totalLabel={t('shared.total')}
      total={format(total)}
      note={t('shared.supportDescription')}
      action={props.action}
    >
      {props.children}
    </DonationSummary>
  )
}
