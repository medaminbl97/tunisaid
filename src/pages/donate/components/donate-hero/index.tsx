import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ImagePanel } from '#/components/image-panel'
import { donationImages } from '#/lib/site-images'
import { SectionHeading } from '#/components/section-heading'
import { Button } from '#/components/ui/button'

export function DonateHero() {
  const { t } = useTranslation('donation')
  const { t: imageText } = useTranslation('common', { keyPrefix: 'imagery' })

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
        <div className="space-y-4">
          <ImagePanel
            image={donationImages.koffa}
            alt=""
            caption={imageText('donationCaption')}
            priority
            sizes="(min-width: 1280px) 460px, (min-width: 1024px) 40vw, calc(100vw - 48px)"
            imageClassName="aspect-[7/6]"
          />
          <p className="text-[11px] font-extrabold uppercase text-brand-lagoon-deep">
            {t('hero.artEyebrow')}
          </p>
          <h2 className="font-display text-[28px] leading-tight font-bold">
            {t('hero.artTitle')}
          </h2>
          <p className="text-sm text-brand-ink-soft">
            {t('hero.artDescription')}
          </p>
        </div>
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
