import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { QuantityStepper } from '#/components/quantity-stepper'

const meta = {
  title: 'Components/QuantityStepper',
  component: QuantityStepper,
  parameters: { layout: 'centered' },
  args: {
    value: 2,
    label: 'Quantity for Koffa groceries',
    decreaseLabel: 'Decrease Koffa quantity',
    increaseLabel: 'Increase Koffa quantity',
    onChange: () => {},
  },
  render: function Interactive(args) {
    const [value, setValue] = useState(args.value)
    return <QuantityStepper {...args} value={value} onChange={setValue} />
  },
} satisfies Meta<typeof QuantityStepper>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Zero: Story = { args: { value: 0 } }
export const IncreaseUnavailable: Story = { args: { canIncrease: false } }
