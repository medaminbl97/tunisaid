import type { LocalizedCampaign } from '#/api/collections/campaigns/queries'

export const sampleCampaigns: LocalizedCampaign[] = [
  {
    id: '00000000-0000-4000-8000-000000000101',
    slug: 'inclusive-school-year-2027',
    status: 'published',
    goal_cents: 650000,
    currency: 'EUR',
    starts_at: '2026-10-31T23:00:00.000Z',
    ends_at: '2027-06-30T21:59:59.000Z',
    projects: [],
    translation: {
      id: '00000000-0000-4000-8000-000000000111',
      parent: '00000000-0000-4000-8000-000000000101',
      language: 'en',
      title: 'An inclusive school year',
      summary:
        'School supplies and mobility aids so that children with disabilities can learn alongside their classmates.',
    },
  },
  {
    id: '00000000-0000-4000-8000-000000000102',
    slug: 'ramadan-2027',
    status: 'published',
    goal_cents: 400000,
    currency: 'EUR',
    starts_at: '2027-01-14T23:00:00.000Z',
    ends_at: null,
    projects: [],
    translation: {
      id: '00000000-0000-4000-8000-000000000112',
      parent: '00000000-0000-4000-8000-000000000102',
      language: 'en',
      title: 'Ramadan 2027 food boxes',
      summary:
        'Grocery boxes for families that include people with disabilities, delivered before and during Ramadan.',
    },
  },
]
