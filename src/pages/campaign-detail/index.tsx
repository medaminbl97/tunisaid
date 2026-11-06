import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  CampaignNotFoundError,
  campaignBySlugQueryOptions,
} from '#/api/collections/campaigns/queries'
import type { LocalizedCampaign } from '#/api/collections/campaigns/queries'
import { campaignLanguageSchema } from '#/api/collections/campaigns/schemas'
import { apiBaseUrl } from '#/api/runtime-config'
import { ArticleContent } from '#/components/article-content'
import { CampaignProgress } from '#/components/campaign-progress'
import { DetailHero } from '#/components/detail-hero'
import { DetailState } from '#/components/detail-state'
import { FactList } from '#/components/fact-list'
import { Button } from '#/components/ui/button'
import { useCampaignRaised } from '#/hooks/use-campaign-raised'
import { formatContentDate, formatContentDateRange } from '#/lib/dates'
import { formatDonationAmount } from '#/lib/donation'
import { prepareRichText } from '#/lib/rich-text'
import { CampaignProjects } from './components/campaign-projects'

type CampaignDetailPageProps = {
  slug: string
}

const mainOffset =
  '-mt-[calc(var(--brand-header-height)+var(--brand-header-offset)+1rem)]'

function formatPeriod(
  campaign: LocalizedCampaign,
  language: string,
  openEnded: string,
) {
  if (campaign.starts_at && campaign.ends_at) {
    return formatContentDateRange(
      campaign.starts_at,
      campaign.ends_at,
      language,
    )
  }
  const date = campaign.ends_at ?? campaign.starts_at
  return date ? formatContentDate(date, language) : openEnded
}

export function CampaignDetailPage(props: CampaignDetailPageProps) {
  const { t, i18n } = useTranslation('common', {
    keyPrefix: 'campaignDetail',
  })
  const language = campaignLanguageSchema
    .catch('en')
    .parse(i18n.resolvedLanguage)
  const campaign = useQuery(campaignBySlugQueryOptions(props.slug, language))
  const raised = useCampaignRaised(campaign.data ? [campaign.data.slug] : [])
  const raisedEntry = campaign.data
    ? raised.data?.[campaign.data.slug]
    : undefined
  const body = campaign.data?.translation.body

  const content = useMemo(
    () =>
      body && typeof window !== 'undefined'
        ? prepareRichText(body, window, { assetBaseUrl: apiBaseUrl })
        : null,
    [body],
  )

  const stateLabels = {
    loading: t('loading'),
    notFoundTitle: t('notFound.title'),
    notFoundDescription: t('notFound.description'),
    errorTitle: t('error.title'),
    errorDescription: t('error.description'),
    retry: t('error.retry'),
    back: t('back'),
  }

  if (campaign.isPending) {
    return (
      <main className={mainOffset}>
        <DetailState
          state="loading"
          labels={stateLabels}
          backTo="/"
          backHash="campaigns"
        />
      </main>
    )
  }

  if (campaign.isError) {
    return (
      <main className={mainOffset}>
        {campaign.error instanceof CampaignNotFoundError ? (
          <DetailState
            state="not-found"
            labels={stateLabels}
            backTo="/"
            backHash="campaigns"
          />
        ) : (
          <DetailState
            state="error"
            labels={stateLabels}
            backTo="/"
            backHash="campaigns"
            onRetry={() => void campaign.refetch()}
          />
        )}
      </main>
    )
  }

  const facts = [
    {
      label: t('facts.goal'),
      value: formatDonationAmount(campaign.data.goal_cents, language),
    },
    {
      label: t('facts.period'),
      value: formatPeriod(campaign.data, language, t('facts.openEnded')),
    },
    ...(campaign.data.projects.length
      ? [{ label: t('facts.projects'), value: campaign.data.projects.length }]
      : []),
  ]

  return (
    <main className={mainOffset}>
      <DetailHero
        titleId="campaign-title"
        eyebrow={t('eyebrow')}
        title={campaign.data.translation.title}
        summary={campaign.data.translation.summary}
        backLabel={t('back')}
        backTo="/"
        backHash="campaigns"
      >
        <div className="flex w-full flex-col gap-6">
          <div className="flex w-full flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <FactList items={facts} />
            <Button asChild shape="pill" size="cta">
              <Link to="/donate" search={{ campaign: campaign.data.slug }}>
                {t('donate')}
              </Link>
            </Button>
          </div>
          {raisedEntry && (
            <CampaignProgress
              raisedCents={raisedEntry.raisedCents}
              goalCents={campaign.data.goal_cents}
              label={t('facts.raised')}
              formatAmount={(cents) => formatDonationAmount(cents, language)}
              progressLabel={(percent) => t('facts.progress', { percent })}
              className="max-w-[36rem]"
            />
          )}
        </div>
      </DetailHero>
      <section className="bg-brand-cream px-6 py-16 sm:px-10 lg:py-24">
        <ArticleContent
          content={content}
          contentsLabel={t('contents')}
          emptyLabel={t('empty')}
        />
      </section>
      <CampaignProjects
        projects={campaign.data.projects}
        campaign={{
          slug: campaign.data.slug,
          title: campaign.data.translation.title,
        }}
      />
    </main>
  )
}
