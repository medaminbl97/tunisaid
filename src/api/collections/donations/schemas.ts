import { z } from 'zod'
import { donationPurposeLanguageSchema } from '#/api/collections/donation-purposes/schemas'

// PostgreSQL integer columns store amounts in cents.
export const maxDonationCents = 2_147_483_647
export const minDonationCents = 100

const slugSchema = z
  .string()
  .regex(/^[\w-]+$/)
  .max(200)

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || undefined)
    .optional()

export const donorInputSchema = z.object({
  name: optionalText(120),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .pipe(z.union([z.literal(''), z.email()]))
    .transform((value) => value || undefined)
    .optional(),
  countryCode: z
    .union([z.literal(''), z.string().regex(/^[A-Z]{2}$/)])
    .transform((value) => value || undefined)
    .optional(),
  keepNamePrivate: z.boolean(),
})

export const checkoutInputSchema = z.object({
  language: donationPurposeLanguageSchema,
  items: z
    .array(
      z.object({
        slug: slugSchema,
        quantity: z.int().min(1).max(1000),
        unitCents: z.int().min(1).max(maxDonationCents),
      }),
    )
    .max(50)
    .refine(
      (items) => new Set(items.map((item) => item.slug)).size === items.length,
      'Each purpose may appear only once.',
    ),
  flexibleCents: z.int().min(0).max(maxDonationCents),
  expectedTotalCents: z.int().min(minDonationCents).max(maxDonationCents),
  donor: donorInputSchema,
})

export type CheckoutInput = z.input<typeof checkoutInputSchema>
export type ParsedCheckoutInput = z.output<typeof checkoutInputSchema>

export const checkoutErrorCodes = [
  'unavailable',
  'catalog_changed',
  'campaign_conflict',
  'invalid_amount',
  'failed',
] as const
export type CheckoutErrorCode = (typeof checkoutErrorCodes)[number]

export type CheckoutResult =
  | { ok: true; reference: string; redirectUrl: string }
  | { ok: false; code: CheckoutErrorCode }

const signedTokenSchema = z.string().regex(/^[\w-]{20,100}$/)

export const mockPaymentLookupSchema = z.object({
  attempt: z.uuid(),
  token: signedTokenSchema,
})

export const mockPaymentOutcomeSchema = z.enum([
  'succeeded',
  'failed',
  'cancelled',
])
export type MockPaymentOutcome = z.infer<typeof mockPaymentOutcomeSchema>

export const mockPaymentCompletionSchema = mockPaymentLookupSchema.extend({
  outcome: mockPaymentOutcomeSchema,
})

export const donationReferenceSchema = z.string().regex(/^TA-[A-Z2-7]{12}$/)

export const donationStatusLookupSchema = z.object({
  reference: donationReferenceSchema,
  token: signedTokenSchema,
})

// Payment lifecycle stored on the checkout record.
export const storedDonationStatuses = [
  'pending',
  'paid',
  'failed',
  'cancelled',
  'expired',
] as const
export type StoredDonationStatus = (typeof storedDonationStatuses)[number]

// Receipt status: refund states are derived from linked succeeded refunds.
export const donationStatuses = [
  ...storedDonationStatuses,
  'partially_refunded',
  'refunded',
] as const
export type DonationStatus = (typeof donationStatuses)[number]

export type DonationReceipt = {
  reference: string
  status: DonationStatus
  totalCents: number
  currency: 'EUR'
  createdAt: string | null
  paidAt: string | null
  items: Array<{
    id: string
    kind: 'purpose' | 'flexible'
    title: string
    quantity: number
    unitCents: number
    totalCents: number
    // The campaign this line counts toward, with titles by language.
    campaign: { slug: string; titles: Partial<Record<string, string>> } | null
  }>
}

export type MockPaymentDetails = {
  reference: string
  amountCents: number
  currency: 'EUR'
  status: 'created' | 'pending' | 'succeeded' | 'failed' | 'cancelled'
}

export const campaignRaisedInputSchema = z.object({
  slugs: z.array(slugSchema).min(1).max(24),
})

export type CampaignRaised = Record<
  string,
  { raisedCents: number; donationCount: number }
>
