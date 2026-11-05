import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { DonationLayout } from '#/components/donation-layout'

const meta = {
  title: 'Components/DonationLayout',
  component: DonationLayout,
  parameters: { layout: 'fullscreen' },
  args: {
    children: (
      <main className="mx-auto max-w-[75rem] px-6 py-20">
        <h1 className="font-display text-4xl">Giving with purpose</h1>
      </main>
    ),
  },
} satisfies Meta<typeof DonationLayout>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
