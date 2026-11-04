import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { ValuesSection } from '#/pages/home/components/values-section'

const meta = {
  title: 'Pages/Home/ValuesSection',
  component: ValuesSection,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ValuesSection>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
