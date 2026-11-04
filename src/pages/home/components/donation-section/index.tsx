import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import decorA from '#/assets/images/donation-decor-a.svg'
import decorB from '#/assets/images/donation-decor-b.svg'
import arrowWhite from '#/assets/images/arrow-right-white.svg'
import { CtaBanner } from '#/components/cta-banner'
import { Button } from '#/components/ui/button'

export function DonationSection() {
  const { t } = useTranslation('common', { keyPrefix: 'home.donation' })

  return (
    <section
      aria-labelledby="home-donation-heading"
      className="bg-brand-flow-glow px-6 py-16 sm:px-10 lg:py-24"
    >
      <div className="mx-auto max-w-[85rem]">
        <CtaBanner
          id="home-donation-heading"
          title={t('title')}
          description={t('description')}
          decoration={
            <>
              <img
                src={decorA}
                alt=""
                className="absolute -top-[120px] left-3/4 max-w-none"
              />
              <img
                src={decorB}
                alt=""
                className="absolute top-[130px] left-[55.88%] max-w-none"
              />
            </>
          }
          actions={
            <>
              <Button
                asChild
                size="cta"
                shape="pill"
                className="max-w-full whitespace-normal text-left"
              >
                <Link to="/donate">
                  {t('donate')}
                  <img
                    src={arrowWhite}
                    alt=""
                    width={18}
                    height={18}
                    className="shrink-0"
                  />
                </Link>
              </Button>
              <Button
                asChild
                variant="brandOutline"
                size="cta"
                shape="pill"
                className="max-w-full whitespace-normal text-left"
              >
                <Link to="/contact">{t('volunteer')}</Link>
              </Button>
            </>
          }
        />
      </div>
    </section>
  )
}
