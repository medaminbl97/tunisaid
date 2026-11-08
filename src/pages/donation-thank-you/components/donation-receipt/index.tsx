import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { DonationReceipt as DonationReceiptData } from '#/api/collections/donations/schemas'
import { FactList } from '#/components/fact-list'
import { Button } from '#/components/ui/button'
import { formatContentDate } from '#/lib/dates'
import { formatDonationAmount } from '#/lib/donation'

type DonationReceiptProps = {
  receipt: DonationReceiptData
}

const retryable = ['failed', 'cancelled', 'expired']

export function DonationReceipt(props: DonationReceiptProps) {
  const { t, i18n } = useTranslation('donation')
  const language = i18n.resolvedLanguage ?? 'en'
  const { receipt } = props
  const date = receipt.paidAt ?? receipt.createdAt

  return (
    <section
      aria-labelledby="donation-receipt-title"
      className="mx-auto max-w-[42rem] space-y-8"
    >
      <div className="space-y-6 rounded-[28px] border border-brand-line bg-brand-white p-7 sm:p-9">
        <h2
          id="donation-receipt-title"
          className="font-display text-[28px] font-bold"
        >
          {t('thanks.receipt.title')}
        </h2>
        <FactList
          items={[
            { label: t('thanks.receipt.reference'), value: receipt.reference },
            {
              label: t('thanks.receipt.status'),
              value: (
                <span aria-live="polite">
                  {t(`thanks.statuses.${receipt.status}.name`)}
                </span>
              ),
            },
            ...(date
              ? [
                  {
                    label: t('thanks.receipt.date'),
                    value: formatContentDate(date, language),
                  },
                ]
              : []),
          ]}
        />
        <ul className="divide-y divide-brand-line">
          {receipt.items.map((item) => (
            <li
              key={item.id}
              className="flex items-baseline justify-between gap-4 py-3"
            >
              <span className="min-w-0">
                <span className="block font-bold">{item.title}</span>
                {item.kind === 'purpose' && (
                  <span className="block text-sm text-brand-ink-soft">
                    {t('shared.lineDetail', {
                      quantity: item.quantity,
                      amount: formatDonationAmount(item.unitCents, language),
                    })}
                  </span>
                )}
                {item.campaign && (
                  <Link
                    to="/campaigns/$slug"
                    params={{ slug: item.campaign.slug }}
                    className="mt-1 inline-block text-sm font-bold text-brand-lagoon-deep underline underline-offset-4"
                  >
                    {t('thanks.receipt.countsToward', {
                      title:
                        item.campaign.titles[language] ??
                        item.campaign.titles.en ??
                        item.campaign.slug,
                    })}
                  </Link>
                )}
              </span>
              <span className="font-bold">
                {formatDonationAmount(item.totalCents, language)}
              </span>
            </li>
          ))}
        </ul>
        <p className="flex items-baseline justify-between border-t-2 border-brand-ink pt-4 font-display text-xl font-bold">
          <span>{t('thanks.receipt.total')}</span>
          <span>{formatDonationAmount(receipt.totalCents, language)}</span>
        </p>
      </div>
      <div className="flex flex-col justify-center gap-4 sm:flex-row">
        {retryable.includes(receipt.status) ? (
          <Button asChild size="cta" shape="pill">
            <Link to="/donate/checkout">
              {t('thanks.retry')} <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        ) : (
          <Button asChild size="cta" shape="pill">
            <Link to="/what-we-do">
              {t('thanks.explore')} <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        )}
      </div>
      <p className="text-center text-sm">
        <Link
          to="/contact"
          className="font-bold text-brand-lagoon-deep underline underline-offset-4"
        >
          {t('shared.contact')}
        </Link>
      </p>
    </section>
  )
}
