import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { withDonationPurposes } from './donation-purposes.fixtures'
import { donationKeys } from '#/api/collections/donations/queries'
import { CheckoutForm } from '#/pages/donation-checkout/components/checkout-form'

const withAvailability = (enabled: boolean) =>
  withDonationPurposes(undefined, {
    seed: (client) =>
      client.setQueryData(
        donationKeys.availability(),
        enabled
          ? { enabled: true, provider: 'mock' }
          : { enabled: false, provider: null },
      ),
  })

const meta = {
  title: 'Pages/DonationCheckout/CheckoutForm',
  component: CheckoutForm,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof CheckoutForm>
export default meta
type Story = StoryObj<typeof meta>
export const TestMode: Story = { decorators: [withAvailability(true)] }
export const Unavailable: Story = { decorators: [withAvailability(false)] }
