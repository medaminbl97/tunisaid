import { createFileRoute } from '@tanstack/react-router'
import { DonationThankYouPage } from '#/pages/donation-thank-you'

export const Route = createFileRoute('/donate_/thank-you')({
  component: DonationThankYouPage,
  head: () => ({
    meta: [{ name: 'robots', content: 'noindex' }],
  }),
})
