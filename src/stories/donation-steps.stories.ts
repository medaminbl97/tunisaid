import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { DonationSteps } from '#/components/donation-steps'

const meta = {
  title: 'Components/DonationSteps',
  component: DonationSteps,
  parameters: { layout: 'padded' },
  args: {
    label: 'Donation steps',
    steps: ['Choose your gifts', 'Details & payment', 'Thank you'],
    current: 1,
  },
} satisfies Meta<typeof DonationSteps>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Choosing: Story = { args: { current: 0 } }
