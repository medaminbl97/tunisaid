import type { Meta, StoryObj } from '@storybook/tanstack-react'
import shield from '#/assets/images/icon-shield-check.svg'
import { ValueCard } from '#/components/value-card'

const meta = {
  title: 'Components/ValueCard',
  component: ValueCard,
  parameters: { layout: 'padded' },
  args: {
    icon: <img src={shield} alt="" width={28} height={28} />,
    title: 'Most trusted',
    description:
      'We value your trust and demonstrate accountability in every task we do.',
  },
  decorators: [
    (Story) => (
      <div className="max-w-[340px] bg-brand-sun-soft p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ValueCard>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
