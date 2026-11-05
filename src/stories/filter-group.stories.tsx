import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { FilterGroup } from '#/components/filter-group'

const meta = {
  title: 'Components/FilterGroup',
  component: FilterGroup,
  parameters: { layout: 'padded' },
  args: {
    label: 'Filter purposes',
    options: [
      { value: 'all', label: 'All purposes' },
      { value: 'essentials', label: 'Essentials' },
      { value: 'mobility', label: 'Mobility' },
      { value: 'education', label: 'Education' },
    ],
    value: 'all',
    onChange: () => {},
  },
  render: function Interactive(args) {
    const [value, setValue] = useState(args.value)
    return <FilterGroup {...args} value={value} onChange={setValue} />
  },
} satisfies Meta<typeof FilterGroup>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
