import { useTranslation } from 'react-i18next'
import { SectionHeading } from '#/components/section-heading'
import { StatementCard } from '#/components/statement-card'

const prompts = ['volunteer', 'materials', 'partnerships'] as const

export function ConversationStarters() {
  const { t } = useTranslation()

  return (
    <section
      aria-labelledby="conversation-starters-title"
      className="bg-brand-flow-glow px-6 py-16 sm:px-10 lg:py-20"
    >
      <div className="mx-auto max-w-[75rem] space-y-10">
        <SectionHeading
          id="conversation-starters-title"
          align="left"
          size="compact"
          eyebrow={t('contact.prompts.eyebrow')}
          title={t('contact.prompts.title')}
          className="max-w-[40rem]"
        />
        <div className="grid gap-6 md:grid-cols-3">
          {prompts.map((prompt) => (
            <StatementCard
              key={prompt}
              size="compact"
              eyebrow={t(`contact.prompts.items.${prompt}.eyebrow`)}
              title={t(`contact.prompts.items.${prompt}.title`)}
              description={t(`contact.prompts.items.${prompt}.description`)}
              className="lg:min-h-[270px]"
            />
          ))}
        </div>
      </div>
    </section>
  )
}
