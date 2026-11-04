import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { StatementCard } from '#/components/statement-card'

const meta = {
  title: 'Components/StatementCard',
  component: StatementCard,
  parameters: { layout: 'padded' },
  args: {
    eyebrow: 'Our mission',
    title: 'A future without barriers.',
    description: 'Practical help, built with the people it serves.',
  },
} satisfies Meta<typeof StatementCard>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Lagoon: Story = { args: { tone: 'lagoon', as: 'h2' } }
