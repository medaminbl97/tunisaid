import { createFileRoute } from '@tanstack/react-router'
import { ProjectDetailPage } from '#/pages/project-detail'

export const Route = createFileRoute('/projects/$slug')({
  component: ProjectDetailRoute,
})

function ProjectDetailRoute() {
  const { slug } = Route.useParams()
  return <ProjectDetailPage slug={slug} />
}
