import { Link } from '@tanstack/react-router'
import { HeartHandshake, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'
import { Button } from '#/components/ui/button'

export function DonationLayout(props: { children: ReactNode }) {
  const { t, i18n } = useTranslation('donation')

  return (
    <div className="flex min-h-screen flex-col bg-brand-cream text-brand-ink">
      <header className="mx-auto flex w-full max-w-[75rem] flex-wrap items-center justify-between gap-5 px-6 py-8 sm:px-10 xl:px-0">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-brand-lagoon-deep"
        >
          <HeartHandshake
            aria-hidden="true"
            className="size-7 text-brand-lagoon-deep"
          />
          <span className="font-display text-[28px] font-bold">TunisAid</span>
          <span className="sr-only">{t('shared.home')}</span>
        </Link>
        <div className="flex flex-wrap items-center gap-5">
          <p className="flex items-center gap-3 text-sm font-bold">
            <ShieldCheck
              aria-hidden="true"
              className="size-6 text-brand-lagoon-deep"
            />
            {t('shared.layoutHint')}
          </p>
          <div
            role="group"
            aria-label={t('shared.language')}
            className="flex gap-1"
          >
            {(['en', 'de'] as const).map((language) => (
              <Button
                key={language}
                variant="ghost"
                aria-label={t(`shared.languages.${language}`)}
                aria-pressed={i18n.resolvedLanguage === language}
                onClick={() => {
                  void i18n.changeLanguage(language)
                }}
              >
                {language.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
      </header>
      <div className="grow">{props.children}</div>
      <footer className="border-t border-brand-line">
        <div className="mx-auto flex max-w-[75rem] flex-wrap justify-between gap-4 px-6 py-8 text-sm text-brand-ink-soft sm:px-10 xl:px-0">
          <p>{t('shared.footer')}</p>
          <Link
            to="/contact"
            className="font-bold text-brand-lagoon-deep underline-offset-4 hover:underline"
          >
            {t('shared.contact')}
          </Link>
        </div>
      </footer>
    </div>
  )
}
