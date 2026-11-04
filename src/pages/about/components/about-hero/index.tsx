import { useTranslation } from 'react-i18next'
import heartHandshake from '#/assets/images/icon-heart-handshake.svg'
import { SectionHeading } from '#/components/section-heading'
import { StatementCard } from '#/components/statement-card'

export function AboutHero() {
  const { t } = useTranslation()

  return (
    <section
      aria-labelledby="about-title"
      className="bg-brand-flow-cool px-6 pt-[calc(var(--brand-header-height)+var(--brand-header-offset)+3.375rem)] pb-16 sm:px-10 lg:pb-[88px]"
    >
      <div className="mx-auto grid max-w-[75rem] items-center gap-10 lg:grid-cols-[1.9fr_1fr] lg:gap-16">
        <SectionHeading
          id="about-title"
          as="h1"
          align="left"
          eyebrow={t('about.hero.eyebrow')}
          title={t('about.hero.title')}
          description={t('about.hero.description')}
          className="[&_p]:max-w-none"
        />
        <StatementCard
          as="h2"
          tone="lagoon"
          eyebrow={t('about.hero.snapshot.eyebrow')}
          title={t('about.hero.snapshot.title')}
          description={t('about.hero.snapshot.description')}
          icon={<img src={heartHandshake} alt="" width={28} height={28} />}
          className="sm:px-8 sm:py-9"
        />
      </div>
    </section>
  )
}
