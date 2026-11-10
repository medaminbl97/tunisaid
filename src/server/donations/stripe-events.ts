import type Stripe from 'stripe'
import { z } from 'zod'
import type { DonationService, RefundStatus } from './service'

type StripeEventContext = {
  service: DonationService
  stripe: Pick<Stripe, 'paymentIntents'>
}

export type StripeEventResult = { handled: boolean; detail?: string }

const attemptIdSchema = z.uuid()

const refundStatuses: Partial<Record<string, RefundStatus>> = {
  succeeded: 'succeeded',
  pending: 'pending',
  requires_action: 'pending',
  failed: 'failed',
  canceled: 'failed',
}

async function ownAttempt(
  service: DonationService,
  rawAttemptId: string | null | undefined,
) {
  const parsed = attemptIdSchema.safeParse(rawAttemptId)
  if (!parsed.success) return null
  const attempt = await service.getAttempt(parsed.data)
  return attempt?.provider === 'stripe' ? attempt : null
}

async function handleSession(
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
  context: StripeEventContext,
): Promise<StripeEventResult> {
  const attempt = await ownAttempt(
    context.service,
    session.metadata?.attempt_id,
  )
  if (!attempt) return { handled: false, detail: 'unknown_attempt' }
  const base = {
    provider: 'stripe',
    eventId: event.id,
    attemptId: attempt.id,
  }

  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      // Delayed methods complete the session before the money arrives.
      if (session.payment_status !== 'paid') {
        return { handled: true, detail: 'awaiting_payment' }
      }
      await context.service.recordPaymentEvent({
        ...base,
        outcome: 'succeeded',
        collectedCents: session.amount_total ?? undefined,
      })
      return { handled: true }
    case 'checkout.session.async_payment_failed':
      await context.service.recordPaymentEvent({
        ...base,
        outcome: 'failed',
        failureCode: 'payment_failed',
      })
      return { handled: true }
    case 'checkout.session.expired':
      await context.service.recordPaymentEvent({
        ...base,
        outcome: 'cancelled',
      })
      return { handled: true }
    default:
      return { handled: false }
  }
}

async function handleRefund(
  refund: Stripe.Refund,
  context: StripeEventContext,
): Promise<StripeEventResult> {
  const status = refundStatuses[refund.status ?? '']
  const paymentIntentId =
    typeof refund.payment_intent === 'string'
      ? refund.payment_intent
      : refund.payment_intent?.id
  if (!status || !paymentIntentId || refund.currency !== 'eur') {
    return { handled: false, detail: 'unsupported_refund' }
  }
  const intent = await context.stripe.paymentIntents.retrieve(paymentIntentId)
  const attempt = await ownAttempt(context.service, intent.metadata.attempt_id)
  if (!attempt) return { handled: false, detail: 'unknown_attempt' }
  const result = await context.service.syncRefund({
    provider: 'stripe',
    refundId: refund.id,
    attemptId: attempt.id,
    amountCents: refund.amount,
    status,
    reason: refund.reason,
  })
  return { handled: result.applied, detail: result.reason }
}

export async function handleStripeEvent(
  event: Stripe.Event,
  context: StripeEventContext,
): Promise<StripeEventResult> {
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
    case 'checkout.session.async_payment_failed':
    case 'checkout.session.expired':
      return handleSession(event, event.data.object, context)
    case 'refund.created':
    case 'refund.updated':
    case 'refund.failed':
      return handleRefund(event.data.object, context)
    default:
      return { handled: false }
  }
}
