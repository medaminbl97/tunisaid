import type { Meta, StoryObj } from '@storybook/tanstack-react'
import heart from '#/assets/images/icon-heart.svg'
import { IconChip } from '#/components/icon-chip'

const meta = {
  title: 'Components/IconChip',
  component: IconChip,
  parameters: { layout: 'padded' },
  args: {
    children: <img src={heart} alt="" width={28} height={28} />,
  },
} satisfies Meta<typeof IconChip>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Sun: Story = { args: { tone: 'sun' } }
