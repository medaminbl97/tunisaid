import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { DonationMockPaymentPage } from '#/pages/donation-mock-payment'

const searchSchema = z.object({
  attempt: z.string().catch(''),
  token: z.string().catch(''),
})

export const Route = createFileRoute('/donate_/mock-payment')({
  validateSearch: searchSchema,
  component: MockPaymentRoute,
  head: () => ({
    meta: [{ name: 'robots', content: 'noindex' }],
  }),
})

function MockPaymentRoute() {
  const search = Route.useSearch()
  return (
    <DonationMockPaymentPage attempt={search.attempt} token={search.token} />
  )
}
