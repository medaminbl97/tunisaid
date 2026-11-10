import { z } from 'zod'
import { emptyDonationBasket } from '#/lib/donation'
import type { DonationBasket } from '#/lib/donation'

export const donationBasketStorageKey = 'tunisaid.donation-basket.v1'

// A basket nobody came back to is dropped instead of lingering forever.
export const donationBasketMaxAgeMs = 30 * 24 * 60 * 60 * 1000

const maxCents = 2_147_483_647

const storedBasketSchema = z.object({
  version: z.literal(1),
  savedAt: z.number().int().nonnegative(),
  basket: z.object({
    items: z
      .record(
        z.string().regex(/^[\w-]{1,200}$/),
        z.object({
          quantity: z.int().min(1).max(1000),
          unitCents: z.int().min(1).max(maxCents),
        }),
      )
      .refine((items) => Object.keys(items).length <= 50),
    flexibleCents: z.int().min(0).max(maxCents),
  }),
})

// Only gift slugs, quantities and amounts are stored: no personal or payment
// details. Anything unreadable, outdated or out of range counts as empty.
export function parseStoredBasket(
  raw: string | null,
  now = Date.now(),
): DonationBasket {
  if (!raw) return emptyDonationBasket
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return emptyDonationBasket
  }
  const parsed = storedBasketSchema.safeParse(json)
  if (!parsed.success) return emptyDonationBasket
  const { basket, savedAt } = parsed.data
  if (now - savedAt > donationBasketMaxAgeMs) return emptyDonationBasket
  const total = Object.values(basket.items).reduce(
    (sum, item) => sum + item.quantity * item.unitCents,
    basket.flexibleCents,
  )
  // Checkout refuses anything above this, so such a basket cannot be real.
  if (total > maxCents) return emptyDonationBasket
  return basket
}

export function serializeBasket(basket: DonationBasket, now = Date.now()) {
  return JSON.stringify({ version: 1, savedAt: now, basket })
}

export function basketItemCount(basket: DonationBasket) {
  const gifts = Object.values(basket.items).reduce(
    (sum, item) => sum + (item?.quantity ?? 0),
    0,
  )
  return gifts + (basket.flexibleCents > 0 ? 1 : 0)
}
