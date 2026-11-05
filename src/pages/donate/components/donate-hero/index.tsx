import { Link } from '@tanstack/react-router'
import { ArrowRight, Heart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import illustration from '#/assets/images/donation-koffa.svg'
import { GlassCard } from '#/components/glass-card'
import { SectionHeading } from '#/components/section-heading'
import { Button } from '#/components/ui/button'

export function DonateHero() {
  const { t } = useTranslation('donation')

  return (
    <section
      aria-labelledby="donate-title"
      className="bg-brand-cream px-6 pt-[calc(var(--brand-header-height)+var(--brand-header-offset)+3.375rem)] pb-16 sm:px-10 lg:pb-24"
    >
      <div className="mx-auto grid max-w-[75rem] items-center gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-24">
        <div className="space-y-7">
          <SectionHeading
            id="donate-title"
            as="h1"
            align="left"
            eyebrow={t('hero.eyebrow')}
            title={t('hero.title')}
            description={t('hero.description')}
            className="[&>p:first-child]:text-brand-lagoon-deep"
          />
          <Button asChild variant="sun" size="cta" shape="pill">
            <a href="#donation-purposes">
              {t('hero.action')} <ArrowRight aria-hidden="true" />
            </a>
          </Button>
          <p className="text-xs text-brand-ink-soft">
            {t('shared.illustrative')}
          </p>
        </div>
        <GlassCard
          variant="solid"
          className="space-y-5 rounded-[40px] border-0 bg-brand-lagoon-tint p-8"
        >
          <p className="flex items-center justify-between gap-4 text-[11px] font-extrabold uppercase">
            {t('hero.artEyebrow')}{' '}
            <Heart
              aria-hidden="true"
              className="size-6 text-brand-lagoon-deep"
            />
          </p>
          <img
            src={illustration}
            alt=""
            width={360}
            height={240}
            className="mx-auto h-auto w-full max-w-[360px]"
          />
          <h2 className="font-display text-[30px] leading-tight font-bold">
            {t('hero.artTitle')}
          </h2>
          <p className="text-sm text-brand-ink-soft">
            {t('hero.artDescription')}
          </p>
        </GlassCard>
      </div>
      <p className="mx-auto mt-10 max-w-[75rem] rounded-2xl bg-brand-sun-soft p-5 text-sm leading-relaxed">
        {t('shared.unavailable')}{' '}
        <Link
          to="/contact"
          className="font-bold text-brand-lagoon-deep underline underline-offset-4"
        >
          {t('shared.contact')}
        </Link>
      </p>
    </section>
  )
}
