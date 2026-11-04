import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { DirectContactCard } from '#/components/direct-contact-card'
import { siteContact } from '#/lib/site-contact'

const meta = {
  title: 'Components/DirectContactCard',
  component: DirectContactCard,
  parameters: { layout: 'padded' },
  args: {
    label: 'Email us',
    value: siteContact.email,
    hint: 'Questions, ideas, partnerships, or an offer to help.',
    href: `mailto:${siteContact.email}`,
  },
} satisfies Meta<typeof DirectContactCard>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
