import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import arrowRight from '#/assets/images/arrow-right-lagoon.svg'
import decorCircle from '#/assets/images/impact-decor-circle.svg'
import glassBlob1 from '#/assets/images/impact-glass-blob-1.svg'
import glassBlob2 from '#/assets/images/impact-glass-blob-2.svg'
import glassBlob3 from '#/assets/images/impact-glass-blob-3.svg'
import { SectionHeading } from '#/components/section-heading'
import { StatCard } from '#/components/stat-card'
import { Button } from '#/components/ui/button'

const statistics = [
  { key: 'founded', value: '2016' },
  { key: 'partners', value: '3' },
  { key: 'countries', value: '2' },
  { key: 'values', value: '4' },
] as const

export function ImpactSection() {
  const { t } = useTranslation('common', { keyPrefix: 'home.impact' })

  return (
    <section
      aria-labelledby="home-impact-heading"
      className="bg-brand-flow-warm px-4 pb-16 sm:px-10 lg:pb-24"
    >
      <div className="relative isolate mx-auto grid max-w-[85rem] items-center gap-10 overflow-clip rounded-[32px] bg-brand-impact p-6 sm:rounded-[48px] sm:p-12 lg:grid-cols-[minmax(0,27fr)_minmax(0,31fr)] lg:gap-16 lg:px-20 lg:py-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <img
            src={glassBlob1}
            alt=""
            className="absolute -top-6 left-[49%] max-w-none"
          />
          <img
            src={glassBlob2}
            alt=""
            className="absolute top-[200px] left-[66%] max-w-none"
          />
          <img
            src={glassBlob3}
            alt=""
            className="absolute top-[307px] left-[40%] max-w-none"
          />
          <img
            src={decorCircle}
            alt=""
            className="absolute -top-40 left-[72%] max-w-none"
          />
        </div>
        <div className="flex min-w-0 flex-col items-start gap-6">
          <SectionHeading
            id="home-impact-heading"
            align="left"
            tone="inverse"
            eyebrowVariant="pill"
            eyebrow={t('eyebrow')}
            title={t('title')}
            description={t('description')}
            className="gap-6"
          />
          <Button asChild variant="white" size="cta" shape="pill">
            <Link to="/what-we-do">
              {t('action')}
              <img src={arrowRight} alt="" width={18} height={18} />
            </Link>
          </Button>
        </div>
        <dl className="grid min-w-0 gap-5 min-[400px]:grid-cols-2">
          {statistics.map((statistic, index) => (
            <StatCard
              key={statistic.key}
              delay={index * 0.08}
              label={t(`statistics.${statistic.key}`)}
              value={statistic.value}
            />
          ))}
        </dl>
      </div>
    </section>
  )
}
