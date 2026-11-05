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
