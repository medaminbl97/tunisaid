import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { DonationBasketButton } from '#/components/donation-basket-button'
import { useDonationBasket } from '#/components/donation-provider'
import { Button } from '#/components/ui/button'
import { withDonationPurposes } from './donation-purposes.fixtures'

function BasketExample() {
  const { setQuantity, setFlexibleCents, clearBasket } = useDonationBasket()
  return (
    <div className="flex min-h-80 flex-col items-end gap-4">
      <DonationBasketButton />
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => setQuantity('koffa', 3500, 2)}>
          Add two Koffa
        </Button>
        <Button type="button" onClick={() => setFlexibleCents(1500)}>
          Add flexible €15
        </Button>
        <Button type="button" variant="outline" onClick={clearBasket}>
          Clear
        </Button>
      </div>
    </div>
  )
}

const meta = {
  title: 'Components/DonationBasketButton',
  component: DonationBasketButton,
  parameters: { layout: 'padded' },
  decorators: [withDonationPurposes()],
} satisfies Meta<typeof DonationBasketButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Interactive: Story = { render: () => <BasketExample /> }
