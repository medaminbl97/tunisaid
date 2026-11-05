import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { GiftJourney } from '#/pages/donate/components/gift-journey'

const meta = {
  title: 'Pages/Donate/GiftJourney',
  component: GiftJourney,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof GiftJourney>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
