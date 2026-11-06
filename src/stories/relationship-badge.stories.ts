import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { RelationshipBadge } from '#/components/relationship-badge'

const meta = {
  title: 'Components/RelationshipBadge',
  component: RelationshipBadge,
  parameters: { layout: 'padded' },
  args: { children: 'Inclusive school year' },
} satisfies Meta<typeof RelationshipBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
