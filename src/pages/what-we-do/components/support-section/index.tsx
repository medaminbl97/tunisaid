import { useTranslation } from 'react-i18next'
import { SectionHeading } from '#/components/section-heading'
import { StatementCard } from '#/components/statement-card'

const areas = [
  'mobility',
  'education',
  'access',
  'partnerships',
  'transport',
  'community',
] as const

export function SupportSection() {
  const { t } = useTranslation()

  return (
    <section
      id="support"
      aria-labelledby="support-title"
      className="scroll-mt-[calc(var(--brand-header-height)+3rem)] bg-brand-flow-warm px-6 py-16 sm:px-10 lg:py-24"
    >
      <div className="mx-auto max-w-[75rem] space-y-12">
        <SectionHeading
          id="support-title"
          align="left"
          size="compact"
          eyebrow={t('work.support.eyebrow')}
          title={t('work.support.title')}
          description={t('work.support.description')}
          className="max-w-[45rem]"
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area) => (
            <StatementCard
              key={area}
              size="compact"
              eyebrow={t(`work.support.items.${area}.eyebrow`)}
              title={t(`work.support.items.${area}.title`)}
              description={t(`work.support.items.${area}.description`)}
              className="lg:min-h-80"
            />
          ))}
        </div>
      </div>
    </section>
  )
}
