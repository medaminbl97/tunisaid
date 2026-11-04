import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { ApproachSection } from '#/pages/about/components/approach-section'

const meta = {
  title: 'Pages/About/ApproachSection',
  component: ApproachSection,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ApproachSection>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
