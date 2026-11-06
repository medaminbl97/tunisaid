import type { Decorator } from '@storybook/tanstack-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DonationProvider } from '#/components/donation-provider'
import { donationPurposeKeys } from '#/api/collections/donation-purposes/queries'
import type { LocalizedDonationPurpose } from '#/api/collections/donation-purposes/queries'

const essentials = { slug: 'essentials', title: 'Essentials', sort: 1 }

export const samplePurposes: LocalizedDonationPurpose[] = [
  {
    id: '00000000-0000-4000-8000-000000000201',
    slug: 'koffa',
    unitAmountCents: 3500,
    currency: 'EUR',
    isIllustrative: true,
    category: essentials,
    project: {
      slug: 'ramadan-food-boxes',
      title: 'Ramadan food boxes',
    },
    title: 'Give a Koffa',
    categoryLabel: 'Food & dignity',
    description: 'A bag of everyday groceries, chosen for a family in Tunisia.',
    impact: 'One family. Essential groceries.',
    unitLabel: 'per Koffa',
    basketTitle: 'Koffa groceries',
    imageAlt: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000202',
    slug: 'wheelchair',
    unitAmountCents: 3000,
    currency: 'EUR',
    isIllustrative: true,
    category: { slug: 'mobility', title: 'Mobility', sort: 2 },
    project: {
      slug: 'wheelchairs-for-students',
      title: 'Wheelchairs for students',
    },
    title: 'Share a wheelchair',
    categoryLabel: 'Mobility & independence',
    description:
      'Help fund an illustrative €180 wheelchair, one share at a time. Six shares make a whole chair.',
    impact: 'A step toward everyday freedom.',
    unitLabel: 'per wheelchair share',
    basketTitle: 'Wheelchair support',
    imageAlt: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000203',
    slug: 'school',
    unitAmountCents: 2500,
    currency: 'EUR',
    isIllustrative: true,
    category: { slug: 'education', title: 'Education', sort: 3 },
    project: {
      slug: 'school-supplies-support',
      title: 'School supplies support',
    },
    title: 'Pack a school bag',
    categoryLabel: 'Learning & possibility',
    description:
      'Help a child start school with a bag, notebooks and essential supplies.',
    impact: 'The tools for a brighter start.',
    unitLabel: 'per school kit',
    basketTitle: 'School supplies',
    imageAlt: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000204',
    slug: 'warmth',
    unitAmountCents: 4500,
    currency: 'EUR',
    isIllustrative: true,
    category: essentials,
    project: null,
    title: 'Bring a little warmth',
    categoryLabel: 'Care & comfort',
    description:
      'Contribute to warm blankets and seasonal essentials for a household.',
    impact: 'Comfort when it is needed most.',
    unitLabel: 'per warmth kit',
    basketTitle: 'Warmth & comfort',
    imageAlt: null,
  },
]

type FixtureOptions = {
  seed?: (client: QueryClient) => void
}

export const withDonationPurposes =
  (
    data: LocalizedDonationPurpose[] | Error = samplePurposes,
    options: FixtureOptions = {},
  ): Decorator =>
  (Story) => {
    const client = new QueryClient({
      defaultOptions: {
        queries: { staleTime: Infinity, retry: false, retryOnMount: false },
      },
    })
    const queryKey = donationPurposeKeys.list('en')
    if (data instanceof Error) {
      client.getQueryCache().build(client, { queryKey }).setState({
        status: 'error',
        error: data,
        errorUpdatedAt: Date.now(),
        fetchStatus: 'idle',
      })
    } else {
      client.setQueryData(queryKey, data)
    }
    options.seed?.(client)
    return (
      <QueryClientProvider client={client}>
        <DonationProvider>
          <Story />
        </DonationProvider>
      </QueryClientProvider>
    )
  }
