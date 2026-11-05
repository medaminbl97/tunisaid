import { DonateHero } from './components/donate-hero'
import { PurposeSelection } from './components/purpose-selection'
import { FlexibleGift } from './components/flexible-gift'
import { GiftJourney } from './components/gift-journey'

export function DonatePage() {
  return (
    <main className="-mt-[calc(var(--brand-header-height)+var(--brand-header-offset)+1rem)]">
      <DonateHero />
      <PurposeSelection />
      <FlexibleGift />
      <GiftJourney />
    </main>
  )
}
