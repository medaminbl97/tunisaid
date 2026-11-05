import { useTranslation } from 'react-i18next'
import { SectionHeading } from '#/components/section-heading'
import { ImagePanel } from '#/components/image-panel'
import { editorialImages } from '#/lib/site-images'

const areas = [
  'mobility',
  'education',
  'access',
  'partnerships',
  'transport',
  'community',
] as const

export function SupportSection() {
  const { t } = useTranslation()

  return (
    <section
      id="support"
      aria-labelledby="support-title"
      className="scroll-mt-[calc(var(--brand-header-height)+3rem)] bg-brand-flow-warm px-6 py-16 sm:px-10 lg:py-24"
    >
      <div className="mx-auto max-w-[75rem] space-y-12">
        <SectionHeading
          id="support-title"
          align="left"
          size="compact"
          eyebrow={t('work.support.eyebrow')}
          title={t('work.support.title')}
          description={t('work.support.description')}
          className="max-w-[45rem]"
        />
        <ImagePanel
          image={editorialImages.learning}
          alt={t('imagery.learning')}
          caption={t('imagery.caption')}
          sizes="(min-width: 1280px) 1200px, calc(100vw - 48px)"
          imageClassName="aspect-[4/3] sm:aspect-[2/1] object-[center_40%]"
        />
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area) => (
            <div
              key={area}
              className="space-y-3 border-t border-brand-contact-divider pt-5"
            >
              <p className="text-xs font-extrabold uppercase text-brand-lagoon-deep">
                {t(`work.support.items.${area}.eyebrow`)}
              </p>
              <h3 className="font-display text-[28px] leading-tight font-bold">
                {t(`work.support.items.${area}.title`)}
              </h3>
              <p className="text-base leading-relaxed text-brand-ink-soft">
                {t(`work.support.items.${area}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
