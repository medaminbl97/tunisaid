import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import arrowRight from '#/assets/images/arrow-right-white.svg'
import { GlassCard } from '#/components/glass-card'
import { SectionHeading } from '#/components/section-heading'
import { Button } from '#/components/ui/button'

const possibilities = ['ramp', 'ride', 'classroom'] as const

export function WorkHero() {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()

  return (
    <section
      aria-labelledby="work-title"
      className="bg-brand-flow-cool px-6 pt-[calc(var(--brand-header-height)+var(--brand-header-offset)+3.375rem)] pb-16 sm:px-10 lg:pb-[104px]"
    >
      <div className="mx-auto grid max-w-[75rem] items-center gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
        <div className="space-y-7">
          <SectionHeading
            id="work-title"
            as="h1"
            align="left"
            eyebrow={t('work.hero.eyebrow')}
            title={t('work.hero.title')}
            description={t('work.hero.description')}
          />
          <Button asChild size="cta" shape="pill">
            <a href="#support">
              {t('work.hero.action')}
              <img src={arrowRight} alt="" width={18} height={18} />
            </a>
          </Button>
        </div>
        <GlassCard
          variant="solid"
          className="space-y-4 rounded-[40px] border-0 p-8 sm:p-10"
        >
          <p className="text-xs font-extrabold tracking-wider text-brand-lagoon-deep uppercase">
            {t('work.hero.illustration.eyebrow')}
          </p>
          <ul className="space-y-4">
            {possibilities.map((possibility, index) => (
              <motion.li
                key={possibility}
                initial={reduceMotion ? false : { opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: reduceMotion ? 0 : 0.45,
                  delay: reduceMotion ? 0 : index * 0.12,
                }}
                className="font-display text-[clamp(2rem,3vw,2.625rem)] leading-[1.12] font-bold"
              >
                {t(`work.hero.illustration.${possibility}`)}
              </motion.li>
            ))}
          </ul>
          <p className="font-display text-[28px] font-bold text-brand-lagoon-deep">
            {t('work.hero.illustration.forward')}
          </p>
          <p className="text-[15px] leading-relaxed text-brand-ink-soft">
            {t('work.hero.illustration.description')}
          </p>
        </GlassCard>
      </div>
    </section>
  )
}
