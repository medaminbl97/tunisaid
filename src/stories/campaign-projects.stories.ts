import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { CampaignProjects } from '#/pages/campaign-detail/components/campaign-projects'

const meta = {
  title: 'Pages/CampaignDetail/CampaignProjects',
  component: CampaignProjects,
  parameters: { layout: 'fullscreen' },
  args: {
    projects: [
      {
        id: '00000000-0000-4000-8000-000000000001',
        slug: 'school-supplies-support',
        title: 'School supplies for children with disabilities',
        summary:
          'Helping children with disabilities in Tunisia access the supplies they need for school.',
      },
      {
        id: '00000000-0000-4000-8000-000000000002',
        slug: 'wheelchairs-for-students',
        title: 'Electric wheelchairs for students',
        summary:
          'An initiative to help two students access electric wheelchairs for their journeys to school.',
      },
    ],
    campaign: {
      slug: 'inclusive-school-year-2027',
      title: 'An inclusive school year',
    },
  },
} satisfies Meta<typeof CampaignProjects>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
