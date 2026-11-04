import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import arrowWhite from '#/assets/images/arrow-right-white.svg'
import arrowInk from '#/assets/images/arrow-right-ink.svg'
import mail from '#/assets/images/icon-mail.svg'
import packageIcon from '#/assets/images/icon-package.svg'
import handCoins from '#/assets/images/icon-hand-coins.svg'
import users from '#/assets/images/icon-users.svg'
import glassBlob1 from '#/assets/images/involvement-glass-blob-1.svg'
import glassBlob2 from '#/assets/images/involvement-glass-blob-2.svg'
import glassBlob3 from '#/assets/images/involvement-glass-blob-3.svg'
import { ActionCard } from '#/components/action-card'
import { SectionHeading } from '#/components/section-heading'
import { Button } from '#/components/ui/button'

const opportunities = [
  { key: 'contact', icon: mail, to: '/contact', featured: false },
  { key: 'materials', icon: packageIcon, to: '/contact', featured: false },
  { key: 'financial', icon: handCoins, to: '/donate', featured: true },
  { key: 'volunteer', icon: users, to: '/contact', featured: false },
] as const

export function GetInvolvedSection() {
  const { t } = useTranslation('common', { keyPrefix: 'home.getInvolved' })

  return (
    <section
      aria-labelledby="home-get-involved-heading"
      className="relative isolate overflow-clip bg-brand-flow-cool px-6 py-16 sm:px-10 lg:py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <img
          src={glassBlob1}
          alt=""
          className="absolute top-[173.333px] -left-[206.667px] max-w-none"
        />
        <img
          src={glassBlob2}
          alt=""
          className="absolute -top-[43.333px] left-[64.35%] max-w-none"
        />
        <img
          src={glassBlob3}
          alt=""
          className="absolute top-[286.667px] left-[37.96%] max-w-none"
        />
      </div>
      <div className="mx-auto flex max-w-[75rem] flex-col gap-14">
        <SectionHeading
          id="home-get-involved-heading"
          eyebrow={t('eyebrow')}
          title={t('title')}
          description={t('description')}
        />
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {opportunities.map((opportunity, index) => (
            <li key={opportunity.key} className="min-w-0">
              <ActionCard
                icon={
                  <img src={opportunity.icon} alt="" width={28} height={28} />
                }
                title={t(`items.${opportunity.key}.title`)}
                description={t(`items.${opportunity.key}.description`)}
                featured={opportunity.featured}
                delay={index * 0.08}
                action={
                  <Button
                    asChild
                    variant={opportunity.featured ? 'sun' : 'default'}
                    shape="pill"
                    size="cta"
                    className="max-w-full whitespace-normal text-left"
                  >
                    <Link to={opportunity.to}>
                      {t(`items.${opportunity.key}.action`)}
                      <img
                        src={opportunity.featured ? arrowInk : arrowWhite}
                        alt=""
                        width={18}
                        height={18}
                        className="shrink-0"
                      />
                    </Link>
                  </Button>
                }
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
