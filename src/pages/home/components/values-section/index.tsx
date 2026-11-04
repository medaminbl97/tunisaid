import { useTranslation } from 'react-i18next'
import heart from '#/assets/images/icon-heart.svg'
import handshake from '#/assets/images/icon-heart-handshake.svg'
import shield from '#/assets/images/icon-shield-check.svg'
import users from '#/assets/images/icon-users.svg'
import glassBlob1 from '#/assets/images/values-glass-blob-1.svg'
import glassBlob2 from '#/assets/images/values-glass-blob-2.svg'
import glassBlob3 from '#/assets/images/values-glass-blob-3.svg'
import { SectionHeading } from '#/components/section-heading'
import { ValueCard } from '#/components/value-card'

const values = [
  { key: 'trusted', icon: shield },
  { key: 'charitable', icon: heart },
  { key: 'committed', icon: handshake },
  { key: 'diverse', icon: users },
] as const

export function ValuesSection() {
  const { t } = useTranslation('common', { keyPrefix: 'home.values' })

  return (
    <section
      aria-labelledby="home-values-heading"
      className="relative isolate overflow-clip bg-brand-sun-soft px-6 py-16 sm:px-10 lg:py-[104px]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <img
          src={glassBlob1}
          alt=""
          className="absolute -top-[87px] -left-[87px] max-w-none"
        />
        <img
          src={glassBlob2}
          alt=""
          className="absolute -top-[7px] left-[61%] max-w-none"
        />
        <img
          src={glassBlob3}
          alt=""
          className="absolute top-[230px] left-[32%] max-w-none"
        />
      </div>
      <div className="mx-auto flex max-w-[75rem] flex-col gap-14">
        <SectionHeading
          id="home-values-heading"
          eyebrow={t('eyebrow')}
          title={t('title')}
        />
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value, index) => (
            <li key={value.key} className="min-w-0">
              <ValueCard
                icon={<img src={value.icon} alt="" width={28} height={28} />}
                title={t(`items.${value.key}.title`)}
                description={t(`items.${value.key}.description`)}
                delay={index * 0.08}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
