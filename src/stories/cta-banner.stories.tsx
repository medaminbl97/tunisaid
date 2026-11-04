import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { CtaBanner } from '#/components/cta-banner'
import { Button } from '#/components/ui/button'

const meta = {
  title: 'Components/CtaBanner',
  component: CtaBanner,
  parameters: { layout: 'padded' },
  args: {
    id: 'cta-banner-heading',
    title: 'Your generosity makes a real difference.',
    description:
      'Put your treasure where your heart is — every donation reaches children and families with disabilities in Tunisia.',
    actions: (
      <Button asChild size="cta" shape="pill">
        <a href="/donate">Donate now</a>
      </Button>
    ),
  },
} satisfies Meta<typeof CtaBanner>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Peach: Story = {
  args: {
    tone: 'peach',
    eyebrow: 'Your part in the possibility',
    title: 'Bring what you can. Help change what is possible.',
  },
}
export const TwoActions: Story = {
  args: {
    actions: (
      <>
        <Button asChild size="cta" shape="pill">
          <a href="/donate">Donate now</a>
        </Button>
        <Button asChild variant="brandOutline" size="cta" shape="pill">
          <a href="/contact">Become a volunteer</a>
        </Button>
      </>
    ),
  },
}
