import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { DonationBasketSummary } from '#/components/donation-basket-summary'
import { useDonationBasket } from '#/components/donation-provider'
import { Button } from '#/components/ui/button'
import { withDonationPurposes } from './donation-purposes.fixtures'

function BasketExample() {
  const { setQuantity } = useDonationBasket()
  return (
    <div className="max-w-[420px] space-y-5">
      <Button
        onClick={() => {
          setQuantity('koffa', 3500, 2)
          setQuantity('wheelchair', 3000, 1)
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
  decorators: [withDonationPurposes()],
} satisfies Meta<typeof DonationBasketSummary>

export default meta
type Story = StoryObj<typeof meta>
export const Empty: Story = {}
export const Interactive: Story = { render: () => <BasketExample /> }
