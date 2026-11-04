import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { ContactStrip } from '#/components/contact-strip'

const meta = {
  title: 'Components/ContactStrip',
  component: ContactStrip,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ContactStrip>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
