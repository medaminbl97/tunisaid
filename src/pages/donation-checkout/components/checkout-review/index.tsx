import { Link } from '@tanstack/react-router'
import { ArrowRight, HeartHandshake } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DonationBasketSummary } from '#/components/donation-basket-summary'
import { StatementCard } from '#/components/statement-card'
import { Button } from '#/components/ui/button'

export function CheckoutReview() {
  const { t } = useTranslation('donation')

  return (
    <aside
      aria-label={t('checkout.reviewLabel')}
      className="min-w-0 lg:sticky lg:top-8"
    >
      <DonationBasketSummary
        title={t('checkout.reviewTitle')}
        tone="lagoon"
        editable
        action={
          <Button
            asChild
            variant="brandOutline"
            shape="pill"
            size="cta"
            className="w-full whitespace-normal"
          >
            <Link to="/donate">
              {t('checkout.changeGifts')} <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
      >
        <StatementCard
          eyebrow={t('checkout.supportEyebrow')}
          title={t('shared.supportTitle')}
          description={t('shared.supportDescription')}
          icon={
            <HeartHandshake
              aria-hidden="true"
              className="size-7 text-brand-lagoon-deep"
            />
          }
          size="compact"
          className="bg-brand-sun-soft p-5"
        />
      </DonationBasketSummary>
    </aside>
  )
}
