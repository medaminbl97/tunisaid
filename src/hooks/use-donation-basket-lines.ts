import { useDonationBasket } from '#/components/donation-provider'
import { useDonationPurposes } from '#/hooks/use-donation-purposes'

// Basket lines in catalog order, titled from the published purposes.
export function useDonationBasketLines() {
  const { basket } = useDonationBasket()
  const { data: purposes = [] } = useDonationPurposes()
  const order = new Map(purposes.map((purpose, index) => [purpose.slug, index]))
  return Object.entries(basket.items)
    .flatMap(([slug, item]) => (item ? [{ slug, ...item }] : []))
    .sort(
      (a, b) =>
        (order.get(a.slug) ?? order.size) - (order.get(b.slug) ?? order.size),
    )
    .map((item) => ({
      ...item,
      title:
        purposes.find((purpose) => purpose.slug === item.slug)?.basketTitle ??
        item.slug,
    }))
}
