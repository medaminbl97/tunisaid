import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { Package } from 'lucide-react'
import { PurposeCard } from '#/components/purpose-card'
import { Button } from '#/components/ui/button'

const meta = {
  title: 'Components/PurposeCard',
  component: PurposeCard,
  parameters: { layout: 'padded' },
  args: {
    icon: <Package aria-hidden="true" />,
    category: 'Food & dignity',
    title: 'Give a Koffa',
    description: 'A bag of everyday groceries, chosen for a family in Tunisia.',
    impact: 'One family. Essential groceries.',
    amount: '€35',
    unit: 'per Koffa · illustrative amount',
    action: (
      <Button variant="sun" shape="pill" disabled>
        Add gift
      </Button>
    ),
  },
  decorators: [
    (Story) => (
      <div className="max-w-[390px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PurposeCard>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
