import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { SectionHeading } from '#/components/section-heading'

const outcomes = ['school', 'journey', 'future'] as const

export function PossibilitiesSection() {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()

  return (
    <section
      aria-labelledby="possibilities-title"
      className="bg-brand-cream px-4 py-16 sm:px-10"
    >
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: reduceMotion ? 0 : 0.6 }}
        className="mx-auto grid max-w-[85rem] items-center gap-10 rounded-[40px] bg-brand-feature px-6 py-10 text-brand-white sm:p-12 lg:grid-cols-[1.5fr_1fr] lg:gap-20 lg:px-20 lg:py-16"
      >
        <SectionHeading
          id="possibilities-title"
          align="left"
          tone="inverse"
          eyebrow={t('work.possibilities.eyebrow')}
          title={t('work.possibilities.title')}
          description={t('work.possibilities.description')}
          className="[&>p:first-child]:text-brand-sun-soft"
        />
        <div className="space-y-8">
          <ol className="space-y-8">
            {outcomes.map((outcome, index) => (
              <li
                key={outcome}
                className="flex items-baseline gap-4 font-display text-[22px] leading-relaxed font-bold"
              >
                <span aria-hidden="true">0{index + 1}</span>
                <span>{t(`work.possibilities.items.${outcome}`)}</span>
              </li>
            ))}
          </ol>
          <p className="text-sm leading-relaxed">
            {t('work.possibilities.note')}
          </p>
        </div>
      </motion.div>
    </section>
  )
}
