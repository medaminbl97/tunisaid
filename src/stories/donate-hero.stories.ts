import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { DonateHero } from '#/pages/donate/components/donate-hero'

const meta = {
  title: 'Pages/Donate/DonateHero',
  component: DonateHero,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof DonateHero>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
