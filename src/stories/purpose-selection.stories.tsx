import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { DonationProvider } from '#/components/donation-provider'
import { PurposeSelection } from '#/pages/donate/components/purpose-selection'

const meta = {
  title: 'Pages/Donate/PurposeSelection',
  component: PurposeSelection,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <DonationProvider>
        <Story />
      </DonationProvider>
    ),
  ],
} satisfies Meta<typeof PurposeSelection>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
