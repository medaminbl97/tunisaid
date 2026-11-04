import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { AboutHero } from '#/pages/about/components/about-hero'

const meta = {
  title: 'Pages/About/AboutHero',
  component: AboutHero,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AboutHero>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
