import { createFileRoute } from '@tanstack/react-router'
import { DonationCheckoutPage } from '#/pages/donation-checkout'

export const Route = createFileRoute('/donate_/checkout')({
  component: DonationCheckoutPage,
})
