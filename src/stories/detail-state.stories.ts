import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { fn } from 'storybook/test'
import { DetailState } from '#/components/detail-state'

const meta = {
  title: 'Components/DetailState',
  component: DetailState,
  parameters: { layout: 'fullscreen' },
  args: {
    state: 'loading',
    backTo: '/what-we-do',
    labels: {
      loading: 'Loading project…',
      notFoundTitle: 'Project not found',
      notFoundDescription:
        'This project does not exist or has not been published yet.',
      errorTitle: 'The project could not be loaded',
      errorDescription: 'Please check your connection and try again.',
      retry: 'Try again',
      back: 'All projects',
    },
  },
} satisfies Meta<typeof DetailState>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {}
export const NotFound: Story = { args: { state: 'not-found' } }
export const LoadError: Story = { args: { state: 'error', onRetry: fn() } }
