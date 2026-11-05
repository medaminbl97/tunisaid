import { CheckoutHero } from './components/checkout-hero'
import { CheckoutForm } from './components/checkout-form'
import { CheckoutReview } from './components/checkout-review'

export function DonationCheckoutPage() {
  return (
    <main className="mx-auto max-w-[75rem] space-y-12 px-6 py-10 sm:px-10 lg:py-16 xl:px-0">
      <CheckoutHero />
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)] lg:gap-16">
        <CheckoutForm />
        <CheckoutReview />
      </div>
    </main>
  )
}
