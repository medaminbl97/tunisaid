import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { ImagePanel } from '#/components/image-panel'
import { donationImages, editorialImages } from '#/lib/site-images'

const meta = {
  title: 'Components/ImagePanel',
  component: ImagePanel,
  parameters: { layout: 'padded' },
  args: {
    image: editorialImages.independence,
    alt: 'An imagined courtyard conversation between a wheelchair user and a friend.',
    caption:
      'AI-generated illustration · Not a photograph of TunisAid projects or team members.',
    sizes: '(min-width: 800px) 800px, 100vw',
  },
} satisfies Meta<typeof ImagePanel>

export default meta
type Story = StoryObj<typeof meta>
export const Editorial: Story = {}
export const PortraitCrop: Story = {
  args: { imageClassName: 'aspect-[4/5] object-[70%_center]' },
}
export const DonationIllustration: Story = {
  args: {
    image: donationImages.koffa,
    alt: '',
    caption:
      'AI-generated illustration · Gift amounts and items are illustrative.',
    imageClassName: 'aspect-[7/6]',
  },
}
