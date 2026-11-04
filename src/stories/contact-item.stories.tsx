import type { Meta, StoryObj } from '@storybook/tanstack-react'
import mail from '#/assets/images/icon-mail.svg'
import { ContactItem } from '#/components/contact-item'
import { siteContact } from '#/lib/site-contact'

const meta = {
  title: 'Components/ContactItem',
  component: ContactItem,
  parameters: { layout: 'padded' },
  args: {
    icon: <img src={mail} alt="" width={28} height={28} />,
    title: 'Email us',
    description:
      'Have a question, an idea, or an offer to help? Write to us about donations, volunteering, or working together.',
    children: <a href={`mailto:${siteContact.email}`}>{siteContact.email}</a>,
  },
  decorators: [
    (Story) => (
      <div className="max-w-md bg-brand-lagoon-tint p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ContactItem>

export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
