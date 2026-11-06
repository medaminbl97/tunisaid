import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { withDonationPurposes } from './donation-purposes.fixtures'
import { CheckoutReview } from '#/pages/donation-checkout/components/checkout-review'

const meta = {
  title: 'Pages/DonationCheckout/CheckoutReview',
  component: CheckoutReview,
  parameters: { layout: 'padded' },
  decorators: [withDonationPurposes()],
} satisfies Meta<typeof CheckoutReview>
export default meta
type Story = StoryObj<typeof meta>
export const EmptyBasket: Story = {}
