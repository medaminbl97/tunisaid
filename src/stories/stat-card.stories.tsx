import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { StatCard } from '#/components/stat-card'

const meta = {
  title: 'Components/StatCard',
  component: StatCard,
  parameters: { layout: 'padded' },
  args: {
    label: 'Founded in Munich',
    value: '2016',
  },
  decorators: [
    (Story) => (
      <div className="rounded-[48px] bg-brand-impact p-8">
        <dl className="max-w-[300px]">
          <Story />
        </dl>
      </div>
    ),
  ],
} satisfies Meta<typeof StatCard>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const PartnerCount: Story = {
  args: { label: 'Partner associations', value: '3' },
}
