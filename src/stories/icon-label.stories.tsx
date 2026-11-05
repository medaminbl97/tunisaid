import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { ShieldCheck } from 'lucide-react'
import { IconLabel } from '#/components/icon-label'

const meta = {
  title: 'Components/IconLabel',
  component: IconLabel,
  parameters: { layout: 'padded' },
  args: {
    icon: <ShieldCheck className="size-7" />,
    children: 'An intention, not a shopping order.',
  },
} satisfies Meta<typeof IconLabel>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
