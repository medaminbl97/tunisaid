import { useTranslation } from 'react-i18next'
import { SectionHeading } from '#/components/section-heading'
import { MockPaymentPanel } from './components/mock-payment-panel'

type DonationMockPaymentPageProps = {
  attempt: string
  token: string
}

export function DonationMockPaymentPage(props: DonationMockPaymentPageProps) {
  const { t } = useTranslation('donation', { keyPrefix: 'mockPayment' })

  return (
    <main className="mx-auto max-w-[42rem] space-y-10 px-6 py-12 sm:px-10 lg:py-20">
      <SectionHeading
        id="mock-payment-title"
        as="h1"
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
        className="[&>p:first-child]:text-brand-lagoon-deep"
      />
      <MockPaymentPanel attempt={props.attempt} token={props.token} />
    </main>
  )
}
