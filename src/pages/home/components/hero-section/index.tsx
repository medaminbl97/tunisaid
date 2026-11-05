import { Link } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'motion/react'
import { Trans, useTranslation } from 'react-i18next'
import arrowRight from '#/assets/images/arrow-right-white.svg'
import kickerDot from '#/assets/images/hero-kicker-dot.svg'
import { ImagePanel } from '#/components/image-panel'
import { SectionHeading } from '#/components/section-heading'
import { Button } from '#/components/ui/button'
import { editorialImages } from '#/lib/site-images'

export function HeroSection() {
  const { t } = useTranslation('common', { keyPrefix: 'home.hero' })
  const { t: imageText } = useTranslation('common', { keyPrefix: 'imagery' })
  const reduceMotion = useReducedMotion()

  return (
    <section
      aria-labelledby="home-hero-heading"
      className="relative isolate overflow-clip bg-brand-flow-cool px-6 pt-[calc(var(--brand-header-height)+var(--brand-header-offset)+3.375rem)] pb-16 sm:px-10 lg:pb-24"
    >
      <div className="mx-auto grid max-w-[75rem] items-center gap-12 lg:grid-cols-[minmax(0,31fr)_minmax(0,27fr)] lg:gap-10">
        <div className="flex min-w-0 flex-col items-start gap-7">
          <SectionHeading
            id="home-hero-heading"
            as="h1"
            align="left"
            eyebrowVariant="pill"
            eyebrow={
              <>
                <img src={kickerDot} alt="" width={8} height={8} />
                {t('eyebrow')}
              </>
            }
            title={
              <Trans
                i18nKey="home.hero.title"
                components={{
                  emphasis: <em className="text-brand-terracotta" />,
                }}
              />
            }
            description={t('description')}
            className="gap-7"
          />
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: reduceMotion ? 0 : 0.5,
              delay: reduceMotion ? 0 : 0.15,
            }}
            className="flex w-full flex-wrap gap-4"
          >
            <Button asChild size="cta" shape="pill">
              <Link to="/contact">
                {t('primaryAction')}
                <img src={arrowRight} alt="" width={18} height={18} />
              </Link>
            </Button>
            <Button asChild variant="brandOutline" size="cta" shape="pill">
              <Link to="/what-we-do">{t('secondaryAction')}</Link>
            </Button>
          </motion.div>
          <p className="max-w-[32rem] text-sm leading-relaxed text-brand-ink-soft">
            <strong className="font-bold text-brand-ink">
              {t('noteTitle')}
            </strong>{' '}
            {t('noteDescription')}
          </p>
        </div>
        <ImagePanel
          image={editorialImages.independence}
          alt={imageText('independence')}
          caption={imageText('caption')}
          priority
          sizes="(min-width: 1280px) 540px, (min-width: 1024px) 45vw, calc(100vw - 48px)"
          imageClassName="aspect-[5/4] object-[70%_center] lg:aspect-[4/5]"
        />
      </div>
    </section>
  )
}
