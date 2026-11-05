export const donationPurposes = [
  { id: 'koffa', category: 'essentials', cents: 3500 },
  { id: 'wheelchair', category: 'mobility', cents: 3000 },
  { id: 'school', category: 'education', cents: 2500 },
  { id: 'warmth', category: 'essentials', cents: 4500 },
] as const

export type DonationPurposeId = (typeof donationPurposes)[number]['id']
export type DonationCategory = (typeof donationPurposes)[number]['category']
export type DonationBasket = {
  quantities: Record<DonationPurposeId, number>
  flexibleCents: number
}

export const emptyDonationBasket: DonationBasket = {
  quantities: { koffa: 0, wheelchair: 0, school: 0, warmth: 0 },
  flexibleCents: 0,
}

export function donationTotal(basket: DonationBasket) {
  return donationPurposes.reduce(
    (total, purpose) => total + basket.quantities[purpose.id] * purpose.cents,
    basket.flexibleCents,
  )
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
