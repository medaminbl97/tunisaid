import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { TeamSection } from '#/pages/about/components/team-section'

const meta = {
  title: 'Pages/About/TeamSection',
  component: TeamSection,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof TeamSection>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
