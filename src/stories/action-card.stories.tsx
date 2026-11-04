import type { Meta, StoryObj } from '@storybook/tanstack-react'
import mail from '#/assets/images/icon-mail.svg'
import handCoins from '#/assets/images/icon-hand-coins.svg'
import { ActionCard } from '#/components/action-card'
import { Button } from '#/components/ui/button'

const meta = {
  title: 'Components/ActionCard',
  component: ActionCard,
  parameters: { layout: 'padded' },
  args: {
    icon: <img src={mail} alt="" width={28} height={28} />,
    title: 'Get in touch',
    description:
      'Let us know if you have any comments or suggestions you want to share.',
    action: (
      <Button asChild size="cta" shape="pill">
        <a href="/contact">Contact us</a>
      </Button>
    ),
  },
  decorators: [
    (Story) => (
      <div className="max-w-[340px] bg-brand-cream p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ActionCard>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Featured: Story = {
  args: {
    featured: true,
    icon: <img src={handCoins} alt="" width={28} height={28} />,
    title: 'Donate financially',
    description:
      'Your generosity will make a real difference. Put your treasure where your heart is.',
    action: (
      <Button asChild variant="sun" size="cta" shape="pill">
        <a href="/donate">Donate now</a>
      </Button>
    ),
  },
}
