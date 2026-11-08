import type { Decorator, Meta, StoryObj } from '@storybook/tanstack-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { sampleCampaigns } from './campaigns.fixtures'
import { campaignKeys } from '#/api/collections/campaigns/queries'
import type { LocalizedCampaign } from '#/api/collections/campaigns/queries'
import { donationKeys } from '#/api/collections/donations/queries'
import type { CampaignRaised } from '#/api/collections/donations/schemas'
import { CampaignsSection } from '#/pages/home/components/campaigns-section'

const withCampaigns =
  (data: LocalizedCampaign[], raised: CampaignRaised = {}): Decorator =>
  (Story) => {
    const client = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false } },
    })
    client.setQueryData(campaignKeys.active({ language: 'en', limit: 3 }), data)
    client.setQueryData(
      donationKeys.campaignRaised(data.map((campaign) => campaign.slug)),
      raised,
    )
    return (
      <QueryClientProvider client={client}>
        <Story />
      </QueryClientProvider>
    )
  }

const meta = {
  title: 'Pages/Home/CampaignsSection',
  component: CampaignsSection,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof CampaignsSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { decorators: [withCampaigns(sampleCampaigns)] }
export const WithRaisedAmounts: Story = {
  decorators: [
    withCampaigns(sampleCampaigns, {
      'inclusive-school-year-2027': { raisedCents: 412500, donationCount: 38 },
      'ramadan-2027': { raisedCents: 61000, donationCount: 9 },
    }),
  ],
}
export const Empty: Story = { decorators: [withCampaigns([])] }
