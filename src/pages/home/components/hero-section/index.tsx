import { Link } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'motion/react'
import { Trans, useTranslation } from 'react-i18next'
import arrowRight from '#/assets/images/arrow-right-white.svg'
import glassBlob1 from '#/assets/images/hero-glass-blob-1.svg'
import glassBlob2 from '#/assets/images/hero-glass-blob-2.svg'
import glassBlob3 from '#/assets/images/hero-glass-blob-3.svg'
import glassBlob4 from '#/assets/images/hero-glass-blob-4.svg'
import heart from '#/assets/images/hero-heart.svg'
import illustration from '#/assets/images/hero-illustration.svg'
import kickerDot from '#/assets/images/hero-kicker-dot.svg'
import sunDisc from '#/assets/images/hero-sun-disc.svg'
import terracottaDisc from '#/assets/images/hero-terracotta-disc.svg'
import { InfoCard } from '#/components/info-card'
import { SectionHeading } from '#/components/section-heading'
import { Button } from '#/components/ui/button'

export function HeroSection() {
  const { t } = useTranslation('common', { keyPrefix: 'home.hero' })
  const reduceMotion = useReducedMotion()

  return (
    <section
      aria-labelledby="home-hero-heading"
      className="relative isolate overflow-clip bg-brand-cream px-6 pt-[calc(var(--brand-header-height)+var(--brand-header-offset)+3.375rem)] pb-16 sm:px-10 lg:pb-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <img
          src={glassBlob1}
          alt=""
          className="absolute -top-[293px] -left-[313px] max-w-none"
        />
        <img
          src={glassBlob2}
          alt=""
          className="absolute -top-[190px] left-[32%] max-w-none"
        />
        <img
          src={glassBlob3}
          alt=""
          className="absolute -top-[263px] left-[52%] max-w-none"
        />
        <img
          src={glassBlob4}
          alt=""
          className="absolute top-[320px] left-10 max-w-none"
        />
      </div>
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
        </div>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: reduceMotion ? 0 : 0.7 }}
          className="relative mx-auto aspect-[540/640] w-full max-w-[540px]"
        >
          <div className="absolute top-[6.25%] left-[1.11%] w-[27.78%]">
            <img
              src={sunDisc}
              alt=""
              width={150}
              height={150}
              className="block h-auto max-w-full"
            />
          </div>
          <div className="absolute top-0 left-[14.81%] w-[85.19%]">
            <img
              src={illustration}
              alt=""
              width={460}
              height={620}
              className="block h-auto max-w-full"
            />
          </div>
          <div className="absolute top-[84.375%] right-0 w-[15.56%]">
            <img
              src={terracottaDisc}
              alt=""
              width={84}
              height={84}
              className="block h-auto max-w-full"
            />
          </div>
          <InfoCard
            animation="float"
            className="absolute top-[73.44%] left-0"
            icon={<img src={heart} alt="" width={26} height={26} />}
            title={t('noteTitle')}
            description={t('noteDescription')}
          />
        </motion.div>
      </div>
    </section>
  )
}
