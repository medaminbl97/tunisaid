import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { GetInvolvedSection } from '#/pages/home/components/get-involved-section'

const meta = {
  title: 'Pages/Home/GetInvolvedSection',
  component: GetInvolvedSection,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof GetInvolvedSection>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
