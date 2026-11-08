import { createServerFn } from '@tanstack/react-start'
import {
  campaignRaisedInputSchema,
  checkoutInputSchema,
  donationStatusLookupSchema,
  mockPaymentCompletionSchema,
  mockPaymentLookupSchema,
} from './schemas'
import type {
  CampaignRaised,
  CheckoutResult,
  DonationReceipt,
  MockPaymentDetails,
} from './schemas'

// Server modules are imported inside handlers so secrets and node APIs stay
// out of the client bundle.
async function loadServer() {
  const [
    { readDonationConfig, readServiceConfig },
    signing,
    { createDonationService },
  ] = await Promise.all([
    import('#/server/donations/config'),
    import('#/server/donations/signing'),
    import('#/server/donations/service'),
  ])
  return {
    readDonationConfig,
    readServiceConfig,
    signing,
    createDonationService,
  }
}

export const getDonationAvailability = createServerFn({
  method: 'GET',
}).handler(async (): Promise<{ enabled: boolean; provider: 'mock' | null }> => {
  const { readDonationConfig } = await loadServer()
  const state = readDonationConfig()
  return state.enabled
    ? { enabled: true, provider: state.config.provider }
    : { enabled: false, provider: null }
})

export const createCheckout = createServerFn({ method: 'POST' })
  .validator(checkoutInputSchema)
  .handler(async ({ data }): Promise<CheckoutResult> => {
    const { readDonationConfig, signing, createDonationService } =
      await loadServer()
    const state = readDonationConfig()
    if (!state.enabled) return { ok: false, code: 'unavailable' }
    const { config } = state
    try {
      const result = await createDonationService(config).createCheckout(
        data,
        config.provider,
      )
      if (!result.ok) return result
      const params = new URLSearchParams({
        attempt: result.attemptId,
        token: signing.signValue(
          config.signingSecret,
          'attempt',
          result.attemptId,
        ),
      })
      return {
        ok: true,
        reference: result.reference,
        redirectUrl: `/donate/mock-payment?${params}`,
      }
    } catch (error) {
      console.error(
        'Checkout failed',
        error instanceof Error ? error.message : error,
      )
      return { ok: false, code: 'failed' }
    }
  })

async function mockConfig(attempt: string, token: string) {
  const { readDonationConfig, signing, createDonationService } =
    await loadServer()
  const state = readDonationConfig()
  if (
    !state.enabled ||
    !signing.verifyValue(state.config.signingSecret, 'attempt', attempt, token)
  ) {
    return null
  }
  return {
    config: state.config,
    signing,
    service: createDonationService(state.config),
  }
}

export const getMockPayment = createServerFn({ method: 'GET' })
  .validator(mockPaymentLookupSchema)
  .handler(async ({ data }): Promise<MockPaymentDetails | null> => {
    const context = await mockConfig(data.attempt, data.token)
    return context ? context.service.getMockPayment(data.attempt) : null
  })

export const completeMockPayment = createServerFn({ method: 'POST' })
  .validator(mockPaymentCompletionSchema)
  .handler(async ({ data }) => {
    const context = await mockConfig(data.attempt, data.token)
    if (!context) return { ok: false as const }
    const payment = await context.service.getMockPayment(data.attempt)
    if (!payment) return { ok: false as const }
    await context.service.recordPaymentEvent({
      provider: 'mock',
      eventId: `${data.attempt}:${data.outcome}`,
      attemptId: data.attempt,
      outcome: data.outcome,
    })
    return {
      ok: true as const,
      reference: payment.reference,
      token: context.signing.signValue(
        context.config.signingSecret,
        'donation',
        payment.reference,
      ),
    }
  })

export const getDonationReceipt = createServerFn({ method: 'GET' })
  .validator(donationStatusLookupSchema)
  .handler(async ({ data }): Promise<DonationReceipt | null> => {
    const { readDonationConfig, signing, createDonationService } =
      await loadServer()
    const state = readDonationConfig()
    if (
      !state.enabled ||
      !signing.verifyValue(
        state.config.signingSecret,
        'donation',
        data.reference,
        data.token,
      )
    ) {
      return null
    }
    return createDonationService(state.config).getReceipt(data.reference)
  })

export const getCampaignRaised = createServerFn({ method: 'GET' })
  .validator(campaignRaisedInputSchema)
  .handler(async ({ data }): Promise<CampaignRaised | null> => {
    const { readServiceConfig, createDonationService } = await loadServer()
    const config = readServiceConfig()
    if (!config) return null
    return createDonationService(config).getCampaignRaised(
      [...new Set(data.slugs)].sort(),
    )
  })
