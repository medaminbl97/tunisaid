import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { GlassCard } from '#/components/glass-card'

const meta = {
  title: 'Components/GlassCard',
  component: GlassCard,
  parameters: { layout: 'padded' },
  args: {
    children: 'Reusable glass content',
    className: 'max-w-sm p-7',
  },
  decorators: [
    (Story) => (
      <div className="rounded-[48px] bg-brand-impact p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GlassCard>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Inverse: Story = {
  args: { variant: 'inverse' },
}

export const Floating: Story = {
  args: { animation: 'float' },
}
