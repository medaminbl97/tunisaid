import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { ContactClosing } from '#/pages/contact/components/contact-closing'

const meta = {
  title: 'Pages/Contact/ContactClosing',
  component: ContactClosing,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ContactClosing>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
