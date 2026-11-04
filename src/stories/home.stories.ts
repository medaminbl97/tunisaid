import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { HomePage } from '#/pages/home'

const meta = {
  title: 'Pages/Home',
  component: HomePage,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof HomePage>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
