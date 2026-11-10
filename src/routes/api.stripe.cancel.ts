import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/stripe/cancel')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { handleStripeCancel } =
          await import('#/server/donations/stripe-webhook')
        return handleStripeCancel(request)
      },
    },
  },
})
