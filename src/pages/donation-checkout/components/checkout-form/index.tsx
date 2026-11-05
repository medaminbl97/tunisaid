import { useId } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { FilterGroup } from '#/components/filter-group'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'

const personalFields = [
  { key: 'name', type: 'text' },
  { key: 'email', type: 'email' },
  { key: 'country', type: 'text' },
] as const
const cardFields = ['number', 'expiry', 'security', 'cardName'] as const
const paymentMethods = ['card', 'paypal', 'bank'] as const

export function CheckoutForm() {
  const { t } = useTranslation('donation')
  const id = useId()
  const noticeId = `${id}-unavailable`

  return (
    <section aria-labelledby={`${id}-details`} className="min-w-0 space-y-8">
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
      <form
        aria-describedby={noticeId}
        onSubmit={(event) => event.preventDefault()}
      >
        <fieldset disabled className="min-w-0 space-y-7">
          <legend
            id={`${id}-details`}
            className="mb-5 font-display text-[32px] font-bold"
          >
            {t('checkout.detailsTitle')}
          </legend>
          <p className="text-sm leading-relaxed text-brand-ink-soft">
            {t('checkout.detailsHint')}
          </p>
          {personalFields.map((field) => (
            <div key={field.key} className="space-y-2.5">
              <Label
                htmlFor={`${id}-${field.key}`}
                className="font-bold text-brand-ink"
              >
                {t(`checkout.fields.${field.key}.label`)}
              </Label>
              <Input
                id={`${id}-${field.key}`}
                type={field.type}
                variant="brand"
                autoComplete="off"
                placeholder={t(`checkout.fields.${field.key}.placeholder`)}
              />
            </div>
          ))}
          <div className="space-y-3">
            <Label
              htmlFor={`${id}-private`}
              className="font-bold text-brand-ink"
            >
              <Input id={`${id}-private`} type="checkbox" className="size-4" />
              {t('checkout.private')}
            </Label>
            <p className="text-xs text-brand-ink-soft">
              {t('checkout.privateHint')}
            </p>
          </div>
        </fieldset>
        <fieldset
          disabled
          className="mt-10 min-w-0 space-y-6 border-t border-brand-line pt-8"
        >
          <legend className="float-left mb-6 w-full font-display text-[32px] font-bold">
            {t('checkout.paymentTitle')}
          </legend>
          <p className="clear-both text-sm font-bold">
            {t('checkout.paymentMethod')}
          </p>
          <FilterGroup
            label={t('checkout.paymentMethod')}
            value="card"
            options={paymentMethods.map((value) => ({
              value,
              label: t(`checkout.methods.${value}`),
            }))}
            onChange={() => {}}
          />
          <div className="space-y-6 rounded-[24px] border border-brand-line bg-brand-white p-6">
            <p className="text-xs font-bold uppercase">
              {t('checkout.cardHeading')}
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              {cardFields.map((field) => (
                <div
                  key={field}
                  className={
                    field === 'number' || field === 'cardName'
                      ? 'space-y-2.5 sm:col-span-2'
                      : 'space-y-2.5'
                  }
                >
                  <Label
                    htmlFor={`${id}-${field}`}
                    className="font-bold text-brand-ink"
                  >
                    {t(`checkout.fields.${field}.label`)}
                  </Label>
                  <Input
                    id={`${id}-${field}`}
                    variant="brand"
                    autoComplete="off"
                    placeholder={t(`checkout.fields.${field}.placeholder`)}
                  />
                </div>
              ))}
            </div>
            <p className="text-xs leading-relaxed text-brand-ink-soft">
              {t('checkout.hostedHint')}
            </p>
          </div>
        </fieldset>
        <div className="mt-8 space-y-5">
          <p className="text-xs leading-relaxed text-brand-ink-soft">
            {t('checkout.policyHint')}
          </p>
          <Button
            type="submit"
            disabled
            aria-describedby={noticeId}
            size="cta"
            shape="pill"
            className="w-full whitespace-normal"
          >
            {t('checkout.unavailableTitle')}
          </Button>
          <p className="text-sm font-bold text-brand-lagoon-deep">
            {t('checkout.noPayment')}
          </p>
        </div>
      </form>
    </section>
  )
}
