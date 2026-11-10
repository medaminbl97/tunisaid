import type { DonationServerConfig, StripeConfig } from './config'
import type { DonationService } from './service'
import * as signing from './signing'
import { createStripeClient, createStripeSession } from './stripe'

type CheckoutStart = Awaited<ReturnType<DonationService['createCheckout']>>
type StartedCheckout = Extract<CheckoutStart, { ok: true }>

export function receiptPath(
  signingSecret: string,
  reference: string,
  siteUrl = '',
) {
  const params = new URLSearchParams({
    reference,
    token: signing.signValue(signingSecret, 'donation', reference),
  })
  return `${siteUrl}/donate/thank-you?${params}`
}

export async function startStripeCheckout(options: {
  config: DonationServerConfig & { stripe: StripeConfig }
  service: DonationService
  checkout: StartedCheckout
  language: 'en' | 'de'
}): Promise<string> {
  const { config, service, checkout } = options
  const cancelParams = new URLSearchParams({
    attempt: checkout.attemptId,
    token: signing.signValue(
      config.signingSecret,
      'attempt',
      checkout.attemptId,
    ),
  })
  try {
    const session = await createStripeSession(
      createStripeClient(config.stripe),
      {
        attemptId: checkout.attemptId,
        reference: checkout.reference,
        language: options.language,
        lines: checkout.lines,
        donorEmail: checkout.donorEmail,
        successUrl: receiptPath(
          config.signingSecret,
          checkout.reference,
          config.stripe.siteUrl,
        ),
        cancelUrl: `${config.stripe.siteUrl}/api/stripe/cancel?${cancelParams}`,
      },
    )
    await service.attachProviderPayment(checkout.attemptId, session.id)
    return session.url
  } catch (error) {
    await service
      .recordPaymentEvent({
        provider: 'stripe',
        eventId: `session-failed:${checkout.attemptId}`,
        attemptId: checkout.attemptId,
        outcome: 'failed',
        failureCode: 'session_creation_failed',
      })
      .catch(() => undefined)
    throw error
  }
}
