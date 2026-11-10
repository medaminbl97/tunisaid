import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { donationTotal, emptyDonationBasket } from '#/lib/donation'
import type { DonationBasket } from '#/lib/donation'
import {
  donationBasketStorageKey,
  parseStoredBasket,
  serializeBasket,
} from '#/lib/donation-storage'

function readStorage() {
  try {
    return window.localStorage.getItem(donationBasketStorageKey)
  } catch {
    return null
  }
}

function writeStorage(basket: DonationBasket) {
  try {
    if (donationTotal(basket) === 0) {
      window.localStorage.removeItem(donationBasketStorageKey)
    } else {
      window.localStorage.setItem(
        donationBasketStorageKey,
        serializeBasket(basket),
      )
    }
  } catch {
    // Storage can be full or blocked; the basket still works for this visit.
  }
}

type DonationContextValue = {
  basket: DonationBasket
  // False until the saved basket has been read in the browser, so pages do not
  // flash an empty basket after a reload.
  hydrated: boolean
  setQuantity: (slug: string, unitCents: number, quantity: number) => void
  setFlexibleCents: (cents: number) => void
  clearBasket: () => void
}

const DonationContext = createContext<DonationContextValue | null>(null)

export function DonationProvider(props: { children: ReactNode }) {
  const [basket, setBasket] = useState(emptyDonationBasket)
  const [hydrated, setHydrated] = useState(false)
  const persisted = useRef(JSON.stringify(emptyDonationBasket))

  useEffect(() => {
    const saved = parseStoredBasket(readStorage())
    persisted.current = JSON.stringify(saved)
    setBasket(saved)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    const content = JSON.stringify(basket)
    if (content === persisted.current) return
    persisted.current = content
    writeStorage(basket)
  }, [basket, hydrated])

  // Another tab changed or emptied the basket.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== null && event.key !== donationBasketStorageKey) return
      const saved = parseStoredBasket(event.newValue)
      persisted.current = JSON.stringify(saved)
      setBasket(saved)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

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
        hydrated,
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
