import { Link } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'motion/react'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import logoMark from '#/assets/images/tunisaid-heart-handshake.svg'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

const navigationItems = [
  { key: 'home', route: '/' },
  { key: 'about', route: '/about' },
  { key: 'whatWeDo', route: '/what-we-do' },
  { key: 'contact', route: '/contact' },
] as const

const headerSpring = {
  type: 'spring',
  stiffness: 260,
  damping: 28,
  mass: 0.8,
} as const

export function SiteHeader() {
  const { t, i18n } = useTranslation('common', { keyPrefix: 'siteHeader' })
  const navigationId = useId()
  const reduceMotion = useReducedMotion()
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const expanded = hovered || focused
  const transition = reduceMotion ? { duration: 0 } : headerSpring
  return (
    <div className="h-[calc(var(--brand-header-height)+var(--brand-header-offset)+1rem)]">
      <motion.header
        initial={reduceMotion ? false : { opacity: 0, y: -12 }}
        animate={{
          opacity: 1,
          y: 0,
          height: expanded
            ? 'var(--brand-header-expanded-height)'
            : 'var(--brand-header-height)',
        }}
        transition={transition}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setFocused(false)
          }
        }}
        className="fixed inset-x-4 top-(--brand-header-offset) z-50 mx-auto h-(--brand-header-height) max-w-(--brand-header-width) rounded-(--brand-header-radius) border-[1.5px] border-brand-header-border bg-brand-header-glass shadow-header backdrop-blur-[14px]"
      >
        <div className="grid h-full grid-cols-[minmax(0,1fr)_auto] grid-rows-[minmax(0,1fr)_3.5rem] items-center gap-x-2 px-3 sm:px-6 xl:flex xl:justify-between xl:gap-6 xl:pr-5">
          <Link
            to="/"
            aria-label={t('homeLabel')}
            className="group col-start-1 row-start-1 flex min-w-0 items-center gap-3 rounded-full text-brand-header-foreground no-underline outline-none hover:text-brand-header-foreground focus-visible:ring-2 focus-visible:ring-ring xl:shrink-0"
          >
            <motion.span
              initial={false}
              animate={{
                width: expanded
                  ? 'var(--brand-header-logo-expanded-size)'
                  : 'var(--brand-header-logo-size)',
                height: expanded
                  ? 'var(--brand-header-logo-expanded-size)'
                  : 'var(--brand-header-logo-size)',
              }}
              transition={transition}
              className="flex size-(--brand-header-logo-size) shrink-0 items-center justify-center rounded-full bg-primary"
            >
              <img src={logoMark} alt="" width={28} height={28} />
            </motion.span>
            <span className="hidden min-w-0 flex-col min-[480px]:flex">
              <span className="font-display text-[26px] leading-[1.1] font-bold">
                TunisAid
              </span>
              <span className="hidden text-[11px] leading-[1.3] font-semibold text-brand-header-muted sm:block">
                {t('tagline')}
              </span>
            </span>
          </Link>

          <nav
            aria-label={t('navigationLabel')}
            className="col-span-2 row-start-2 flex min-w-0 items-center gap-1.5 overflow-x-auto px-1 py-1 xl:overflow-visible"
          >
            {navigationItems.map((item) => (
              <Link
                key={item.key}
                to={item.route}
                activeOptions={{ exact: true }}
                className="relative inline-flex min-h-11 shrink-0 items-center justify-center rounded-full px-[18px] text-[15px] leading-none font-semibold whitespace-nowrap text-brand-header-foreground no-underline outline-none transition-colors hover:bg-brand-header-chip hover:text-brand-header-accent focus-visible:ring-2 focus-visible:ring-ring data-[status=active]:text-brand-header-accent"
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        aria-hidden="true"
                        layoutId={`${navigationId}-active`}
                        transition={transition}
                        className="pointer-events-none absolute inset-x-0 inset-y-1 rounded-full border border-brand-header-chip-border bg-brand-header-active"
                      />
                    )}
                    <span className="relative">
                      {t(`navigation.${item.key}`)}
                    </span>
                  </>
                )}
              </Link>
            ))}
          </nav>

          <div className="col-start-2 row-start-1 flex shrink-0 items-center gap-2 sm:gap-4">
            <div
              role="group"
              aria-label={t('languageLabel')}
              className="flex items-center rounded-full border-[1.5px] border-brand-header-chip-border bg-brand-header-chip px-0.5"
            >
              {(['en', 'de'] as const).map((language) => {
                const active = i18n.resolvedLanguage === language

                return (
                  <Button
                    key={language}
                    type="button"
                    variant="ghost"
                    shape="pill"
                    size="sm"
                    aria-label={t(`languages.${language}`)}
                    aria-pressed={active}
                    onClick={() => {
                      void i18n.changeLanguage(language)
                    }}
                    className={cn(
                      'min-h-11 min-w-11 cursor-pointer px-2 text-[13px] text-brand-header-muted hover:bg-brand-header-active hover:text-brand-header-foreground',
                      active && 'font-extrabold text-brand-header-foreground',
                    )}
                  >
                    {language.toUpperCase()}
                  </Button>
                )
              })}
            </div>
            <Button
              asChild
              shape="pill"
              size="lg"
              className="min-h-[45px] px-4 text-[15px] font-bold sm:px-7"
            >
              <Link to="/donate">{t('navigation.donate')}</Link>
            </Button>
          </div>
        </div>
      </motion.header>
    </div>
  )
}
