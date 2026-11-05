import { useTranslation } from 'react-i18next'
import { ImagePanel } from '#/components/image-panel'
import { editorialImages } from '#/lib/site-images'
import { SectionHeading } from '#/components/section-heading'

export function ContactHero() {
  const { t } = useTranslation()

  return (
    <section
      aria-labelledby="contact-title"
      className="bg-brand-flow-cool px-6 pt-[calc(var(--brand-header-height)+var(--brand-header-offset)+3.375rem)] pb-16 sm:px-10 lg:pb-20"
    >
      <div className="mx-auto grid max-w-[75rem] items-center gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        <div className="space-y-7">
          <SectionHeading
            id="contact-title"
            as="h1"
            align="left"
            eyebrow={t('contact.hero.eyebrow')}
            title={t('contact.hero.title')}
            description={t('contact.hero.description')}
            className="[&_p]:max-w-none"
          />
          <div className="space-y-2 border-l-2 border-brand-lagoon-deep pl-5">
            <h2 className="font-display text-2xl leading-[1.14] font-bold text-balance">
              {t('contact.hero.noteTitle')}
            </h2>
            <p className="leading-relaxed text-brand-ink-soft">
              {t('contact.hero.noteDescription')}
            </p>
          </div>
        </div>
        <ImagePanel
          image={editorialImages.collaboration}
          alt={t('imagery.collaboration')}
          caption={t('imagery.caption')}
          priority
          sizes="(min-width: 1280px) 516px, (min-width: 1024px) 42vw, calc(100vw - 48px)"
          imageClassName="aspect-[5/4] object-[70%_center]"
        />
      </div>
    </section>
  )
}
