import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { PartnerCard } from '#/components/partner-card'

const meta = {
  title: 'Components/PartnerCard',
  component: PartnerCard,
  parameters: { layout: 'padded' },
  args: {
    initials: 'APH',
    name: 'APH EL AJA',
    description: 'Partner association',
  },
  decorators: [
    (Story) => (
      <div className="max-w-[448px] bg-brand-lagoon-tint p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PartnerCard>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Sun: Story = {
  args: { initials: 'AAHPDC', name: 'AAHPDC', tone: 'sun' },
}
export const Terracotta: Story = {
  args: { initials: 'ARASO', name: 'ARASO', tone: 'terracotta' },
}
