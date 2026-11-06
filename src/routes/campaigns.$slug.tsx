import { createFileRoute } from '@tanstack/react-router'
import { CampaignDetailPage } from '#/pages/campaign-detail'

export const Route = createFileRoute('/campaigns/$slug')({
  component: CampaignDetailRoute,
})

function CampaignDetailRoute() {
  const { slug } = Route.useParams()
  return <CampaignDetailPage slug={slug} />
}
