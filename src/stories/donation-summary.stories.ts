import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { DonationSummary } from '#/components/donation-summary'

const meta = {
  title: 'Components/DonationSummary',
  component: DonationSummary,
  parameters: { layout: 'padded' },
  args: {
    title: 'Your kindness, brought together.',
    eyebrow: 'Illustrative basket · Not a payment receipt',
    lines: [
      {
        id: 'koffa',
        title: 'Koffa groceries',
        detail: '2 × €35',
        amount: '€70',
      },
      {
        id: 'wheelchair',
        title: 'Wheelchair support',
        detail: '1 × €30',
        amount: '€30',
      },
    ],
    totalLabel: 'Illustrative total',
    total: '€100',
    emptyMessage: 'Choose a purpose to get started.',
    note: 'Example amounts only. No payment is processed.',
  },
} satisfies Meta<typeof DonationSummary>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Lagoon: Story = { args: { tone: 'lagoon' } }
export const White: Story = { args: { tone: 'white' } }
export const Empty: Story = { args: { lines: [], total: '€0' } }
