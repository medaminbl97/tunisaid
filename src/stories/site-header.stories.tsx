import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { I18nextProvider } from 'react-i18next'

import { SiteHeader } from '#/components/site-header'
import i18n from '#/locales/i18n'
import { HomePage } from '#/pages/home'

const germanI18n = i18n.cloneInstance({ lng: 'de', initAsync: false })

const meta = {
  title: 'Components/SiteHeader',
  component: SiteHeader,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof SiteHeader>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const German: Story = {
  decorators: [
    (Story) => (
      <I18nextProvider i18n={germanI18n}>
        <Story />
      </I18nextProvider>
    ),
  ],
}

export const Mobile: Story = {
  globals: {
    viewport: { value: 'mobile1', isRotated: false },
  },
}

export const WithPageContent: Story = {
  render: () => (
    <div className="min-h-[150vh]">
      <SiteHeader />
      <HomePage />
    </div>
  ),
}
