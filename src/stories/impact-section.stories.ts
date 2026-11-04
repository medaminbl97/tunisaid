import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { ImpactSection } from '#/pages/home/components/impact-section'

const meta = {
  title: 'Pages/Home/ImpactSection',
  component: ImpactSection,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ImpactSection>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
