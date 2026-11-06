import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { withDonationPurposes } from './donation-purposes.fixtures'
import { donationKeys } from '#/api/collections/donations/queries'
import type { MockPaymentDetails } from '#/api/collections/donations/schemas'
import { MockPaymentPanel } from '#/pages/donation-mock-payment/components/mock-payment-panel'

const attempt = '00000000-0000-4000-8000-000000000301'

const withPayment = (details: MockPaymentDetails | null) =>
  withDonationPurposes(undefined, {
    seed: (client) =>
      client.setQueryData(donationKeys.mockPayment(attempt), details),
  })

const meta = {
  title: 'Pages/DonationMockPayment/MockPaymentPanel',
  component: MockPaymentPanel,
  parameters: { layout: 'padded' },
  args: { attempt, token: 'storybook-token' },
} satisfies Meta<typeof MockPaymentPanel>
export default meta
type Story = StoryObj<typeof meta>

export const Pending: Story = {
  decorators: [
    withPayment({
      reference: 'TA-STORYBOOK234',
      amountCents: 6500,
      currency: 'EUR',
      status: 'pending',
    }),
  ],
}
export const AlreadyCompleted: Story = {
  decorators: [
    withPayment({
      reference: 'TA-STORYBOOK234',
      amountCents: 6500,
      currency: 'EUR',
      status: 'succeeded',
    }),
  ],
}
export const NotFound: Story = { decorators: [withPayment(null)] }
