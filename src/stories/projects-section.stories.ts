import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { ProjectsSection } from '#/pages/home/components/projects-section'

const meta = {
  title: 'Pages/Home/ProjectsSection',
  component: ProjectsSection,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ProjectsSection>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
