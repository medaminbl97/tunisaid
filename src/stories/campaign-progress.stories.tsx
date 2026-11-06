import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { CampaignProgress } from '#/components/campaign-progress'
import { formatDonationAmount } from '#/lib/donation'

const meta = {
  title: 'Components/CampaignProgress',
  component: CampaignProgress,
  parameters: { layout: 'padded' },
  args: {
    raisedCents: 412500,
    goalCents: 650000,
    label: 'Raised so far',
    formatAmount: (cents) => formatDonationAmount(cents, 'en'),
    progressLabel: (percent) => `${percent}% of the goal`,
  },
} satisfies Meta<typeof CampaignProgress>
export default meta
type Story = StoryObj<typeof meta>

export const InProgress: Story = {}
export const NotStarted: Story = { args: { raisedCents: 0 } }
export const JustStarted: Story = { args: { raisedCents: 3000 } }
export const GoalExceeded: Story = { args: { raisedCents: 700000 } }
