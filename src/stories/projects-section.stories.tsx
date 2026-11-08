import type { Decorator, Meta, StoryObj } from '@storybook/tanstack-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { campaignKeys } from '#/api/collections/campaigns/queries'
import type { LocalizedCampaign } from '#/api/collections/campaigns/queries'
import { projectKeys } from '#/api/collections/projects/queries'
import type { getProjects } from '#/api/collections/projects/queries'
import { ProjectsSection } from '#/pages/home/components/projects-section'

type HomeProjects = Awaited<ReturnType<typeof getProjects>>

const sampleProjects: HomeProjects = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    slug: 'school-supplies-support',
    status: 'published',
    translation: {
      id: '00000000-0000-4000-8000-000000000011',
      parent: '00000000-0000-4000-8000-000000000001',
      language: 'en',
      title: 'School supplies for every child',
      summary:
        'Backpacks, books and stationery help children with disabilities start the school year ready to learn.',
    },
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    slug: 'ramadan-food-boxes',
    status: 'published',
    translation: {
      id: '00000000-0000-4000-8000-000000000012',
      parent: '00000000-0000-4000-8000-000000000002',
      language: 'en',
      title: 'Ramadan food boxes',
      summary:
        'Partner associations deliver food boxes to families who care for relatives with disabilities.',
    },
  },
]

const sampleCampaigns: LocalizedCampaign[] = [
  {
    id: '00000000-0000-4000-8000-000000000101',
    slug: 'inclusive-school-year-2027',
    status: 'published',
    goal_cents: 650000,
    currency: 'EUR',
    starts_at: '2026-11-01T00:00:00+01:00',
    ends_at: '2027-06-30T23:59:59+02:00',
    cover_image: null,
    translation: {
      id: '00000000-0000-4000-8000-000000000111',
      parent: '00000000-0000-4000-8000-000000000101',
      language: 'en',
      title: 'An inclusive school year',
      summary: 'School and mobility support for inclusive learning.',
      image_alt: null,
      body: null,
    },
    projects: [
      {
        id: sampleProjects[0].id,
        slug: sampleProjects[0].slug,
        title: sampleProjects[0].translation.title,
        summary: sampleProjects[0].translation.summary ?? null,
      },
    ],
  },
]

const withProjects =
  (data: HomeProjects): Decorator =>
  (Story) => {
    const client = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false } },
    })
    client.setQueryData(projectKeys.list({ language: 'en', limit: 2 }), data)
    if (data.length > 0) {
      client.setQueryData(
        campaignKeys.forProjects(
          data.map((project) => project.slug),
          'en',
        ),
        sampleCampaigns,
      )
    }
    return (
      <QueryClientProvider client={client}>
        <Story />
      </QueryClientProvider>
    )
  }

const meta = {
  title: 'Pages/Home/ProjectsSection',
  component: ProjectsSection,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ProjectsSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { decorators: [withProjects(sampleProjects)] }
export const Empty: Story = { decorators: [withProjects([])] }
