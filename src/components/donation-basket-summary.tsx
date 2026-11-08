import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'
import { DonationSummary } from '#/components/donation-summary'
import { QuantityStepper } from '#/components/quantity-stepper'
import { useDonationBasket } from '#/components/donation-provider'
import { Button } from '#/components/ui/button'
import { useDonationPurposes } from '#/hooks/use-donation-purposes'
import { donationTotal, formatDonationAmount } from '#/lib/donation'

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
  const { data: purposes = [] } = useDonationPurposes()
  const total = donationTotal(basket)
  const format = (cents: number) => formatDonationAmount(cents, i18n.language)
  const order = new Map(purposes.map((purpose, index) => [purpose.slug, index]))
  const lines = Object.entries(basket.items)
    .flatMap(([slug, item]) => (item ? [{ slug, ...item }] : []))
    .sort(
      (a, b) =>
        (order.get(a.slug) ?? order.size) - (order.get(b.slug) ?? order.size),
    )
    .map((item) => {
      const title =
        purposes.find((purpose) => purpose.slug === item.slug)?.basketTitle ??
        item.slug
      return {
        id: item.slug,
        title,
        detail: t('shared.lineDetail', {
          quantity: item.quantity,
          amount: format(item.unitCents),
        }),
        amount: format(item.quantity * item.unitCents),
        controls: props.editable ? (
          <QuantityStepper
            value={item.quantity}
            label={t('shared.quantity', { title })}
            decreaseLabel={t('shared.decrease', { title })}
            increaseLabel={t('shared.increase', { title })}
            canIncrease={Number.isSafeInteger(total + item.unitCents)}
            onChange={(value) => setQuantity(item.slug, item.unitCents, value)}
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
