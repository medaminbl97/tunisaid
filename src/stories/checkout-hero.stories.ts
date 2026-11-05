import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { CheckoutHero } from '#/pages/donation-checkout/components/checkout-hero'

const meta = {
  title: 'Pages/DonationCheckout/CheckoutHero',
  component: CheckoutHero,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof CheckoutHero>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
