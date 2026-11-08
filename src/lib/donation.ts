export type DonationBasketItem = {
  quantity: number
  unitCents: number
}

export type DonationBasket = {
  items: Record<string, DonationBasketItem | undefined>
  flexibleCents: number
}

export const emptyDonationBasket: DonationBasket = {
  items: {},
  flexibleCents: 0,
}

export function donationTotal(basket: DonationBasket) {
  return Object.values(basket.items).reduce(
    (total, item) => total + (item ? item.quantity * item.unitCents : 0),
    basket.flexibleCents,
  )
}

export function basketQuantity(basket: DonationBasket, slug: string) {
  return basket.items[slug]?.quantity ?? 0
}

export function parseDonationAmount(value: string): number | null {
  const normalized = value.trim().replace(',', '.')
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(normalized)) return null
  const [whole, fraction = ''] = normalized.split('.')
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null
}

export function formatDonationAmount(cents: number, language: string) {
  return new Intl.NumberFormat(language, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: cents % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}
