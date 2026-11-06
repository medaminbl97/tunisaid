import { CircleAlert, HeartHandshake, Hourglass } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { DonationStatus } from '#/api/collections/donations/schemas'
import { IconChip } from '#/components/icon-chip'
import { SectionHeading } from '#/components/section-heading'

type GratitudeHeroProps = {
  status?: DonationStatus
  testMode?: boolean
}

const unsuccessful: DonationStatus[] = ['failed', 'cancelled', 'expired']

export function GratitudeHero(props: GratitudeHeroProps) {
  const { t } = useTranslation('donation')
  const status = props.status
  const Icon =
    status === 'pending'
      ? Hourglass
      : status && unsuccessful.includes(status)
        ? CircleAlert
        : HeartHandshake

  return (
    <section
      aria-labelledby="gratitude-title"
      className="flex flex-col items-center gap-8"
    >
      <IconChip tone="sun" className="size-24 text-brand-lagoon-deep">
        <Icon aria-hidden="true" className="size-8" />
      </IconChip>
      <SectionHeading
        id="gratitude-title"
        as="h1"
        eyebrow={t('thanks.eyebrow')}
        title={
          status ? t(`thanks.statuses.${status}.title`) : t('thanks.title')
        }
        description={
          status
            ? t(`thanks.statuses.${status}.description`)
            : t('thanks.description')
        }
        className="[&>p:first-child]:text-brand-lagoon-deep"
      />
      {!status && (
        <p className="max-w-[42rem] rounded-[24px] bg-brand-sun-soft p-6 text-center text-sm leading-relaxed">
          <strong className="mb-2 block">{t('checkout.noPayment')}</strong>
          {t('thanks.notice')}
        </p>
      )}
      {status && props.testMode && (
        <p className="rounded-full bg-brand-sun-soft px-4 py-2 text-sm font-bold">
          {t('thanks.testMode')}
        </p>
      )}
    </section>
  )
}
