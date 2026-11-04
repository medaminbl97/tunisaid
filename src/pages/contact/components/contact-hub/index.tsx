import { useTranslation } from 'react-i18next'
import { DirectContactCard } from '#/components/direct-contact-card'
import { SectionHeading } from '#/components/section-heading'
import { siteContact } from '#/lib/site-contact'
import { MessageForm } from '../message-form'

export function ContactHub() {
  const { t } = useTranslation()

  return (
    <section
      aria-label={t('contact.hub.label')}
      className="bg-brand-flow-warm px-6 pt-10 pb-16 sm:px-10 lg:pb-24"
    >
      <div className="mx-auto grid max-w-[75rem] items-start gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="space-y-5">
          <SectionHeading
            align="left"
            size="compact"
            eyebrow={t('contact.hub.eyebrow')}
            title={t('contact.hub.title')}
            className="[&>h2]:sm:text-[34px]"
          />
          <DirectContactCard
            label={t('siteContact.email')}
            value={siteContact.email}
            hint={t('contact.hub.emailHint')}
            href={`mailto:${siteContact.email}`}
          />
          <DirectContactCard
            label={t('siteContact.call')}
            value={siteContact.phone}
            hint={t('contact.hub.phoneHint')}
            href={siteContact.phoneHref}
          />
          <DirectContactCard
            label={t('contact.hub.visit')}
            value={siteContact.address}
            hint={t('contact.hub.visitHint')}
            href={siteContact.mapHref}
          />
        </div>
        <MessageForm />
      </div>
    </section>
  )
}
