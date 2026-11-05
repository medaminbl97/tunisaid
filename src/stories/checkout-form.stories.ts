import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { CheckoutForm } from '#/pages/donation-checkout/components/checkout-form'

const meta = {
  title: 'Pages/DonationCheckout/CheckoutForm',
  component: CheckoutForm,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof CheckoutForm>
export default meta
type Story = StoryObj<typeof meta>
export const Unavailable: Story = {}
