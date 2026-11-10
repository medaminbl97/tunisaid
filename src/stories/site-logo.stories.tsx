import type { Meta, StoryObj } from '@storybook/tanstack-react'

import { SiteLogo } from '#/components/site-logo'

const meta = {
  title: 'Components/SiteLogo',
  component: SiteLogo,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof SiteLogo>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Large: Story = {
  args: { className: 'size-32' },
}

export const OnDark: Story = {
  args: { className: 'size-20' },
  decorators: [
    (Story) => (
      <div className="rounded-3xl bg-brand-ink p-8">
        <Story />
      </div>
    ),
  ],
}
