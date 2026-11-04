import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { SiteFooter } from '#/components/site-footer'

const meta = {
  title: 'Components/SiteFooter',
  component: SiteFooter,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof SiteFooter>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
