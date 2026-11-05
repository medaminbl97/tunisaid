import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { DonationProvider } from '#/components/donation-provider'
import { FlexibleGift } from '#/pages/donate/components/flexible-gift'

const meta = {
  title: 'Pages/Donate/FlexibleGift',
  component: FlexibleGift,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <DonationProvider>
        <Story />
      </DonationProvider>
    ),
  ],
} satisfies Meta<typeof FlexibleGift>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
