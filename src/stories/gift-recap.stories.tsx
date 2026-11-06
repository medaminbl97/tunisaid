import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { withDonationPurposes } from './donation-purposes.fixtures'
import { GiftRecap } from '#/pages/donation-thank-you/components/gift-recap'

const meta = {
  title: 'Pages/DonationThankYou/GiftRecap',
  component: GiftRecap,
  parameters: { layout: 'padded' },
  decorators: [withDonationPurposes()],
} satisfies Meta<typeof GiftRecap>
export default meta
type Story = StoryObj<typeof meta>
export const NoPaymentRecord: Story = {}
