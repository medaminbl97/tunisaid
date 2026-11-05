import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Accessibility,
  ArrowRight,
  GraduationCap,
  Heart,
  Package,
  ShieldCheck,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DonationBasketSummary } from '#/components/donation-basket-summary'
import { useDonationBasket } from '#/components/donation-provider'
import { FilterGroup } from '#/components/filter-group'
import { IconLabel } from '#/components/icon-label'
import { PurposeCard } from '#/components/purpose-card'
import { SectionHeading } from '#/components/section-heading'
import { Button } from '#/components/ui/button'
import {
  donationPurposes,
  donationTotal,
  formatDonationAmount,
} from '#/lib/donation'
import type { DonationCategory, DonationPurposeId } from '#/lib/donation'

const icons = {
  koffa: Package,
  wheelchair: Accessibility,
  school: GraduationCap,
  warmth: Heart,
}
const filters = ['all', 'essentials', 'mobility', 'education'] as const

export function PurposeSelection() {
  const { t, i18n } = useTranslation('donation')
  const { basket, setQuantity } = useDonationBasket()
  const [filter, setFilter] = useState<DonationCategory | 'all'>('all')
  const [lastAdded, setLastAdded] = useState<{
    id: DonationPurposeId
    quantity: number
  } | null>(null)
  const total = donationTotal(basket)
  const visible = donationPurposes.filter(
    (purpose) => filter === 'all' || purpose.category === filter,
  )

  return (
    <section
      id="donation-purposes"
      aria-labelledby="donation-purposes-title"
      className="bg-brand-cream px-6 py-12 sm:px-10 lg:py-16"
    >
      <div className="mx-auto grid max-w-[75rem] items-start gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,0.92fr)]">
        <div className="min-w-0 space-y-7">
          <SectionHeading
            id="donation-purposes-title"
            align="left"
            size="compact"
            eyebrow={t('selection.eyebrow')}
            title={t('selection.title')}
            description={t('selection.description')}
          />
          <FilterGroup
            label={t('selection.filterLabel')}
            options={filters.map((value) => ({
              value,
              label: t(`selection.filters.${value}`),
            }))}
            value={filter}
            onChange={setFilter}
          />
          <p role="status" className="sr-only">
            {lastAdded &&
              t('selection.added', {
                title: t(`purposes.${lastAdded.id}.title`),
                quantity: lastAdded.quantity,
              })}
          </p>
          <ul className="grid gap-6 sm:grid-cols-2">
            {visible.map((purpose) => {
              const Icon = icons[purpose.id]
              const title = t(`purposes.${purpose.id}.title`)
              return (
                <li key={purpose.id}>
                  <PurposeCard
                    icon={<Icon aria-hidden="true" className="size-7" />}
                    category={t(`purposes.${purpose.id}.category`)}
                    title={title}
                    description={t(`purposes.${purpose.id}.description`)}
                    impact={t(`purposes.${purpose.id}.impact`)}
                    amount={formatDonationAmount(purpose.cents, i18n.language)}
                    unit={t(`purposes.${purpose.id}.unit`)}
                    action={
                      <Button
                        type="button"
                        variant="sun"
                        shape="pill"
                        className="min-h-12"
                        aria-label={t('selection.addLabel', { title })}
                        disabled={!Number.isSafeInteger(total + purpose.cents)}
                        onClick={() => {
                          setQuantity(
                            purpose.id,
                            basket.quantities[purpose.id] + 1,
                          )
                          setLastAdded({
                            id: purpose.id,
                            quantity: basket.quantities[purpose.id] + 1,
                          })
                        }}
                      >
                        {t('selection.add')} <ArrowRight aria-hidden="true" />
                      </Button>
                    }
                  />
                </li>
              )
            })}
          </ul>
          <p className="text-xs text-brand-ink-soft">
            {t('shared.illustrative')}
          </p>
        </div>
        <aside
          aria-label={t('selection.basketLabel')}
          className="space-y-8 lg:sticky lg:top-[calc(var(--brand-header-expanded-height)+2rem)]"
        >
          <DonationBasketSummary
            title={t('selection.basketTitle')}
            editable
            action={
              total > 0 ? (
                <Button
                  asChild
                  className="w-full whitespace-normal"
                  size="cta"
                  shape="pill"
                >
                  <Link to="/donate/checkout">
                    {t('selection.checkout')} <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              ) : (
                <Button
                  disabled
                  className="w-full whitespace-normal"
                  size="cta"
                  shape="pill"
                >
                  {t('selection.checkout')}
                </Button>
              )
            }
          >
            <IconLabel icon={<ShieldCheck className="size-7" />}>
              {t('selection.reassurance')}
            </IconLabel>
          </DonationBasketSummary>
          <div className="space-y-4 px-6">
            <h2 className="font-display text-2xl font-bold">
              {t('selection.materialTitle')}
            </h2>
            <p className="text-sm leading-relaxed text-brand-ink-soft">
              {t('selection.materialDescription')}
            </p>
            <Button asChild variant="brandOutline" shape="pill" size="cta">
              <Link to="/contact">
                {t('selection.materialAction')}{' '}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </aside>
      </div>
    </section>
  )
}
