import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { DonationThankYouPage } from '#/pages/donation-thank-you'

const searchSchema = z.object({
  reference: z.string().optional().catch(undefined),
  token: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/donate_/thank-you')({
  validateSearch: searchSchema,
  component: ThankYouRoute,
  head: () => ({
    meta: [{ name: 'robots', content: 'noindex' }],
  }),
})

function ThankYouRoute() {
  const search = Route.useSearch()
  return (
    <DonationThankYouPage reference={search.reference} token={search.token} />
  )
}
