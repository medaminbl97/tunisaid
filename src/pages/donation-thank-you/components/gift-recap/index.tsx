import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DonationBasketSummary } from '#/components/donation-basket-summary'
import { Button } from '#/components/ui/button'

export function GiftRecap() {
  const { t } = useTranslation('donation')

  return (
    <section
      aria-label={t('thanks.recapLabel')}
      className="mx-auto max-w-[42rem] space-y-8"
    >
      <DonationBasketSummary title={t('thanks.recapTitle')} tone="white">
        <p className="text-sm leading-relaxed text-brand-ink-soft">
          {t('thanks.recapHint')}
        </p>
      </DonationBasketSummary>
      <div className="flex flex-col justify-center gap-4 sm:flex-row">
        <Button asChild size="cta" shape="pill">
          <Link to="/what-we-do">
            {t('thanks.explore')} <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
        <Button
          asChild
          variant="brandOutline"
          size="cta"
          shape="pill"
          className="whitespace-normal"
        >
          <Link to="/donate">
            {t('thanks.back')} <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
      <p className="text-center text-sm">
        <Link
          to="/contact"
          className="font-bold text-brand-lagoon-deep underline underline-offset-4"
        >
          {t('shared.contact')}
        </Link>
      </p>
    </section>
  )
}
