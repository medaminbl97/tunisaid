import type { Meta, StoryObj } from '@storybook/tanstack-react'
import heart from '#/assets/images/hero-heart.svg'
import { InfoCard } from '#/components/info-card'

const meta = {
  title: 'Components/InfoCard',
  component: InfoCard,
  parameters: { layout: 'padded' },
  args: {
    icon: <img src={heart} alt="" width={26} height={26} />,
    title: 'Every little bit counts',
    description: 'Children & families, Tunisia',
    className: 'max-w-sm',
  },
} satisfies Meta<typeof InfoCard>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Floating: Story = {
  args: { animation: 'float' },
}
