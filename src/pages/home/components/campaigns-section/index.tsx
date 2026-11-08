import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import arrowRight from '#/assets/images/project-arrow-right.svg'
import { activeCampaignsQueryOptions } from '#/api/collections/campaigns/queries'
import { campaignLanguageSchema } from '#/api/collections/campaigns/schemas'
import { CampaignProgress } from '#/components/campaign-progress'
import { FactList } from '#/components/fact-list'
import { GlassCard } from '#/components/glass-card'
import { SectionHeading } from '#/components/section-heading'
import { Button } from '#/components/ui/button'
import { useCampaignRaised } from '#/hooks/use-campaign-raised'
import { formatContentDate } from '#/lib/dates'
import { formatDonationAmount } from '#/lib/donation'

const HOME_CAMPAIGN_LIMIT = 3

export function CampaignsSection() {
  const { t, i18n } = useTranslation('common', {
    keyPrefix: 'home.campaigns',
  })
  const language = campaignLanguageSchema
    .catch('en')
    .parse(i18n.resolvedLanguage)
  const campaigns = useQuery(
    activeCampaignsQueryOptions({ language, limit: HOME_CAMPAIGN_LIMIT }),
  )
  const raised = useCampaignRaised(
    campaigns.data?.map((campaign) => campaign.slug) ?? [],
  )

  return (
    <section
      id="campaigns"
      aria-labelledby="home-campaigns-heading"
      aria-busy={campaigns.isPending}
      className="scroll-mt-(--brand-scroll-offset) bg-brand-cream px-6 pt-16 pb-4 sm:px-10 lg:pt-24"
    >
      <div className="mx-auto flex max-w-[75rem] flex-col gap-12">
        <SectionHeading
          id="home-campaigns-heading"
          align="left"
          eyebrow={t('eyebrow')}
          title={t('title')}
          size="compact"
          className="max-w-[40rem]"
        />
        {campaigns.isPending ? (
          <div role="status">
            <span className="sr-only">{t('loading')}</span>
            <ul aria-hidden className="grid gap-6 md:grid-cols-2">
              {[0, 1].map((key) => (
                <li
                  key={key}
                  className="h-72 animate-pulse rounded-[28px] bg-brand-glass-chip"
                />
              ))}
            </ul>
          </div>
        ) : campaigns.isError ? (
          <p role="alert" className="text-base text-brand-ink-soft">
            {t('error')}
          </p>
        ) : campaigns.data.length === 0 ? (
          <p className="text-base text-brand-ink-soft">{t('empty')}</p>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2">
            {campaigns.data.map((campaign, index) => {
              const { title, summary } = campaign.translation
              const raisedEntry = raised.data?.[campaign.slug]
              const timing = campaign.ends_at
                ? t('until', {
                    date: formatContentDate(campaign.ends_at, language),
                  })
                : campaign.starts_at
                  ? t('starts', {
                      date: formatContentDate(campaign.starts_at, language),
                    })
                  : t('openEnded')
              return (
                <li key={campaign.id} className="min-w-0">
                  <GlassCard
                    variant="solid"
                    delay={index * 0.1}
                    className="flex h-full flex-col items-start gap-5 p-7 sm:p-9"
                  >
                    <span className="rounded-full bg-brand-sun-soft px-3.5 py-[7px] text-[13px] leading-none font-bold text-brand-lagoon-deep">
                      {t('tag')}
                    </span>
                    <div className="flex flex-col gap-3">
                      <h3 className="font-display text-[28px] leading-[1.2] font-bold text-brand-ink">
                        {title}
                      </h3>
                      {summary && (
                        <p className="text-base leading-normal text-brand-ink-soft">
                          {summary}
                        </p>
                      )}
                    </div>
                    <FactList
                      items={[
                        {
                          label: t('goal'),
                          value: formatDonationAmount(
                            campaign.goal_cents,
                            language,
                          ),
                        },
                        { label: t('period'), value: timing },
                      ]}
                    />
                    {raisedEntry && (
                      <CampaignProgress
                        raisedCents={raisedEntry.raisedCents}
                        goalCents={campaign.goal_cents}
                        label={t('raised')}
                        formatAmount={(cents) =>
                          formatDonationAmount(cents, language)
                        }
                        progressLabel={(percent) => t('progress', { percent })}
                      />
                    )}
                    <Button
                      asChild
                      variant="link"
                      className="mt-auto h-auto p-0 text-[15px] leading-none font-bold text-brand-lagoon-deep"
                    >
                      <Link
                        to="/campaigns/$slug"
                        params={{ slug: campaign.slug }}
                        aria-label={t('viewLabel', { title })}
                      >
                        {t('view')}
                        <img src={arrowRight} alt="" width={18} height={18} />
                      </Link>
                    </Button>
                  </GlassCard>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
