import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { ContactHub } from '#/pages/contact/components/contact-hub'

const meta = {
  title: 'Pages/Contact/ContactHub',
  component: ContactHub,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ContactHub>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
