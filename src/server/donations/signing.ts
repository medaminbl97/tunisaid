import { createHmac, timingSafeEqual } from 'node:crypto'

export type SignedPurpose = 'attempt' | 'donation'

export function signValue(
  secret: string,
  purpose: SignedPurpose,
  value: string,
) {
  return createHmac('sha256', secret)
    .update(`${purpose}:${value}`)
    .digest('base64url')
}

export function verifyValue(
  secret: string,
  purpose: SignedPurpose,
  value: string,
  token: string,
) {
  const expected = Buffer.from(signValue(secret, purpose, value))
  const actual = Buffer.from(token)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
