import { useQuery } from '@tanstack/react-query'
import { campaignRaisedQueryOptions } from '#/api/collections/donations/queries'

export function useCampaignRaised(slugs: string[]) {
  return useQuery(campaignRaisedQueryOptions(slugs))
}
