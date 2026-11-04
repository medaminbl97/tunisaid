import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { StorySection } from '#/pages/about/components/story-section'

const meta = {
  title: 'Pages/About/StorySection',
  component: StorySection,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof StorySection>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
