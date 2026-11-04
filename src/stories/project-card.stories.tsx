import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { Link } from '@tanstack/react-router'
import { ProjectCard } from '#/components/project-card'
import { Button } from '#/components/ui/button'

const meta = {
  title: 'Components/ProjectCard',
  component: ProjectCard,
  parameters: { layout: 'padded' },
  args: {
    tag: 'Education',
    title: 'Educational Project',
    description:
      'Our partner associations support children with severe and multiple disabilities.',
    action: (
      <Button asChild variant="link">
        <Link to="/what-we-do">Read more</Link>
      </Button>
    ),
  },
  decorators: [
    (Story) => (
      <div className="max-w-[588px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProjectCard>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Fundraiser: Story = {
  args: {
    cover: 'terracotta',
    tag: 'Fundraiser',
    title: 'Coronavirus Fundraiser – Third Wave',
  },
}
