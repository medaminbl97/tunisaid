import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { DonationProvider } from '#/components/donation-provider'
import { GiftRecap } from '#/pages/donation-thank-you/components/gift-recap'

const meta = {
  title: 'Pages/DonationThankYou/GiftRecap',
  component: GiftRecap,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <DonationProvider>
        <Story />
      </DonationProvider>
    ),
  ],
} satisfies Meta<typeof GiftRecap>
export default meta
type Story = StoryObj<typeof meta>
export const NoPaymentRecord: Story = {}
