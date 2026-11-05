import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { donationTotal, emptyDonationBasket } from '#/lib/donation'
import type { DonationBasket, DonationPurposeId } from '#/lib/donation'

type DonationContextValue = {
  basket: DonationBasket
  setQuantity: (id: DonationPurposeId, quantity: number) => void
  setFlexibleCents: (cents: number) => void
}

const DonationContext = createContext<DonationContextValue | null>(null)

export function DonationProvider(props: { children: ReactNode }) {
  const [basket, setBasket] = useState(emptyDonationBasket)

  function setQuantity(id: DonationPurposeId, quantity: number) {
    if (!Number.isSafeInteger(quantity) || quantity < 0) {
      throw new Error('Donation quantities must be non-negative safe integers.')
    }
    setBasket((current) => {
      const next = {
        ...current,
        quantities: { ...current.quantities, [id]: quantity },
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

  return (
    <DonationContext.Provider value={{ basket, setQuantity, setFlexibleCents }}>
      {props.children}
    </DonationContext.Provider>
  )
}

export function useDonationBasket() {
  const context = useContext(DonationContext)
  if (!context) throw new Error('useDonationBasket requires DonationProvider.')
  return context
}
