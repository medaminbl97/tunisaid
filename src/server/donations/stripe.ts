import Stripe from 'stripe'
import type { StripeConfig } from './config'
import type { CheckoutLine } from './service'

const sessionLifetimeSeconds = 60 * 60

export function createStripeClient(config: Pick<StripeConfig, 'secretKey'>) {
  return new Stripe(config.secretKey, {
    maxNetworkRetries: 2,
    timeout: 20_000,
  })
}

export type StripeSessionInput = {
  attemptId: string
  reference: string
  language: 'en' | 'de'
  lines: CheckoutLine[]
  donorEmail: string | null
  successUrl: string
  cancelUrl: string
}

// Payment methods come from the Stripe dashboard (dynamic payment methods), so
// delayed methods such as SEPA debit are possible and finish via webhook.
export async function createStripeSession(
  stripe: Stripe,
  input: StripeSessionInput,
) {
  const metadata = { attempt_id: input.attemptId, reference: input.reference }
  const session = await stripe.checkout.sessions.create(
    {
      mode: 'payment',
      submit_type: 'donate',
      locale: input.language,
      client_reference_id: input.reference,
      customer_email: input.donorEmail ?? undefined,
      line_items: input.lines.map((line) => ({
        quantity: line.quantity,
        price_data: {
          currency: 'eur',
          unit_amount: line.unitCents,
          product_data: { name: line.title },
        },
      })),
      metadata,
      payment_intent_data: {
        description: `TunisAid donation ${input.reference}`,
        metadata,
      },
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      expires_at: Math.floor(Date.now() / 1000) + sessionLifetimeSeconds,
    },
    { idempotencyKey: `checkout-session:${input.attemptId}` },
  )
  if (!session.url) throw new Error('Stripe returned a session without a URL.')
  return { id: session.id, url: session.url }
}
