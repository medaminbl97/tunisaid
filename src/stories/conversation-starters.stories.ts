import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { ConversationStarters } from '#/pages/contact/components/conversation-starters'

const meta = {
  title: 'Pages/Contact/ConversationStarters',
  component: ConversationStarters,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ConversationStarters>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
