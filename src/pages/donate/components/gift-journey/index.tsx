import { HandCoins, Heart, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { IconLabel } from '#/components/icon-label'
import { SectionHeading } from '#/components/section-heading'

const steps = [
  { key: 'choose', icon: Heart },
  { key: 'review', icon: HandCoins },
  { key: 'contact', icon: Users },
] as const

export function GiftJourney() {
  const { t } = useTranslation('donation')

  return (
    <section
      aria-labelledby="gift-journey-title"
      className="bg-brand-cream px-6 py-16 sm:px-10 lg:py-24"
    >
      <div className="mx-auto max-w-[75rem] space-y-8">
        <SectionHeading
          id="gift-journey-title"
          align="left"
          size="compact"
          eyebrow={t('journey.eyebrow')}
          title={t('journey.title')}
        />
        <ol className="grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.key}>
              <IconLabel icon={<step.icon className="size-7" />}>
                {index + 1}. {t(`journey.${step.key}`)}
              </IconLabel>
            </li>
          ))}
        </ol>
        <p className="text-sm text-brand-ink-soft">{t('journey.note')}</p>
      </div>
    </section>
  )
}
