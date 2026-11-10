import { readDonationConfig } from './config'
import { createDonationService } from './service'
import * as signing from './signing'
import { receiptPath } from './stripe-checkout'
import { handleStripeEvent } from './stripe-events'
import { createStripeClient } from './stripe'

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

function stripeSetup() {
  const state = readDonationConfig()
  if (!state.enabled || state.config.provider !== 'stripe') return null
  const { stripe: stripeConfig, ...config } = state.config
  if (!stripeConfig) return null
  return {
    config,
    stripeConfig,
    stripe: createStripeClient(stripeConfig),
    service: createDonationService(state.config),
  }
}

// Stripe signs the raw body, so it must be read as text before any parsing.
export async function handleStripeWebhook(request: Request) {
  const setup = stripeSetup()
  if (!setup) return json({ error: 'not_configured' }, 404)
  const signature = request.headers.get('stripe-signature')
  if (!signature) return json({ error: 'missing_signature' }, 400)

  let event
  try {
    event = await setup.stripe.webhooks.constructEventAsync(
      await request.text(),
      signature,
      setup.stripeConfig.webhookSecret,
    )
  } catch {
    return json({ error: 'invalid_signature' }, 400)
  }

  try {
    const result = await handleStripeEvent(event, {
      service: setup.service,
      stripe: setup.stripe,
    })
    if (!result.handled && result.detail) {
      console.warn('Stripe event ignored', event.type, event.id, result.detail)
    }
    return json({ received: true })
  } catch (error) {
    console.error(
      'Stripe event failed',
      event.type,
      event.id,
      error instanceof Error ? error.message : error,
    )
    // A non-2xx answer makes Stripe redeliver the event.
    return json({ error: 'processing_failed' }, 500)
  }
}

// The donor left the Stripe page. Expire the open session so it cannot be
// paid later, record the cancellation, then show the receipt.
export async function handleStripeCancel(request: Request) {
  const setup = stripeSetup()
  if (!setup) return json({ error: 'not_configured' }, 404)
  const url = new URL(request.url)
  const attemptId = url.searchParams.get('attempt') ?? ''
  const token = url.searchParams.get('token') ?? ''
  if (
    !signing.verifyValue(
      setup.config.signingSecret,
      'attempt',
      attemptId,
      token,
    )
  ) {
    return json({ error: 'invalid_token' }, 400)
  }
  const attempt = await setup.service.getAttempt(attemptId)
  const payment = await setup.service.getMockPayment(attemptId)
  if (!attempt || attempt.provider !== 'stripe' || !payment) {
    return json({ error: 'not_found' }, 404)
  }

  if (
    attempt.status === 'pending' &&
    attempt.provider_payment_id?.startsWith('cs_')
  ) {
    try {
      await setup.stripe.checkout.sessions.expire(attempt.provider_payment_id)
      await setup.service.recordPaymentEvent({
        provider: 'stripe',
        eventId: `cancel:${attempt.id}`,
        attemptId: attempt.id,
        outcome: 'cancelled',
      })
    } catch (error) {
      // The session already completed or expired; its webhook decides.
      console.warn(
        'Stripe session was not cancelled',
        error instanceof Error ? error.message : error,
      )
    }
  }
  return new Response(null, {
    status: 303,
    headers: {
      Location: receiptPath(
        setup.config.signingSecret,
        payment.reference,
        setup.stripeConfig.siteUrl,
      ),
    },
  })
}
