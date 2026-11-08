import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { GratitudeHero } from '#/pages/donation-thank-you/components/gratitude-hero'

const meta = {
  title: 'Pages/DonationThankYou/GratitudeHero',
  component: GratitudeHero,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof GratitudeHero>
export default meta
type Story = StoryObj<typeof meta>
export const NoPaymentConfirmation: Story = {}
export const Paid: Story = { args: { status: 'paid', testMode: true } }
export const Pending: Story = { args: { status: 'pending', testMode: true } }
export const Failed: Story = { args: { status: 'failed', testMode: true } }
export const Cancelled: Story = { args: { status: 'cancelled' } }
