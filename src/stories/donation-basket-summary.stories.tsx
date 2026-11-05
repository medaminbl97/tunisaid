import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { DonationBasketSummary } from '#/components/donation-basket-summary'
import {
  DonationProvider,
  useDonationBasket,
} from '#/components/donation-provider'
import { Button } from '#/components/ui/button'

function BasketExample() {
  const { setQuantity } = useDonationBasket()
  return (
    <div className="max-w-[420px] space-y-5">
      <Button
        onClick={() => {
          setQuantity('koffa', 2)
          setQuantity('wheelchair', 1)
        }}
      >
        Select an illustrative €100 basket
      </Button>
      <DonationBasketSummary title="Your selected gifts" editable />
    </div>
  )
}

const meta = {
  title: 'Components/DonationBasketSummary',
  component: DonationBasketSummary,
  parameters: { layout: 'padded' },
  args: { title: 'Your selected gifts' },
  decorators: [
    (Story) => (
      <DonationProvider>
        <Story />
      </DonationProvider>
    ),
  ],
} satisfies Meta<typeof DonationBasketSummary>

export default meta
type Story = StoryObj<typeof meta>
export const Empty: Story = {}
export const Interactive: Story = { render: () => <BasketExample /> }
