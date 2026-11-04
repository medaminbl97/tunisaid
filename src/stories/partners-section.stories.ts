import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { PartnersSection } from '#/pages/home/components/partners-section'

const meta = {
  title: 'Pages/Home/PartnersSection',
  component: PartnersSection,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PartnersSection>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
