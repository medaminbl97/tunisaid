import { useTranslation } from 'react-i18next'
import mail from '#/assets/images/icon-mail.svg'
import phone from '#/assets/images/icon-phone.svg'
import mapPin from '#/assets/images/icon-map-pin.svg'
import { ContactItem } from '#/components/contact-item'
import { SectionHeading } from '#/components/section-heading'
import { siteContact } from '#/lib/site-contact'

const contactItems = [
  {
    key: 'visit',
    icon: mapPin,
    href: siteContact.mapHref,
    value: siteContact.address,
  },
  {
    key: 'email',
    icon: mail,
    href: `mailto:${siteContact.email}`,
    value: siteContact.email,
  },
  {
    key: 'call',
    icon: phone,
    href: siteContact.phoneHref,
    value: siteContact.phone,
  },
] as const

export function ContactStrip() {
  const { t } = useTranslation('common', { keyPrefix: 'siteContact' })

  return (
    <section
      aria-labelledby="site-contact-heading"
      className="bg-brand-cream px-6 pb-16 sm:px-10 lg:pb-20"
    >
      <div className="mx-auto flex max-w-[75rem] flex-col gap-7 rounded-(--brand-contact-radius) bg-brand-lagoon-tint px-6 py-9 sm:px-10">
        <SectionHeading
          id="site-contact-heading"
          align="left"
          eyebrow={t('eyebrow')}
          title={t('title')}
          className="gap-2 [&>h2]:text-[28px] [&>h2]:leading-[1.24] sm:[&>h2]:text-[34px] [&>p]:text-xs [&>p]:leading-normal [&>p]:tracking-[1.2px] [&>p]:text-brand-lagoon-deep"
        />
        <div aria-hidden="true" className="h-px bg-brand-contact-divider" />
        <div className="-mx-4 grid items-start gap-3 lg:grid-cols-3">
          {contactItems.map((item, index) => (
            <ContactItem
              key={item.key}
              title={t(item.key)}
              description={t(`descriptions.${item.key}`)}
              icon={<img src={item.icon} alt="" width={28} height={28} />}
              delay={index * 0.08}
            >
              <a
                href={item.href}
                className="rounded-sm text-brand-ink underline-offset-4 outline-none hover:text-brand-lagoon-deep hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                {item.value}
              </a>
            </ContactItem>
          ))}
        </div>
      </div>
    </section>
  )
}
