import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { withDonationPurposes } from './donation-purposes.fixtures'
import { PurposeSelection } from '#/pages/donate/components/purpose-selection'

const meta = {
  title: 'Pages/Donate/PurposeSelection',
  component: PurposeSelection,
  parameters: { layout: 'fullscreen' },
  decorators: [withDonationPurposes()],
} satisfies Meta<typeof PurposeSelection>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const FilteredByProject: Story = {
  args: { projectSlug: 'ramadan-food-boxes' },
}
export const GeneralPurpose: Story = {
  args: { generalPurpose: true },
}
export const LoadError: Story = {
  decorators: [withDonationPurposes(new Error('Directus unavailable'))],
}
export const Empty: Story = { decorators: [withDonationPurposes([])] }
