import { useTranslation } from 'react-i18next'
import { SectionHeading } from '#/components/section-heading'
import { StatementCard } from '#/components/statement-card'

const statements = ['mission', 'vision'] as const

export function ApproachSection() {
  const { t } = useTranslation()

  return (
    <section
      aria-labelledby="about-approach-title"
      className="bg-brand-flow-sunset px-6 py-16 sm:px-10 lg:py-24"
    >
      <div className="mx-auto max-w-[75rem] space-y-12">
        <SectionHeading
          id="about-approach-title"
          align="left"
          size="compact"
          eyebrow={t('about.approach.eyebrow')}
          title={t('about.approach.title')}
          className="max-w-[38rem]"
        />
        <div className="grid gap-6 md:grid-cols-2">
          {statements.map((statement) => (
            <StatementCard
              key={statement}
              eyebrow={t(`about.approach.${statement}.eyebrow`)}
              title={t(`about.approach.${statement}.title`)}
              description={t(`about.approach.${statement}.description`)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
