import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { ProcessSection } from '#/pages/what-we-do/components/process-section'

const meta = {
  title: 'Pages/WhatWeDo/ProcessSection',
  component: ProcessSection,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ProcessSection>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
