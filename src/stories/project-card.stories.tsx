import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { Link } from '@tanstack/react-router'
import { ProjectCard } from '#/components/project-card'
import { RelationshipBadge } from '#/components/relationship-badge'
import { Button } from '#/components/ui/button'
import { ImagePanel } from '#/components/image-panel'
import { editorialImages } from '#/lib/site-images'

const meta = {
  title: 'Components/ProjectCard',
  component: ProjectCard,
  parameters: { layout: 'padded' },
  args: {
    tag: 'Education',
    title: 'Educational Project',
    description:
      'Our partner associations support children with severe and multiple disabilities.',
    relationships: (
      <div className="space-y-2">
        <p className="text-xs font-bold text-brand-ink-soft">
          Donation purposes for this project
        </p>
        <ul className="flex flex-wrap gap-2">
          <li>
            <RelationshipBadge>School kit</RelationshipBadge>
          </li>
          <li>
            <RelationshipBadge>Wheelchair share</RelationshipBadge>
          </li>
        </ul>
      </div>
    ),
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
export const Illustrated: Story = {
  args: {
    coverImage: (
      <ImagePanel
        image={editorialImages.learning}
        alt="An imagined inclusive workshop."
        sizes="588px"
        className="h-full [&>div]:h-full [&>div]:rounded-none"
        imageClassName="h-full"
      />
    ),
  },
}
export const Fundraiser: Story = {
  args: {
    cover: 'terracotta',
    tag: 'Fundraiser',
    title: 'Coronavirus Fundraiser – Third Wave',
  },
}
