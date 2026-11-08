import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { FactList } from '#/components/fact-list'

const meta = {
  title: 'Components/FactList',
  component: FactList,
  args: {
    items: [
      { label: 'Fundraising goal', value: '€6,500' },
      { label: 'Campaign period', value: 'Nov 1, 2026 – Jun 30, 2027' },
      { label: 'Projects', value: 2 },
    ],
  },
} satisfies Meta<typeof FactList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
