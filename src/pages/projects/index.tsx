import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import arrowRight from '#/assets/images/project-arrow-right.svg'
import { campaignsForProjectsQueryOptions } from '#/api/collections/campaigns/queries'
import { projectsQueryOptions } from '#/api/collections/projects/queries'
import { projectLanguageSchema } from '#/api/collections/projects/schemas'
import { ProjectCard } from '#/components/project-card'
import { RelationshipBadge } from '#/components/relationship-badge'
import { Button } from '#/components/ui/button'
import { Label } from '#/components/ui/label'
import { SectionHeading } from '#/components/section-heading'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'

const mainOffset =
  '-mt-[calc(var(--brand-header-height)+var(--brand-header-offset)+1rem)]'

export function ProjectsPage() {
  const { t, i18n } = useTranslation('common')
  const language = projectLanguageSchema
    .catch('en')
    .parse(i18n.resolvedLanguage)
  const projects = useQuery(projectsQueryOptions({ language, limit: 100 }))
  const projectSlugs = projects.data?.map((project) => project.slug) ?? []
  const campaigns = useQuery(
    campaignsForProjectsQueryOptions(projectSlugs, language),
  )
  const [selectedCampaignSlug, setSelectedCampaignSlug] = useState('')
  const selectedCampaign = campaigns.data?.find(
    (campaign) => campaign.slug === selectedCampaignSlug,
  )
  const visibleProjects = (projects.data ?? []).filter(
    (project) =>
      !selectedCampaign ||
      selectedCampaign.projects.some((item) => item.slug === project.slug),
  )
  const campaignsLoading =
    projects.isSuccess && projects.data.length > 0 && campaigns.isPending

  return (
    <main className={mainOffset}>
      <section
        aria-labelledby="projects-heading"
        aria-busy={projects.isPending || campaignsLoading}
        className="bg-brand-flow-sunrise px-6 pt-[calc(var(--brand-header-height)+var(--brand-header-offset)+3.375rem)] pb-16 sm:px-10 lg:pb-24"
      >
        <div className="mx-auto flex max-w-[75rem] flex-col gap-10">
          <SectionHeading
            id="projects-heading"
            as="h1"
            align="left"
            eyebrow={t('home.projects.eyebrow')}
            title={t('home.projects.title')}
            description={t('home.projects.directoryDescription')}
            size="compact"
            className="max-w-[40rem] [&>h1]:text-[clamp(2.5rem,3.34vw,3rem)] [&>h1]:leading-[1.14]"
          />

          <div className="flex justify-end">
            <div className="w-full max-w-[26.25rem] space-y-3">
              <Label
                htmlFor="projects-campaign-filter"
                className="font-bold text-brand-ink"
              >
                {t('home.projects.filterLabel')}
              </Label>
              <Select
                value={selectedCampaignSlug || 'all'}
                disabled={!campaigns.isSuccess}
                onValueChange={(value) =>
                  setSelectedCampaignSlug(value === 'all' ? '' : value)
                }
              >
                <SelectTrigger
                  id="projects-campaign-filter"
                  className="h-14 w-full rounded-[14px] border-brand-line bg-brand-white px-[18px] text-base text-brand-ink shadow-none md:text-[15px]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  align="start"
                  className="rounded-2xl border-brand-line bg-brand-white"
                >
                  <SelectItem value="all">
                    {t('home.projects.allProjects')}
                  </SelectItem>
                  {campaigns.data?.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.slug}>
                      {campaign.translation.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {campaignsLoading && (
            <p role="status" className="text-sm text-brand-ink-soft">
              {t('home.projects.campaignsLoading')}
            </p>
          )}

          {projects.isPending ? (
            <div role="status">
              <span className="sr-only">{t('home.projects.loading')}</span>
              <ul aria-hidden className="grid gap-6 md:grid-cols-2">
                {[0, 1].map((item) => (
                  <li
                    key={item}
                    className="h-[28rem] animate-pulse rounded-[32px] bg-brand-glass-chip"
                  />
                ))}
              </ul>
            </div>
          ) : projects.isError ? (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-brand-white p-5"
            >
              <p className="text-sm text-brand-ink-soft">
                {t('home.projects.error')}
              </p>
              <Button
                type="button"
                variant="brandOutline"
                shape="pill"
                onClick={() => void projects.refetch()}
              >
                {t('home.projects.campaignsRetry')}
              </Button>
            </div>
          ) : visibleProjects.length === 0 ? (
            <p className="text-base text-brand-ink-soft">
              {selectedCampaign
                ? t('home.projects.filteredEmpty')
                : t('home.projects.empty')}
            </p>
          ) : (
            <ul className="grid gap-6 md:grid-cols-2">
              {visibleProjects.map((project, index) => {
                const linkedCampaigns = campaigns.data?.filter((campaign) =>
                  campaign.projects.some((item) => item.slug === project.slug),
                )
                const { title, summary } = project.translation

                return (
                  <li key={project.id} className="min-w-0">
                    <ProjectCard
                      title={title}
                      description={summary ?? ''}
                      tag={t('home.projects.tag')}
                      cover={index % 2 === 0 ? 'lagoon' : 'terracotta'}
                      delay={(index % 2) * 0.1}
                      relationships={
                        linkedCampaigns && linkedCampaigns.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-brand-ink-soft">
                              {t('home.projects.campaignsLabel')}
                            </p>
                            <ul className="flex flex-wrap gap-2">
                              {linkedCampaigns.map((campaign) => (
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
                        ) : null
                      }
                      action={
                        <Button
                          asChild
                          variant="link"
                          className="h-auto p-0 text-[15px] leading-none font-bold text-brand-lagoon-deep"
                        >
                          <Link
                            to="/projects/$slug"
                            params={{ slug: project.slug }}
                            aria-label={t('home.projects.readMoreLabel', {
                              title,
                            })}
                          >
                            {t('home.projects.readMore')}
                            <img
                              src={arrowRight}
                              alt=""
                              width={18}
                              height={18}
                            />
                          </Link>
                        </Button>
                      }
                    />
                  </li>
                )
              })}
            </ul>
          )}

          {projects.isSuccess &&
            projects.data.length > 0 &&
            campaigns.isError && (
              <div
                role="alert"
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-brand-white p-5"
              >
                <p className="text-sm text-brand-ink-soft">
                  {t('home.projects.campaignsError')}
                </p>
                <Button
                  type="button"
                  variant="brandOutline"
                  shape="pill"
                  onClick={() => void campaigns.refetch()}
                >
                  {t('home.projects.campaignsRetry')}
                </Button>
              </div>
            )}
        </div>
      </section>
    </main>
  )
}
