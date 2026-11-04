import { useTranslation } from 'react-i18next'
import mail from '#/assets/images/icon-mail.svg'
import { GlassCard } from '#/components/glass-card'
import { SectionHeading } from '#/components/section-heading'

export function ContactHero() {
  const { t } = useTranslation()

  return (
    <section
      aria-labelledby="contact-title"
      className="bg-brand-flow-cool px-6 pt-[calc(var(--brand-header-height)+var(--brand-header-offset)+3.375rem)] pb-16 sm:px-10 lg:pb-20"
    >
      <div className="mx-auto grid max-w-[75rem] items-center gap-10 lg:grid-cols-[1.9fr_1fr] lg:gap-20">
        <SectionHeading
          id="contact-title"
          as="h1"
          align="left"
          eyebrow={t('contact.hero.eyebrow')}
          title={t('contact.hero.title')}
          description={t('contact.hero.description')}
          className="[&_p]:max-w-none"
        />
        <GlassCard
          variant="solid"
          className="space-y-6 rounded-[40px] border-0 p-8"
        >
          <img src={mail} alt="" width={28} height={28} />
          <h2 className="font-display text-4xl leading-[1.14] font-bold text-balance">
            {t('contact.hero.noteTitle')}
          </h2>
          <p className="leading-relaxed text-brand-ink-soft">
            {t('contact.hero.noteDescription')}
          </p>
        </GlassCard>
      </div>
    </section>
  )
}
