import { useId, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FlaskConical } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { donationPurposesQueryOptions } from '#/api/collections/donation-purposes/queries'
import { donationPurposeLanguageSchema } from '#/api/collections/donation-purposes/schemas'
import { createCheckout } from '#/api/collections/donations/functions'
import { donationAvailabilityQueryOptions } from '#/api/collections/donations/queries'
import { donorInputSchema } from '#/api/collections/donations/schemas'
import type { CheckoutErrorCode } from '#/api/collections/donations/schemas'
import { useDonationBasket } from '#/components/donation-provider'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { NativeSelect, NativeSelectOption } from '#/components/ui/native-select'
import { countryOptions } from '#/lib/countries'
import { donationTotal } from '#/lib/donation'

type FormError = CheckoutErrorCode | 'email'

const emailSchema = donorInputSchema.shape.email

export function CheckoutForm() {
  const { t, i18n } = useTranslation('donation')
  const id = useId()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { basket, setQuantity } = useDonationBasket()
  const language = donationPurposeLanguageSchema
    .catch('en')
    .parse(i18n.resolvedLanguage)
  const availability = useQuery(donationAvailabilityQueryOptions())
  const countries = useMemo(() => countryOptions(language), [language])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [country, setCountry] = useState('')
  const [keepNamePrivate, setKeepNamePrivate] = useState(true)
  const [error, setError] = useState<FormError | null>(null)

  const total = donationTotal(basket)
  const enabled = availability.data?.enabled === true
  const noticeId = `${id}-notice`
  const errorId = `${id}-error`

  async function refreshPrices() {
    const purposes = await queryClient.fetchQuery({
      ...donationPurposesQueryOptions(language),
      staleTime: 0,
    })
    for (const [slug, item] of Object.entries(basket.items)) {
      if (!item) continue
      const purpose = purposes.find((entry) => entry.slug === slug)
      setQuantity(
        slug,
        purpose?.unitAmountCents ?? item.unitCents,
        purpose ? item.quantity : 0,
      )
    }
  }

  const checkout = useMutation({
    mutationFn: () =>
      createCheckout({
        data: {
          language,
          items: Object.entries(basket.items).flatMap(([slug, item]) =>
            item
              ? [{ slug, quantity: item.quantity, unitCents: item.unitCents }]
              : [],
          ),
          flexibleCents: basket.flexibleCents,
          expectedTotalCents: total,
          donor: { name, email, countryCode: country, keepNamePrivate },
        },
      }),
    onSuccess: async (result) => {
      if (result.ok) {
        await router.navigate({ href: result.redirectUrl })
        return
      }
      setError(result.code)
      if (result.code === 'catalog_changed') await refreshPrices()
    },
    onError: () => setError('failed'),
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (!emailSchema.safeParse(email).success) {
      setError('email')
      return
    }
    if (total < 100) {
      setError('invalid_amount')
      return
    }
    checkout.mutate()
  }

  return (
    <section aria-labelledby={`${id}-details`} className="min-w-0 space-y-8">
      {availability.isSuccess && !enabled && (
        <div
          id={noticeId}
          className="space-y-3 rounded-[24px] bg-brand-sun-soft p-6 text-sm leading-relaxed"
        >
          <p className="font-bold">{t('checkout.unavailableTitle')}</p>
          <p>{t('shared.unavailable')}</p>
          <Link
            to="/contact"
            className="inline-block font-bold text-brand-lagoon-deep underline underline-offset-4"
          >
            {t('shared.contact')}
          </Link>
        </div>
      )}
      <form
        noValidate
        aria-describedby={enabled ? undefined : noticeId}
        onSubmit={submit}
      >
        <fieldset
          disabled={!enabled || checkout.isPending}
          className="min-w-0 space-y-7"
        >
          <legend
            id={`${id}-details`}
            className="mb-5 font-display text-[32px] font-bold"
          >
            {t('checkout.detailsTitle')}
          </legend>
          <p className="text-sm leading-relaxed text-brand-ink-soft">
            {t('checkout.detailsHint')}
          </p>
          <div className="space-y-2.5">
            <Label htmlFor={`${id}-name`} className="font-bold text-brand-ink">
              {t('checkout.fields.name.label')}
              <span className="font-normal text-brand-ink-soft">
                {t('checkout.optional')}
              </span>
            </Label>
            <Input
              id={`${id}-name`}
              variant="brand"
              autoComplete="name"
              maxLength={120}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t('checkout.fields.name.placeholder')}
            />
          </div>
          <div className="space-y-2.5">
            <Label htmlFor={`${id}-email`} className="font-bold text-brand-ink">
              {t('checkout.fields.email.label')}
              <span className="font-normal text-brand-ink-soft">
                {t('checkout.optional')}
              </span>
            </Label>
            <Input
              id={`${id}-email`}
              type="email"
              variant="brand"
              autoComplete="email"
              maxLength={254}
              value={email}
              aria-invalid={error === 'email'}
              aria-describedby={`${id}-email-hint${error === 'email' ? ` ${errorId}` : ''}`}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t('checkout.fields.email.placeholder')}
            />
            <p id={`${id}-email-hint`} className="text-xs text-brand-ink-soft">
              {t('checkout.emailHint')}
            </p>
          </div>
          <div className="space-y-2.5">
            <Label
              htmlFor={`${id}-country`}
              className="font-bold text-brand-ink"
            >
              {t('checkout.fields.country.label')}
              <span className="font-normal text-brand-ink-soft">
                {t('checkout.optional')}
              </span>
            </Label>
            <NativeSelect
              id={`${id}-country`}
              size="brand"
              autoComplete="country"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
            >
              <NativeSelectOption value="">
                {t('checkout.fields.country.placeholder')}
              </NativeSelectOption>
              {countries.map((option) => (
                <NativeSelectOption key={option.code} value={option.code}>
                  {option.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-3">
            <Label
              htmlFor={`${id}-private`}
              className="font-bold text-brand-ink"
            >
              <Input
                id={`${id}-private`}
                type="checkbox"
                className="size-4"
                checked={keepNamePrivate}
                onChange={(event) => setKeepNamePrivate(event.target.checked)}
              />
              {t('checkout.private')}
            </Label>
            <p className="text-xs text-brand-ink-soft">
              {t('checkout.privateHint')}
            </p>
          </div>
        </fieldset>
        <div className="mt-10 space-y-6 border-t border-brand-line pt-8">
          <h2 className="font-display text-[32px] font-bold">
            {t('checkout.paymentTitle')}
          </h2>
          {availability.data?.provider === 'mock' && (
            <div className="flex gap-4 rounded-[24px] border border-brand-line bg-brand-white p-6 text-sm leading-relaxed">
              <FlaskConical
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-brand-lagoon-deep"
              />
              <p>
                <strong className="block">{t('checkout.testModeTitle')}</strong>
                {t('checkout.testMode')}
              </p>
            </div>
          )}
          <p className="text-xs leading-relaxed text-brand-ink-soft">
            {t('checkout.policyHint')}
          </p>
          {total === 0 && enabled && (
            <p className="text-sm text-brand-ink-soft">
              {t('checkout.emptyBasket')}
            </p>
          )}
          {error && (
            <p
              id={errorId}
              role="alert"
              className="rounded-[18px] bg-brand-terracotta-soft p-4 text-sm font-bold text-brand-ink"
            >
              {t(`checkout.errors.${error}`)}
            </p>
          )}
          <Button
            type="submit"
            disabled={!enabled || total === 0 || checkout.isPending}
            aria-describedby={enabled ? undefined : noticeId}
            size="cta"
            shape="pill"
            className="w-full whitespace-normal"
          >
            {!availability.isSuccess || enabled
              ? checkout.isPending
                ? t('checkout.submitting')
                : t('checkout.submit')
              : t('checkout.unavailableTitle')}
          </Button>
        </div>
      </form>
    </section>
  )
}
