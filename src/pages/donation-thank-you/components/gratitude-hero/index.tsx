import { HeartHandshake } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { IconChip } from '#/components/icon-chip'
import { SectionHeading } from '#/components/section-heading'

export function GratitudeHero() {
  const { t } = useTranslation('donation')

  return (
    <section
      aria-labelledby="gratitude-title"
      className="flex flex-col items-center gap-8"
    >
      <IconChip tone="sun" className="size-24 text-brand-lagoon-deep">
        <HeartHandshake aria-hidden="true" className="size-8" />
      </IconChip>
      <SectionHeading
        id="gratitude-title"
        as="h1"
        eyebrow={t('thanks.eyebrow')}
        title={t('thanks.title')}
        description={t('thanks.description')}
        className="[&>p:first-child]:text-brand-lagoon-deep"
      />
      <p className="max-w-[42rem] rounded-[24px] bg-brand-sun-soft p-6 text-center text-sm leading-relaxed">
        <strong className="mb-2 block">{t('checkout.noPayment')}</strong>
        {t('thanks.notice')}
      </p>
    </section>
  )
}
