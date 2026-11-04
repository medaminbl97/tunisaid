import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import arrowRight from '#/assets/images/arrow-right-white.svg'
import { GlassCard } from '#/components/glass-card'
import { SectionHeading } from '#/components/section-heading'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { siteContact } from '#/lib/site-contact'
import { cn } from '#/lib/utils'

const fields = [
  {
    name: 'firstName',
    type: 'text',
    autoComplete: 'given-name',
    required: true,
  },
  {
    name: 'lastName',
    type: 'text',
    autoComplete: 'family-name',
    required: false,
  },
  { name: 'email', type: 'email', autoComplete: 'email', required: true },
  { name: 'topic', type: 'text', autoComplete: 'off', required: false },
] as const

export function MessageForm() {
  const { t } = useTranslation()
  const id = useId()
  const titleId = `${id}-title`
  const unavailableId = `${id}-unavailable`
  const privacyId = `${id}-privacy`

  return (
    <GlassCard
      variant="solid"
      className="min-w-0 space-y-6 rounded-[40px] border-0 p-6 sm:p-10 lg:px-14 lg:py-12"
    >
      <SectionHeading
        id={titleId}
        align="left"
        size="compact"
        eyebrow={t('contact.form.eyebrow')}
        title={t('contact.form.title')}
        description={t('contact.form.description')}
        className="[&>h2]:sm:text-[40px] [&>p:last-child]:text-base"
      />
      <p
        id={unavailableId}
        className="rounded-[20px] bg-brand-sun-soft p-5 text-sm leading-relaxed text-brand-ink"
      >
        {t('contact.form.unavailable')}{' '}
        <a
          href={`mailto:${siteContact.email}`}
          className="font-bold break-words underline underline-offset-4 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-brand-lagoon-deep"
        >
          {siteContact.email}
        </a>
      </p>
      <form
        aria-labelledby={titleId}
        aria-describedby={`${unavailableId} ${privacyId}`}
        onSubmit={(event) => event.preventDefault()}
      >
        <fieldset disabled className="min-w-0 space-y-6">
          <legend className="sr-only">{t('contact.form.title')}</legend>
          <div className="grid gap-6 sm:grid-cols-2">
            {fields.map((field) => {
              const fieldId = `${id}-${field.name}`

              return (
                <div
                  key={field.name}
                  className={cn(
                    'min-w-0 space-y-2.5',
                    (field.name === 'email' || field.name === 'topic') &&
                      'sm:col-span-2',
                  )}
                >
                  <Label htmlFor={fieldId} className="font-bold text-brand-ink">
                    {t(`contact.form.fields.${field.name}.label`)}
                    {field.required && <span aria-hidden="true"> *</span>}
                  </Label>
                  <Input
                    id={fieldId}
                    name={field.name}
                    type={field.type}
                    autoComplete={field.autoComplete}
                    required={field.required}
                    variant="brand"
                    placeholder={t(
                      `contact.form.fields.${field.name}.placeholder`,
                    )}
                  />
                </div>
              )
            })}
          </div>
          <div className="space-y-2.5">
            <Label
              htmlFor={`${id}-message`}
              className="font-bold text-brand-ink"
            >
              {t('contact.form.fields.message.label')}
              <span aria-hidden="true"> *</span>
            </Label>
            <Textarea
              id={`${id}-message`}
              name="message"
              required
              variant="brand"
              rows={5}
              placeholder={t('contact.form.fields.message.placeholder')}
            />
          </div>
          <p
            id={privacyId}
            className="text-xs leading-relaxed text-brand-ink-soft"
          >
            {t('contact.form.privacy')}
          </p>
          <Button
            type="submit"
            disabled
            aria-describedby={unavailableId}
            size="cta"
            shape="pill"
          >
            {t('contact.form.submit')}
            <img src={arrowRight} alt="" width={18} height={18} />
          </Button>
        </fieldset>
      </form>
    </GlassCard>
  )
}
