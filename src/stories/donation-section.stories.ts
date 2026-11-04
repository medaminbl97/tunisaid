import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { DonationSection } from '#/pages/home/components/donation-section'

const meta = {
  title: 'Pages/Home/DonationSection',
  component: DonationSection,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof DonationSection>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
