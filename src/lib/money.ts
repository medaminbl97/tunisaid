import { z } from 'zod'

// Directus stores euro amounts as decimal(12,2) and returns them as strings
// such as "35.00". The application does its arithmetic in integer cents (exact
// sums, refund splits and Stripe amounts), so amounts are converted here, only
// where they cross the Directus boundary.

const euroPattern = /^(-?)(\d+)(?:\.(\d{1,2}))?$/

export function euroToCents(value: string | number): number {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Invalid euro amount.')
    return Math.round(value * 100)
  }
  const match = euroPattern.exec(value.trim())
  if (!match) throw new Error('Invalid euro amount.')
  const [, sign, whole, fraction = ''] = match
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  return sign ? -cents : cents
}

// Returns the decimal string Directus accepts for a decimal column ("35.00").
export function centsToEuro(cents: number): string {
  if (!Number.isSafeInteger(cents)) throw new Error('Invalid cent amount.')
  const absolute = Math.abs(cents)
  const fraction = String(absolute % 100).padStart(2, '0')
  return `${cents < 0 ? '-' : ''}${Math.trunc(absolute / 100)}.${fraction}`
}

// Parses a Directus amount (decimal string or number) into integer cents.
export const euroCents = z
  .union([z.string(), z.number()])
  .transform((value, context) => {
    try {
      return euroToCents(value)
    } catch {
      context.addIssue({ code: 'custom', message: 'Invalid euro amount.' })
      return z.NEVER
    }
  })
