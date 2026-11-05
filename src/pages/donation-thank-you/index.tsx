import { GratitudeHero } from './components/gratitude-hero'
import { GiftRecap } from './components/gift-recap'

export function DonationThankYouPage() {
  return (
    <main className="mx-auto max-w-[60rem] space-y-10 px-6 py-12 sm:px-10 lg:py-20">
      <GratitudeHero />
      <GiftRecap />
    </main>
  )
}
