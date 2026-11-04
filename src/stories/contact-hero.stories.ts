import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { ContactHero } from '#/pages/contact/components/contact-hero'

const meta = {
  title: 'Pages/Contact/ContactHero',
  component: ContactHero,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ContactHero>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
