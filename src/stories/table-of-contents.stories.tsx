import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { TableOfContents } from '#/components/table-of-contents'

const meta = {
  title: 'Components/TableOfContents',
  component: TableOfContents,
  parameters: { layout: 'padded' },
  args: {
    title: 'On this page',
    className: 'max-w-72',
    items: [
      { id: 'goal', text: 'Our goal', level: 2 },
      { id: 'support', text: 'How support works', level: 3 },
      { id: 'partners', text: 'Partners on the ground', level: 3 },
      { id: 'help', text: 'How you can help', level: 2 },
    ],
  },
} satisfies Meta<typeof TableOfContents>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
