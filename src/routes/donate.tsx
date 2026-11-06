import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { campaignSlugSchema } from '#/api/collections/campaigns/queries'
import { projectSlugSchema } from '#/api/collections/projects/queries'
import { DonatePage } from '#/pages/donate'

const searchSchema = z.object({
  campaign: campaignSlugSchema.optional().catch(undefined),
  project: projectSlugSchema.optional().catch(undefined),
  purpose: z.literal('general').optional().catch(undefined),
})

export const Route = createFileRoute('/donate')({
  validateSearch: searchSchema,
  component: DonateRoute,
})

function DonateRoute() {
  const search = Route.useSearch()
  return (
    <DonatePage
      campaignSlug={search.campaign}
      projectSlug={search.project}
      generalPurpose={search.purpose === 'general'}
    />
  )
}
