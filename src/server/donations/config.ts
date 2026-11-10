import { z } from 'zod'

const envSchema = z.object({
  DIRECTUS_URL: z.url().optional(),
  VITE_API_BASE_URL: z.url().optional(),
  DIRECTUS_SERVICE_TOKEN: z
    .string()
    .regex(/^[\w-]{32,}$/)
    .optional()
    .catch(undefined),
  DONATION_SIGNING_SECRET: z.string().min(32).optional().catch(undefined),
  PAYMENT_PROVIDER: z.enum(['mock', 'stripe']).optional().catch(undefined),
  STRIPE_SECRET_KEY: z
    .string()
    .regex(/^[rs]k_(test|live)_\w{10,}$/)
    .optional()
    .catch(undefined),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .regex(/^whsec_\w{10,}$/)
    .optional()
    .catch(undefined),
  SITE_URL: z.url().optional().catch(undefined),
  ALLOW_MOCK_PAYMENTS: z.enum(['true', 'false']).optional(),
  NODE_ENV: z.string().optional(),
})

export type PaymentProviderName = 'mock' | 'stripe'

export type StripeConfig = {
  secretKey: string
  webhookSecret: string
  siteUrl: string
}

export type DonationServerConfig = {
  directusUrl: string
  serviceToken: string
  signingSecret: string
  provider: PaymentProviderName
  stripe: StripeConfig | null
}

export type DonationConfigState =
  | { enabled: true; config: DonationServerConfig }
  | { enabled: false; reason: string }

export function readDonationConfig(
  env: Record<string, string | undefined> = process.env,
): DonationConfigState {
  const parsed = envSchema.parse(env)
  const directusUrl =
    parsed.DIRECTUS_URL ?? parsed.VITE_API_BASE_URL ?? 'http://localhost:8056'
  if (!parsed.DIRECTUS_SERVICE_TOKEN || !parsed.DONATION_SIGNING_SECRET) {
    return { enabled: false, reason: 'missing_credentials' }
  }
  if (!parsed.PAYMENT_PROVIDER) {
    return { enabled: false, reason: 'missing_provider' }
  }
  // The mock provider marks donations paid without money moving.
  if (
    parsed.PAYMENT_PROVIDER === 'mock' &&
    parsed.NODE_ENV === 'production' &&
    parsed.ALLOW_MOCK_PAYMENTS !== 'true'
  ) {
    return { enabled: false, reason: 'mock_in_production' }
  }
  let stripe: StripeConfig | null = null
  if (parsed.PAYMENT_PROVIDER === 'stripe') {
    if (
      !parsed.STRIPE_SECRET_KEY ||
      !parsed.STRIPE_WEBHOOK_SECRET ||
      !parsed.SITE_URL
    ) {
      return { enabled: false, reason: 'missing_stripe_configuration' }
    }
    stripe = {
      secretKey: parsed.STRIPE_SECRET_KEY,
      webhookSecret: parsed.STRIPE_WEBHOOK_SECRET,
      siteUrl: parsed.SITE_URL.replace(/\/+$/, ''),
    }
  }
  return {
    enabled: true,
    config: {
      directusUrl,
      serviceToken: parsed.DIRECTUS_SERVICE_TOKEN,
      signingSecret: parsed.DONATION_SIGNING_SECRET,
      provider: parsed.PAYMENT_PROVIDER,
      stripe,
    },
  }
}

export function readServiceConfig(
  env: Record<string, string | undefined> = process.env,
) {
  const parsed = envSchema.parse(env)
  if (!parsed.DIRECTUS_SERVICE_TOKEN) return null
  return {
    directusUrl:
      parsed.DIRECTUS_URL ??
      parsed.VITE_API_BASE_URL ??
      'http://localhost:8056',
    serviceToken: parsed.DIRECTUS_SERVICE_TOKEN,
  }
}
