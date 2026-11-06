import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import arrowRight from '#/assets/images/project-arrow-right.svg'
import { RelationshipBadge } from '#/components/relationship-badge'
import { ProjectCard } from '#/components/project-card'
import { SectionHeading } from '#/components/section-heading'
import { Button } from '#/components/ui/button'

type CampaignProject = {
  id: string
  slug: string
  title: string
  summary: string | null
}

type CampaignProjectsProps = {
  projects: CampaignProject[]
  campaign: { slug: string; title: string }
}

export function CampaignProjects(props: CampaignProjectsProps) {
  const { t } = useTranslation('common', {
    keyPrefix: 'campaignDetail.projects',
  })
  if (props.projects.length === 0) return null

  return (
    <section
      aria-labelledby="campaign-projects-heading"
      className="bg-brand-flow-sunrise px-6 py-16 sm:px-10 lg:py-24"
    >
      <div className="mx-auto flex max-w-[75rem] flex-col gap-12">
        <SectionHeading
          id="campaign-projects-heading"
          align="left"
          eyebrow={t('eyebrow')}
          title={t('title')}
          size="compact"
        />
        <ul className="grid gap-6 md:grid-cols-2">
          {props.projects.map((project, index) => (
            <li key={project.id} className="min-w-0">
              <ProjectCard
                title={project.title}
                description={project.summary ?? ''}
                tag={t('tag')}
                cover={index % 2 === 0 ? 'lagoon' : 'terracotta'}
                delay={index * 0.1}
                relationships={
                  <div>
                    <Link
                      to="/campaigns/$slug"
                      params={{ slug: props.campaign.slug }}
                      className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-lagoon-deep"
                    >
                      <RelationshipBadge>
                        {t('campaignLabel')}: {props.campaign.title}
                      </RelationshipBadge>
                    </Link>
                  </div>
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
                      aria-label={t('readMoreLabel', {
                        title: project.title,
                      })}
                    >
                      {t('readMore')}
                      <img src={arrowRight} alt="" width={18} height={18} />
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
