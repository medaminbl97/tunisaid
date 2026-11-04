import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { WorkHero } from '#/pages/what-we-do/components/work-hero'

const meta = {
  title: 'Pages/WhatWeDo/WorkHero',
  component: WorkHero,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof WorkHero>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
