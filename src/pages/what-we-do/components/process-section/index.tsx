import { useTranslation } from 'react-i18next'
import { SectionHeading } from '#/components/section-heading'
import { StatementCard } from '#/components/statement-card'

const steps = ['listen', 'build', 'sustain'] as const

export function ProcessSection() {
  const { t } = useTranslation()

  return (
    <section
      aria-labelledby="process-title"
      className="bg-brand-flow-to-sun px-6 py-16 sm:px-10 lg:py-24"
    >
      <div className="mx-auto max-w-[75rem] space-y-12">
        <SectionHeading
          id="process-title"
          align="left"
          size="compact"
          eyebrow={t('work.process.eyebrow')}
          title={t('work.process.title')}
          className="max-w-[50rem]"
        />
        <ol className="grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <li key={step}>
              <StatementCard
                size="compact"
                eyebrow={t(`work.process.items.${step}.eyebrow`)}
                title={t(`work.process.items.${step}.title`)}
                description={t(`work.process.items.${step}.description`)}
                className="lg:min-h-80"
              />
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
