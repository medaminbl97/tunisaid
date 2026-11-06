import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { donationTotal, emptyDonationBasket } from '#/lib/donation'
import type { DonationBasket } from '#/lib/donation'

type DonationContextValue = {
  basket: DonationBasket
  setQuantity: (slug: string, unitCents: number, quantity: number) => void
  setFlexibleCents: (cents: number) => void
  clearBasket: () => void
}

const DonationContext = createContext<DonationContextValue | null>(null)

export function DonationProvider(props: { children: ReactNode }) {
  const [basket, setBasket] = useState(emptyDonationBasket)

  function setQuantity(slug: string, unitCents: number, quantity: number) {
    if (!Number.isSafeInteger(quantity) || quantity < 0) {
      throw new Error('Donation quantities must be non-negative safe integers.')
    }
    if (!Number.isSafeInteger(unitCents) || unitCents <= 0) {
      throw new Error('Donation unit amounts must be positive integer cents.')
    }
    setBasket((current) => {
      const { [slug]: _removed, ...items } = current.items
      const next = {
        ...current,
        items:
          quantity > 0 ? { ...items, [slug]: { quantity, unitCents } } : items,
      }
      if (!Number.isSafeInteger(donationTotal(next))) {
        throw new Error('Donation total exceeds the supported range.')
      }
      return next
    })
  }

  function setFlexibleCents(cents: number) {
    if (!Number.isSafeInteger(cents) || cents < 0) {
      throw new Error('Donation amounts must be non-negative integer cents.')
    }
    setBasket((current) => {
      const next = { ...current, flexibleCents: cents }
      if (!Number.isSafeInteger(donationTotal(next))) {
        throw new Error('Donation total exceeds the supported range.')
      }
      return next
    })
  }

  const clearBasket = useCallback(() => {
    setBasket(emptyDonationBasket)
  }, [])

  return (
    <DonationContext.Provider
      value={{
        basket,
        setQuantity,
        setFlexibleCents,
        clearBasket,
      }}
    >
      {props.children}
    </DonationContext.Provider>
  )
}

export function useDonationBasket() {
  const context = useContext(DonationContext)
  if (!context) throw new Error('useDonationBasket requires DonationProvider.')
  return context
}
