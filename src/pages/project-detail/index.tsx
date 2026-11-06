import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { campaignsForProjectQueryOptions } from '#/api/collections/campaigns/queries'
import { useDonationPurposes } from '#/hooks/use-donation-purposes'
import {
  ProjectNotFoundError,
  projectBySlugQueryOptions,
} from '#/api/collections/projects/queries'
import { projectLanguageSchema } from '#/api/collections/projects/schemas'
import { apiBaseUrl } from '#/api/runtime-config'
import { ArticleContent } from '#/components/article-content'
import { DetailHero } from '#/components/detail-hero'
import { DetailState } from '#/components/detail-state'
import { RelationshipBadge } from '#/components/relationship-badge'
import { Button } from '#/components/ui/button'
import { prepareRichText } from '#/lib/rich-text'

type ProjectDetailPageProps = {
  slug: string
}

const mainOffset =
  '-mt-[calc(var(--brand-header-height)+var(--brand-header-offset)+1rem)]'

export function ProjectDetailPage(props: ProjectDetailPageProps) {
  const { t, i18n } = useTranslation('common', { keyPrefix: 'projectDetail' })
  const language = projectLanguageSchema
    .catch('en')
    .parse(i18n.resolvedLanguage)
  const project = useQuery(projectBySlugQueryOptions(props.slug, language))
  const campaigns = useQuery(
    campaignsForProjectQueryOptions(props.slug, language),
  )
  const purposes = useDonationPurposes()
  const linkedPurposes =
    purposes.data?.filter((purpose) => purpose.project?.slug === props.slug) ??
    []
  const body = project.data?.translation.body

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
  const relationshipLabels = {
    label: t('relationships.label'),
    campaigns: t('relationships.campaigns'),
    purposes: t('relationships.purposes'),
    loading: t('relationships.loading'),
    error: t('relationships.error'),
    retry: t('relationships.retry'),
    donate: t('relationships.donate'),
  }
  const hasRelationships =
    (campaigns.data?.length ?? 0) > 0 || linkedPurposes.length > 0
  const showRelationships =
    campaigns.isPending ||
    purposes.isPending ||
    campaigns.isError ||
    purposes.isError ||
    hasRelationships

  if (project.isPending) {
    return (
      <main className={mainOffset}>
        <DetailState state="loading" labels={stateLabels} backTo="/projects" />
      </main>
    )
  }

  if (project.isError) {
    return (
      <main className={mainOffset}>
        {project.error instanceof ProjectNotFoundError ? (
          <DetailState
            state="not-found"
            labels={stateLabels}
            backTo="/projects"
          />
        ) : (
          <DetailState
            state="error"
            labels={stateLabels}
            backTo="/projects"
            onRetry={() => void project.refetch()}
          />
        )}
      </main>
    )
  }

  return (
    <main className={mainOffset}>
      <DetailHero
        titleId="project-title"
        eyebrow={t('eyebrow')}
        title={project.data.translation.title}
        summary={project.data.translation.summary}
        backLabel={t('back')}
        backTo="/projects"
      />
      <section className="bg-brand-cream px-6 py-16 sm:px-10 lg:py-24">
        <ArticleContent
          content={content}
          contentsLabel={t('contents')}
          emptyLabel={t('empty')}
        />
      </section>
      {showRelationships && (
        <section
          aria-label={relationshipLabels.label}
          aria-busy={campaigns.isPending || purposes.isPending}
          className="bg-brand-flow-sunrise px-6 py-12 sm:px-10 lg:py-16"
        >
          <div className="mx-auto max-w-[75rem] space-y-6">
            {(campaigns.isPending || purposes.isPending) && (
              <p role="status" className="text-sm text-brand-ink-soft">
                {relationshipLabels.loading}
              </p>
            )}
            {(campaigns.isError || purposes.isError) && (
              <div
                role="alert"
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-brand-white p-5"
              >
                <p className="text-sm text-brand-ink-soft">
                  {relationshipLabels.error}
                </p>
                <Button
                  type="button"
                  variant="brandOutline"
                  shape="pill"
                  onClick={() =>
                    void Promise.all([campaigns.refetch(), purposes.refetch()])
                  }
                >
                  {relationshipLabels.retry}
                </Button>
              </div>
            )}
            <div className="grid gap-8 sm:grid-cols-2">
              {campaigns.data && campaigns.data.length > 0 && (
                <div className="space-y-3">
                  <h2 className="font-display text-xl font-bold text-brand-ink">
                    {relationshipLabels.campaigns}
                  </h2>
                  <ul className="flex flex-wrap gap-2">
                    {campaigns.data.map((campaign) => (
                      <li key={campaign.id}>
                        <Link
                          to="/campaigns/$slug"
                          params={{ slug: campaign.slug }}
                          className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-lagoon-deep"
                        >
                          <RelationshipBadge>
                            {campaign.translation.title}
                          </RelationshipBadge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {linkedPurposes.length > 0 && (
                <div className="space-y-3">
                  <h2 className="font-display text-xl font-bold text-brand-ink">
                    {relationshipLabels.purposes}
                  </h2>
                  <ul className="flex flex-wrap gap-2">
                    {linkedPurposes.map((purpose) => (
                      <li key={purpose.id}>
                        <RelationshipBadge>{purpose.title}</RelationshipBadge>
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="sun" shape="pill">
                    <Link
                      to="/donate"
                      search={{ project: project.data.slug }}
                      hash="donation-purposes"
                    >
                      {relationshipLabels.donate}
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
