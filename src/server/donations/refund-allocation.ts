export type RefundCapacity = {
  donationId: string
  remainingCents: number
}

export type RefundShare = {
  donationId: string
  amountCents: number
}

// A provider refunds a whole payment, while the ledger records refunds against
// each campaign share. The amount is split in proportion to what each share
// can still give back, and never exceeds that capacity.
export function allocateRefund(
  amountCents: number,
  capacities: RefundCapacity[],
): RefundShare[] | null {
  const open = capacities.filter((share) => share.remainingCents > 0)
  const capacity = open.reduce((sum, share) => sum + share.remainingCents, 0)
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) return null
  if (amountCents > capacity) return null

  const parts = open.map((share) => {
    const exact = (amountCents * share.remainingCents) / capacity
    const floor = Math.floor(exact)
    return { donationId: share.donationId, floor, fraction: exact - floor }
  })
  let leftover = amountCents - parts.reduce((sum, part) => sum + part.floor, 0)
  const byFraction = [...parts].sort((a, b) => b.fraction - a.fraction)
  for (const part of byFraction) {
    if (leftover <= 0) break
    part.floor += 1
    leftover -= 1
  }
  return parts
    .filter((part) => part.floor > 0)
    .map((part) => ({ donationId: part.donationId, amountCents: part.floor }))
}
