import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import arrowRight from '#/assets/images/project-arrow-right.svg'
import arrowInk from '#/assets/images/arrow-right-ink.svg'
import { ProjectCard } from '#/components/project-card'
import { SectionHeading } from '#/components/section-heading'
import { Button } from '#/components/ui/button'

const projects = [
  { key: 'education', cover: 'lagoon' },
  { key: 'fundraiser', cover: 'terracotta' },
] as const

export function ProjectsSection() {
  const { t } = useTranslation('common', { keyPrefix: 'home.projects' })

  return (
    <section
      aria-labelledby="home-projects-heading"
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
            <Link to="/what-we-do">
              {t('allProjects')}
              <img src={arrowInk} alt="" width={18} height={18} />
            </Link>
          </Button>
        </div>
        <ul className="grid gap-6 md:grid-cols-2">
          {projects.map((project, index) => (
            <li key={project.key} className="min-w-0">
              <ProjectCard
                title={t(`items.${project.key}.title`)}
                description={t(`items.${project.key}.description`)}
                tag={t(`items.${project.key}.tag`)}
                cover={project.cover}
                delay={index * 0.1}
                action={
                  <Button
                    asChild
                    variant="link"
                    className="h-auto p-0 text-[15px] leading-none font-bold text-brand-lagoon-deep"
                  >
                    <Link
                      to="/what-we-do"
                      aria-label={t('readMoreLabel', {
                        title: t(`items.${project.key}.title`),
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
