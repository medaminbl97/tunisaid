import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { MessageForm } from '#/pages/contact/components/message-form'

const meta = {
  title: 'Pages/Contact/MessageForm',
  component: MessageForm,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof MessageForm>

export default meta
type Story = StoryObj<typeof meta>
export const Unavailable: Story = {}
