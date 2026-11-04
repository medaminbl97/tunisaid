import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { WorkInvitation } from '#/pages/what-we-do/components/work-invitation'

const meta = {
  title: 'Pages/WhatWeDo/WorkInvitation',
  component: WorkInvitation,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof WorkInvitation>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
