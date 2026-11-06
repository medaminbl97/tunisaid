import { useEffect, useMemo, useState } from 'react'
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
import { ImagePanel } from '#/components/image-panel'
import { donationPurposeCategories } from '#/api/collections/donation-purposes/queries'
import { useDonationPurposes } from '#/hooks/use-donation-purposes'
import { donationImage } from '#/lib/site-images'
import {
  basketQuantity,
  donationTotal,
  formatDonationAmount,
} from '#/lib/donation'

const categoryIcons: Partial<Record<string, typeof Heart>> = {
  essentials: Package,
  mobility: Accessibility,
  education: GraduationCap,
}

type PurposeSelectionProps = {
  // Gifts are attributed by project, so a campaign filters to its projects.
  campaign?: { slug: string; title: string; projectSlugs: string[] }
  projectSlug?: string
  generalPurpose?: boolean
}

export function PurposeSelection(props: PurposeSelectionProps) {
  const { t, i18n } = useTranslation('donation')
  const { t: imageText } = useTranslation('common', { keyPrefix: 'imagery' })
  const { basket, setQuantity } = useDonationBasket()
  const purposesQuery = useDonationPurposes()
  const purposes = purposesQuery.data ?? []
  const categories = donationPurposeCategories(purposes)
  const { campaign } = props
  const searchFilter = props.generalPurpose
    ? 'general'
    : props.projectSlug
      ? `project:${props.projectSlug}`
      : campaign
        ? `campaign:${campaign.slug}`
        : 'all'
  const [selectedFilter, setFilter] = useState(searchFilter)
  useEffect(() => {
    setFilter(searchFilter)
  }, [searchFilter])
  const projects = useMemo(() => {
    const linked = new Map<string, string>()
    for (const purpose of purposes) {
      if (purpose.project)
        linked.set(purpose.project.slug, purpose.project.title)
    }
    return [...linked].sort((a, b) => a[1].localeCompare(b[1]))
  }, [purposes])
  const filterOptions = [
    { value: 'all', label: t('selection.filters.all') },
    ...categories.map((category) => ({
      value: `category:${category.slug}`,
      label: category.title,
    })),
    ...(campaign
      ? [
          {
            value: `campaign:${campaign.slug}`,
            label: t('selection.filters.campaign', { title: campaign.title }),
          },
        ]
      : []),
    ...projects.map(([slug, title]) => ({
      value: `project:${slug}`,
      label: t('selection.filters.project', { title }),
    })),
    ...(purposes.some((purpose) => purpose.project === null) ||
    props.generalPurpose
      ? [{ value: 'general', label: t('selection.filters.general') }]
      : []),
  ]
  const [lastAdded, setLastAdded] = useState<{
    title: string
    quantity: number
  } | null>(null)
  const total = donationTotal(basket)
  const visible = purposes.filter((purpose) => {
    if (selectedFilter === 'all') return true
    if (selectedFilter === 'general') return purpose.project === null
    if (selectedFilter.startsWith('category:')) {
      return purpose.category?.slug === selectedFilter.slice(9)
    }
    if (selectedFilter.startsWith('project:')) {
      return purpose.project?.slug === selectedFilter.slice(8)
    }
    if (campaign && selectedFilter === `campaign:${campaign.slug}`) {
      return (
        purpose.project !== null &&
        campaign.projectSlugs.includes(purpose.project.slug)
      )
    }
    return false
  })

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
          {filterOptions.length > 1 && (
            <FilterGroup
              label={t('selection.filterLabel')}
              options={filterOptions}
              value={selectedFilter}
              onChange={setFilter}
            />
          )}
          <p role="status" className="sr-only">
            {lastAdded &&
              t('selection.added', {
                title: lastAdded.title,
                quantity: lastAdded.quantity,
              })}
          </p>
          {purposesQuery.isPending ? (
            <p
              role="status"
              className="rounded-[24px] bg-brand-white p-6 text-brand-ink-soft"
            >
              {t('selection.loading')}
            </p>
          ) : purposesQuery.isError ? (
            <div
              role="alert"
              className="space-y-4 rounded-[24px] bg-brand-white p-6"
            >
              <p className="text-brand-ink">{t('selection.error')}</p>
              <Button
                type="button"
                variant="brandOutline"
                shape="pill"
                disabled={purposesQuery.isFetching}
                onClick={() => void purposesQuery.refetch()}
              >
                {t('selection.retry')}
              </Button>
            </div>
          ) : purposes.length === 0 ? (
            <p className="rounded-[24px] bg-brand-white p-6 text-brand-ink-soft">
              {t('selection.empty')}
            </p>
          ) : visible.length === 0 ? (
            <p className="rounded-[24px] bg-brand-white p-6 text-brand-ink-soft">
              {t('selection.noMatchingPurposes')}
            </p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2">
              {visible.map((purpose) => {
                const Icon =
                  (purpose.category && categoryIcons[purpose.category.slug]) ??
                  Heart
                const image = donationImage(purpose.slug)
                const quantity = basketQuantity(basket, purpose.slug)
                return (
                  <li key={purpose.id}>
                    <PurposeCard
                      image={
                        image && (
                          <ImagePanel
                            image={image}
                            alt=""
                            sizes="(min-width: 1280px) 386px, (min-width: 1024px) 30vw, (min-width: 640px) 44vw, calc(100vw - 48px)"
                            className="[&>div]:rounded-none"
                            imageClassName="aspect-[7/6]"
                          />
                        )
                      }
                      icon={<Icon aria-hidden="true" className="size-7" />}
                      category={purpose.categoryLabel}
                      title={purpose.title}
                      description={purpose.description}
                      impact={purpose.impact}
                      project={purpose.project}
                      projectLabel={t('selection.projectLabel')}
                      generalPurposeLabel={t('selection.generalPurposeLabel')}
                      amount={formatDonationAmount(
                        purpose.unitAmountCents,
                        i18n.language,
                      )}
                      unit={purpose.unitLabel}
                      action={
                        <Button
                          type="button"
                          variant="sun"
                          shape="pill"
                          className="min-h-12"
                          aria-label={t('selection.addLabel', {
                            title: purpose.title,
                          })}
                          disabled={
                            !Number.isSafeInteger(
                              total + purpose.unitAmountCents,
                            )
                          }
                          onClick={() => {
                            setQuantity(
                              purpose.slug,
                              purpose.unitAmountCents,
                              quantity + 1,
                            )
                            setLastAdded({
                              title: purpose.title,
                              quantity: quantity + 1,
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
          )}
          {purposes.some((purpose) => purpose.isIllustrative) && (
            <p className="text-xs text-brand-ink-soft">
              {t('shared.illustrative')} {imageText('donationCaption')}
            </p>
          )}
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
