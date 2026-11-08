import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { RichText } from '#/components/rich-text'

const meta = {
  title: 'Components/RichText',
  component: RichText,
  parameters: { layout: 'padded' },
  args: {
    className: 'max-w-[46rem]',
    html:
      '<h2 id="goal">Our goal</h2><p>Children with disabilities on <strong>Djerba</strong> receive daily support, therapy and <em>learning materials</em>.</p>' +
      '<blockquote><p>Every child deserves a place to learn.</p></blockquote>' +
      '<h3 id="support">How support works</h3><ul><li>School supplies</li><li>Assistive devices</li><li>Trained staff</li></ul>' +
      '<p>Read more on <a href="https://tunisaid.org/">tunisaid.org</a>.</p>',
  },
} satisfies Meta<typeof RichText>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
