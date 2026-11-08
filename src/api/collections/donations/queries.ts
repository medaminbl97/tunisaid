import { queryOptions } from '@tanstack/react-query'
import {
  getCampaignRaised,
  getDonationAvailability,
  getDonationReceipt,
  getMockPayment,
} from './functions'
import type { DonationStatus } from './schemas'

export const donationKeys = {
  all: ['donations'] as const,
  availability: () => [...donationKeys.all, 'availability'] as const,
  receipt: (reference: string) =>
    [...donationKeys.all, 'receipt', reference] as const,
  mockPayment: (attempt: string) =>
    [...donationKeys.all, 'mock-payment', attempt] as const,
  campaignRaisedAll: () => [...donationKeys.all, 'campaign-raised'] as const,
  campaignRaised: (slugs: string[]) =>
    [...donationKeys.campaignRaisedAll(), [...slugs].sort().join(',')] as const,
}

export const donationAvailabilityQueryOptions = () =>
  queryOptions({
    queryKey: donationKeys.availability(),
    queryFn: () => getDonationAvailability(),
    staleTime: 5 * 60_000,
  })

const settledStatuses: DonationStatus[] = [
  'paid',
  'failed',
  'cancelled',
  'expired',
  'partially_refunded',
  'refunded',
]

export const donationReceiptQueryOptions = (reference: string, token: string) =>
  queryOptions({
    queryKey: donationKeys.receipt(reference),
    queryFn: () => getDonationReceipt({ data: { reference, token } }),
    refetchInterval: (query) => {
      const data = query.state.data
      if (data === null) return false
      return data && settledStatuses.includes(data.status) ? false : 3_000
    },
  })

export const mockPaymentQueryOptions = (attempt: string, token: string) =>
  queryOptions({
    queryKey: donationKeys.mockPayment(attempt),
    queryFn: () => getMockPayment({ data: { attempt, token } }),
  })

export const campaignRaisedQueryOptions = (slugs: string[]) =>
  queryOptions({
    queryKey: donationKeys.campaignRaised(slugs),
    queryFn: () => getCampaignRaised({ data: { slugs } }),
    enabled: slugs.length > 0,
    staleTime: 60_000,
  })
