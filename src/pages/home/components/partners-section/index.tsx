import { useTranslation } from 'react-i18next'
import glassBlob1 from '#/assets/images/partners-glass-blob-1.svg'
import glassBlob2 from '#/assets/images/partners-glass-blob-2.svg'
import glassBlob3 from '#/assets/images/partners-glass-blob-3.svg'
import { PartnerCard } from '#/components/partner-card'
import { SectionHeading } from '#/components/section-heading'

const partners = [
  { initials: 'APH', name: 'APH EL AJA', tone: 'lagoon' },
  { initials: 'AAHPDC', name: 'AAHPDC', tone: 'sun' },
  { initials: 'ARASO', name: 'ARASO', tone: 'terracotta' },
] as const

export function PartnersSection() {
  const { t } = useTranslation('common', { keyPrefix: 'home.partners' })

  return (
    <section
      aria-labelledby="home-partners-heading"
      className="relative isolate overflow-clip bg-brand-flow-lagoon px-6 py-16 sm:px-10 lg:py-[104px]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <img
          src={glassBlob1}
          alt=""
          className="absolute top-[106.667px] -left-[53.333px] max-w-none"
        />
        <img
          src={glassBlob2}
          alt=""
          className="absolute -top-[86.667px] left-[61.34%] max-w-none"
        />
        <img
          src={glassBlob3}
          alt=""
          className="absolute top-[173.333px] left-[41.2%] max-w-none"
        />
      </div>
      <div className="mx-auto flex max-w-[75rem] flex-col gap-14">
        <SectionHeading
          id="home-partners-heading"
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
        />
        <ul className="grid gap-6 md:grid-cols-3">
          {partners.map((partner, index) => (
            <li key={partner.initials} className="min-w-0">
              <PartnerCard
                initials={partner.initials}
                name={partner.name}
                description={t('association')}
                tone={partner.tone}
                delay={index * 0.1}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
