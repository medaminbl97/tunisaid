import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { SectionHeading } from '#/components/section-heading'

export function StorySection() {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()

  return (
    <section
      aria-labelledby="about-story-title"
      className="bg-brand-flow-warm px-6 py-16 sm:px-10 lg:py-20"
    >
      <div className="mx-auto grid max-w-[75rem] gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <SectionHeading
          id="about-story-title"
          align="left"
          size="compact"
          eyebrow={t('about.story.eyebrow')}
          title={t('about.story.title')}
        />
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: reduceMotion ? 0 : 0.6 }}
          className="space-y-6 text-[17px] leading-relaxed text-brand-ink-soft"
        >
          <p>{t('about.story.origin')}</p>
          <p>{t('about.story.bridge')}</p>
        </motion.div>
      </div>
    </section>
  )
}
