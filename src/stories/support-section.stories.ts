import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { SupportSection } from '#/pages/what-we-do/components/support-section'

const meta = {
  title: 'Pages/WhatWeDo/SupportSection',
  component: SupportSection,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof SupportSection>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
