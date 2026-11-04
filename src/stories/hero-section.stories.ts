import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { HeroSection } from '#/pages/home/components/hero-section'

const meta = {
  title: 'Pages/Home/HeroSection',
  component: HeroSection,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof HeroSection>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
