import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { DetailHero } from '#/components/detail-hero'
import { FactList } from '#/components/fact-list'

const meta = {
  title: 'Components/DetailHero',
  component: DetailHero,
  parameters: { layout: 'fullscreen' },
  args: {
    titleId: 'detail-title',
    eyebrow: 'Project',
    title: 'Wheelchairs for students',
    summary:
      'Mobility aids help students with disabilities reach school and take part in everyday life.',
    backLabel: 'All projects',
    backTo: '/what-we-do',
  },
} satisfies Meta<typeof DetailHero>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithoutSummary: Story = { args: { summary: null } }
export const WithFacts: Story = {
  args: {
    eyebrow: 'Campaign',
    title: 'An inclusive school year',
    backLabel: 'Back to campaigns',
    backTo: '/',
    backHash: 'campaigns',
    children: (
      <FactList
        items={[
          { label: 'Fundraising goal', value: '€6,500' },
          { label: 'Campaign period', value: 'Nov 1, 2026 – Jun 30, 2027' },
        ]}
      />
    ),
  },
}
