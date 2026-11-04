import { useTranslation } from 'react-i18next'
import { SectionHeading } from '#/components/section-heading'

export function ContactClosing() {
  const { t } = useTranslation()

  return (
    <section
      aria-labelledby="contact-closing-title"
      className="bg-brand-cream px-6 pt-12 pb-20 sm:px-10"
    >
      <SectionHeading
        id="contact-closing-title"
        size="compact"
        title={t('contact.closing.title')}
        description={t('contact.closing.description')}
        className="mx-auto max-w-[50rem] [&>h2]:max-w-[35rem] [&>h2]:sm:text-[40px]"
      />
    </section>
  )
}
