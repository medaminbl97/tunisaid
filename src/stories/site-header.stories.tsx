import type { Meta, StoryObj } from '@storybook/tanstack-react'

import { SiteHeader } from '#/components/site-header'
import { HomePage } from '#/pages/home'

const meta = {
  title: 'Components/SiteHeader',
  component: SiteHeader,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof SiteHeader>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithPageContent: Story = {
  render: () => (
    <div className="min-h-[150vh]">
      <SiteHeader />
      <HomePage />
    </div>
  ),
}
