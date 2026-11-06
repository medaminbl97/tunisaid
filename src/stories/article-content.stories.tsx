import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { ArticleContent } from '#/components/article-content'
import { prepareRichText } from '#/lib/rich-text'

const paragraph =
  '<p>Our partner associations accompany children and young people with disabilities every day. They coordinate therapy, schooling and family support, and make sure that donated equipment reaches the people who need it.</p>'

const prepare = (html: string) =>
  prepareRichText(html, window, { assetBaseUrl: 'http://localhost:8056' })

const meta = {
  title: 'Components/ArticleContent',
  component: ArticleContent,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="bg-brand-cream px-6 py-16 sm:px-10">
        <Story />
      </div>
    ),
  ],
  args: {
    content: null,
    contentsLabel: 'On this page',
    emptyLabel: 'More details will follow soon.',
  },
} satisfies Meta<typeof ArticleContent>

export default meta
type Story = StoryObj<typeof meta>

export const WithNavigation: Story = {
  args: {
    content: prepare(
      `<h2>Our goal</h2>${paragraph}${paragraph}<h3>Who we support</h3>${paragraph}<h3>Partners on the ground</h3>${paragraph}<h2>How you can help</h2>${paragraph}${paragraph}`,
    ),
  },
}

export const SingleColumn: Story = {
  args: { content: prepare(`<h2>About this project</h2>${paragraph}`) },
}

export const Empty: Story = {}
