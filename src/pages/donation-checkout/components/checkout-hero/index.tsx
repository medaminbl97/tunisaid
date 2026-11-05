import { useTranslation } from 'react-i18next'
import { DonationSteps } from '#/components/donation-steps'
import { SectionHeading } from '#/components/section-heading'

export function CheckoutHero() {
  const { t } = useTranslation('donation')

  return (
    <section aria-labelledby="checkout-title" className="space-y-10">
      <SectionHeading
        id="checkout-title"
        as="h1"
        align="left"
        eyebrow={t('checkout.eyebrow')}
        title={t('checkout.title')}
        description={t('checkout.description')}
        className="[&>p:first-child]:text-brand-lagoon-deep"
      />
      <DonationSteps
        label={t('shared.stepsLabel')}
        current={1}
        steps={[
          t('shared.steps.choose'),
          t('shared.steps.payment'),
          t('shared.steps.thanks'),
        ]}
      />
    </section>
  )
}
