import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import arrowRight from '#/assets/images/project-arrow-right.svg'
import arrowInk from '#/assets/images/arrow-right-ink.svg'
import { campaignsForProjectsQueryOptions } from '#/api/collections/campaigns/queries'
import { projectsQueryOptions } from '#/api/collections/projects/queries'
import { projectLanguageSchema } from '#/api/collections/projects/schemas'
import { ProjectCard } from '#/components/project-card'
import { RelationshipBadge } from '#/components/relationship-badge'
import { SectionHeading } from '#/components/section-heading'
import { Button } from '#/components/ui/button'
import { ImagePanel } from '#/components/image-panel'
import { editorialImages } from '#/lib/site-images'

const HOME_PROJECT_LIMIT = 2

// Directus assets are not public yet, so covers rotate through local imagery.
const fallbackCovers = [
  { image: editorialImages.learning, alt: 'learning', cover: 'lagoon' },
  {
    image: editorialImages.collaboration,
    alt: 'collaboration',
    cover: 'terracotta',
  },
] as const

export function ProjectsSection() {
  const { t, i18n } = useTranslation('common', {
    keyPrefix: 'home.projects',
  })
  const { t: imageText } = useTranslation('common', { keyPrefix: 'imagery' })
  const language = projectLanguageSchema
    .catch('en')
    .parse(i18n.resolvedLanguage)
  const projects = useQuery(
    projectsQueryOptions({ language, limit: HOME_PROJECT_LIMIT }),
  )
  const projectSlugs = projects.data?.map((project) => project.slug) ?? []
  const campaigns = useQuery(
    campaignsForProjectsQueryOptions(projectSlugs, language),
  )

  return (
    <section
      aria-labelledby="home-projects-heading"
      aria-busy={projects.isPending}
      className="bg-brand-flow-sunrise px-6 pt-16 pb-16 sm:px-10 lg:pt-28 lg:pb-24"
    >
      <div className="mx-auto flex max-w-[75rem] flex-col gap-14">
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            id="home-projects-heading"
            align="left"
            eyebrow={t('eyebrow')}
            title={t('title')}
            size="compact"
            className="max-w-[40rem]"
          />
          <Button asChild variant="brandOutline" shape="pill" size="cta">
            <Link to="/projects">
              {t('allProjects')}
              <img src={arrowInk} alt="" width={18} height={18} />
            </Link>
          </Button>
        </div>
        {projects.isPending ? (
          <div role="status">
            <span className="sr-only">{t('loading')}</span>
            <ul aria-hidden className="grid gap-6 md:grid-cols-2">
              {fallbackCovers.map((cover) => (
                <li
                  key={cover.alt}
                  className="h-[28rem] animate-pulse rounded-[32px] bg-brand-glass-chip"
                />
              ))}
            </ul>
          </div>
        ) : projects.isError ? (
          <p role="alert" className="text-base text-brand-ink-soft">
            {t('error')}
          </p>
        ) : projects.data.length === 0 ? (
          <p className="text-base text-brand-ink-soft">{t('empty')}</p>
        ) : (
          <>
            <ul className="grid gap-6 md:grid-cols-2">
              {projects.data.map((project, index) => {
                const fallback = fallbackCovers[index % fallbackCovers.length]
                const { title, summary } = project.translation
                const linkedCampaigns = campaigns.data?.filter((campaign) =>
                  campaign.projects.some((item) => item.slug === project.slug),
                )
                return (
                  <li key={project.id} className="min-w-0">
                    <ProjectCard
                      title={title}
                      description={summary ?? ''}
                      tag={t('tag')}
                      cover={fallback.cover}
                      delay={index * 0.1}
                      relationships={
                        linkedCampaigns && linkedCampaigns.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-brand-ink-soft">
                              {t('campaignsLabel')}
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
                      coverImage={
                        <ImagePanel
                          image={fallback.image}
                          alt={imageText(fallback.alt)}
                          sizes="(min-width: 1280px) 588px, (min-width: 768px) 46vw, calc(100vw - 48px)"
                          className="h-full [&>div]:h-full [&>div]:rounded-none"
                          imageClassName="h-full object-center"
                        />
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
                            aria-label={t('readMoreLabel', { title })}
                          >
                            {t('readMore')}
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
            {campaigns.isError && (
              <div
                role="alert"
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-brand-white p-5"
              >
                <p className="text-sm text-brand-ink-soft">
                  {t('campaignsError')}
                </p>
                <Button
                  type="button"
                  variant="brandOutline"
                  shape="pill"
                  onClick={() => void campaigns.refetch()}
                >
                  {t('campaignsRetry')}
                </Button>
              </div>
            )}
            <p className="-mt-8 text-xs leading-relaxed text-brand-ink-soft">
              {imageText('caption')}
            </p>
          </>
        )}
      </div>
    </section>
  )
}
