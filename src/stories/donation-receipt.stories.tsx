import type { Meta, StoryObj } from '@storybook/tanstack-react'
import type { DonationReceipt as DonationReceiptData } from '#/api/collections/donations/schemas'
import { DonationReceipt } from '#/pages/donation-thank-you/components/donation-receipt'

const paidReceipt: DonationReceiptData = {
  reference: 'TA-STORYBOOK234',
  status: 'paid',
  totalCents: 9500,
  currency: 'EUR',
  createdAt: '2026-05-04T09:12:00.000Z',
  paidAt: '2026-05-04T09:13:00.000Z',
  items: [
    {
      id: '00000000-0000-4000-8000-000000000401',
      kind: 'purpose',
      title: 'Koffa groceries',
      quantity: 2,
      unitCents: 3500,
      totalCents: 7000,
      campaign: {
        slug: 'ramadan-2027',
        titles: {
          en: 'Ramadan 2027 food boxes',
          de: 'Lebensmittelpakete Ramadan 2027',
        },
      },
    },
    {
      id: '00000000-0000-4000-8000-000000000402',
      kind: 'flexible',
      title: 'Flexible support',
      quantity: 1,
      unitCents: 2500,
      totalCents: 2500,
      campaign: null,
    },
  ],
}

const meta = {
  title: 'Pages/DonationThankYou/DonationReceipt',
  component: DonationReceipt,
  parameters: { layout: 'padded' },
  args: { receipt: paidReceipt },
} satisfies Meta<typeof DonationReceipt>
export default meta
type Story = StoryObj<typeof meta>

export const Paid: Story = {}
export const Pending: Story = {
  args: { receipt: { ...paidReceipt, status: 'pending', paidAt: null } },
}
export const Failed: Story = {
  args: {
    receipt: {
      ...paidReceipt,
      status: 'failed',
      paidAt: null,
    },
  },
}
