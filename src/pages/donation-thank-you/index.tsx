import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  donationAvailabilityQueryOptions,
  donationKeys,
  donationReceiptQueryOptions,
} from '#/api/collections/donations/queries'
import { donationStatusLookupSchema } from '#/api/collections/donations/schemas'
import { useDonationBasket } from '#/components/donation-provider'
import { Button } from '#/components/ui/button'
import { DonationReceipt } from './components/donation-receipt'
import { GiftRecap } from './components/gift-recap'
import { GratitudeHero } from './components/gratitude-hero'

type DonationThankYouPageProps = {
  reference?: string
  token?: string
}

const pageClassName =
  'mx-auto max-w-[60rem] space-y-10 px-6 py-12 sm:px-10 lg:py-20'

export function DonationThankYouPage(props: DonationThankYouPageProps) {
  const lookup = donationStatusLookupSchema.safeParse(props)

  if (!props.reference && !props.token) {
    return (
      <main className={pageClassName}>
        <GratitudeHero />
        <GiftRecap />
      </main>
    )
  }

  return (
    <main className={pageClassName}>
      <DonationStatus
        reference={lookup.success ? lookup.data.reference : ''}
        token={lookup.success ? lookup.data.token : ''}
        valid={lookup.success}
      />
    </main>
  )
}

function DonationStatus(props: {
  reference: string
  token: string
  valid: boolean
}) {
  const { t } = useTranslation('donation', { keyPrefix: 'thanks' })
  const { clearBasket } = useDonationBasket()
  const queryClient = useQueryClient()
  const availability = useQuery(donationAvailabilityQueryOptions())
  const receipt = useQuery({
    ...donationReceiptQueryOptions(props.reference, props.token),
    enabled: props.valid,
  })
  const status = receipt.data?.status
  const paid = status === 'paid'

  useEffect(() => {
    if (!paid) return
    clearBasket()
    void queryClient.invalidateQueries({
      queryKey: donationKeys.campaignRaisedAll(),
    })
  }, [paid, clearBasket, queryClient])

  if (props.valid && receipt.isPending) {
    return (
      <p role="status" className="text-center text-brand-ink-soft">
        {t('loading')}
      </p>
    )
  }

  if (receipt.isError) {
    return (
      <div className="space-y-5 text-center">
        <p role="alert" className="font-bold">
          {t('error')}
        </p>
        <Button
          type="button"
          shape="pill"
          size="cta"
          onClick={() => void receipt.refetch()}
        >
          {t('retry')}
        </Button>
      </div>
    )
  }

  if (!receipt.data) {
    return (
      <p
        role="alert"
        className="mx-auto max-w-[42rem] rounded-[24px] bg-brand-sun-soft p-6 text-center font-bold"
      >
        {t('notFound')}
      </p>
    )
  }

  return (
    <>
      <GratitudeHero
        status={receipt.data.status}
        testMode={availability.data?.provider === 'mock'}
      />
      <DonationReceipt receipt={receipt.data} />
    </>
  )
}
