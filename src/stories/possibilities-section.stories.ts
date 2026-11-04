import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { PossibilitiesSection } from '#/pages/what-we-do/components/possibilities-section'

const meta = {
  title: 'Pages/WhatWeDo/PossibilitiesSection',
  component: PossibilitiesSection,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PossibilitiesSection>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
