import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { SectionHeading } from '#/components/section-heading'

const meta = {
  title: 'Components/SectionHeading',
  component: SectionHeading,
  parameters: {
    layout: 'padded',
  },
  args: {
    eyebrow: 'Our values',
    title: 'What guides every decision',
  },
} satisfies Meta<typeof SectionHeading>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const LeftAligned: Story = {
  args: {
    align: 'left',
    eyebrow: 'Our projects',
    title: 'Projects built with the people they serve',
  },
}

export const WithDescription: Story = {
  args: {
    eyebrow: 'Our partners',
    title: 'Together with partners on the ground',
    description: 'Local associations in Tunisia carry our projects every day.',
  },
}

export const Inverse: Story = {
  args: {
    align: 'left',
    tone: 'inverse',
    eyebrowVariant: 'pill',
    eyebrow: 'Our impact',
    title: 'We turn commitment into action.',
  },
  decorators: [
    (Story) => (
      <div className="rounded-[48px] bg-brand-impact p-8">
        <Story />
      </div>
    ),
  ],
}
