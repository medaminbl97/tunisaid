import { useTranslation } from 'react-i18next'
import users from '#/assets/images/icon-users.svg'
import { GlassCard } from '#/components/glass-card'
import { SectionHeading } from '#/components/section-heading'

export function TeamSection() {
  const { t } = useTranslation()

  return (
    <section
      aria-labelledby="about-team-title"
      className="bg-brand-flow-peach px-6 py-16 sm:px-10 lg:py-20"
    >
      <GlassCard
        variant="solid"
        className="mx-auto max-w-[75rem] space-y-6 rounded-[40px] border-0 bg-brand-terracotta-soft p-6 sm:p-10 lg:px-16 lg:py-14"
      >
        <SectionHeading
          id="about-team-title"
          align="left"
          size="compact"
          eyebrow={t('about.team.eyebrow')}
          title={t('about.team.title')}
          description={t('about.team.description')}
          className="[&_p]:max-w-none"
        />
        <div className="flex min-h-[260px] flex-col items-center justify-center gap-5 rounded-[28px] bg-brand-cream px-6 py-12 text-center sm:min-h-[340px]">
          <img src={users} alt="" width={28} height={28} />
          <p className="font-display text-3xl font-bold text-brand-ink">
            {t('about.team.photoTitle')}
          </p>
          <p className="text-sm font-bold text-brand-lagoon-deep">
            {t('about.team.photoPlaceholder')}
          </p>
        </div>
      </GlassCard>
    </section>
  )
}
