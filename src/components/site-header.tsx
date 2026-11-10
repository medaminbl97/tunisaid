import { Link } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SiteLogo } from '#/components/site-logo'
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

type LanguageSwitchProps = {
  className?: string
}

function LanguageSwitch(props: LanguageSwitchProps) {
  const { t, i18n } = useTranslation('common', { keyPrefix: 'siteHeader' })

  return (
    <div
      role="group"
      aria-label={t('languageLabel')}
      className={cn(
        'flex items-center rounded-full border-[1.5px] border-brand-header-chip-border bg-brand-header-chip px-0.5',
        props.className,
      )}
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
  )
}

export function SiteHeader() {
  const { t } = useTranslation('common', { keyPrefix: 'siteHeader' })
  const navigationId = useId()
  const reduceMotion = useReducedMotion()
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuId = useId()
  const expanded = hovered || focused
  const transition = reduceMotion ? { duration: 0 } : headerSpring

  useEffect(() => {
    if (!menuOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])

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
        <div className="flex h-full items-center justify-between gap-2 px-2.5 sm:px-6 xl:gap-6 xl:pr-5">
          <Link
            to="/"
            aria-label={t('homeLabel')}
            onClick={() => setMenuOpen(false)}
            className="group flex min-w-0 items-center gap-3 rounded-full text-brand-header-foreground no-underline outline-none hover:text-brand-header-foreground focus-visible:ring-2 focus-visible:ring-ring xl:shrink-0"
          >
            <SiteLogo className="xl:hidden" />
            <span className="hidden items-center gap-3 xl:flex">
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
                className="flex size-(--brand-header-logo-size) shrink-0"
              >
                <SiteLogo className="size-full" />
              </motion.span>
              <span className="flex min-w-0 flex-col">
                <span className="font-display text-[26px] leading-[1.1] font-bold">
                  TunisAid
                </span>
                <span className="text-[11px] leading-[1.3] font-semibold text-brand-header-muted">
                  {t('tagline')}
                </span>
              </span>
            </span>
          </Link>

          <nav
            aria-label={t('navigationLabel')}
            className="hidden min-w-0 items-center gap-1.5 px-1 py-1 xl:flex"
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

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <LanguageSwitch className="hidden sm:flex" />
            <Button
              asChild
              shape="pill"
              size="lg"
              className="min-h-11 px-4 text-[15px] font-bold sm:px-7 xl:min-h-[45px]"
            >
              <Link to="/donate" onClick={() => setMenuOpen(false)}>
                {t('navigation.donate')}
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              shape="pill"
              aria-label={menuOpen ? t('menu.close') : t('menu.open')}
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen((open) => !open)}
              className="size-11 cursor-pointer border-[1.5px] border-brand-header-chip-border bg-brand-header-chip text-brand-header-foreground hover:bg-brand-header-active xl:hidden"
            >
              <AnimatePresence initial={false} mode="wait">
                <motion.span
                  key={menuOpen ? 'close' : 'open'}
                  initial={reduceMotion ? false : { opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, rotate: 90 }}
                  transition={{ duration: reduceMotion ? 0 : 0.15 }}
                  className="flex"
                >
                  {menuOpen ? (
                    <X className="size-5" aria-hidden="true" />
                  ) : (
                    <Menu className="size-5" aria-hidden="true" />
                  )}
                </motion.span>
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </motion.header>
      <AnimatePresence>
        {menuOpen && (
          <>
            <div
              aria-hidden="true"
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-40 xl:hidden"
            />
            <motion.div
              id={menuId}
              initial={
                reduceMotion ? false : { opacity: 0, y: -8, scale: 0.98 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                reduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.98 }
              }
              transition={transition}
              className="fixed inset-x-4 top-[calc(var(--brand-header-offset)+var(--brand-header-height)+0.5rem)] z-50 mx-auto flex max-w-md origin-top flex-col gap-3 rounded-3xl border-[1.5px] border-brand-header-border bg-brand-header-glass p-3 shadow-header backdrop-blur-[14px] xl:hidden"
            >
              <nav aria-label={t('navigationLabel')}>
                <ul className="flex flex-col gap-1">
                  {navigationItems.map((item, index) => (
                    <motion.li
                      key={item.key}
                      initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        ...transition,
                        delay: reduceMotion ? 0 : 0.04 * index,
                      }}
                    >
                      <Link
                        to={item.route}
                        activeOptions={{ exact: true }}
                        onClick={() => setMenuOpen(false)}
                        className="flex min-h-12 items-center rounded-2xl px-4 text-base font-semibold text-brand-header-foreground no-underline outline-none transition-colors hover:bg-brand-header-chip hover:text-brand-header-accent focus-visible:ring-2 focus-visible:ring-ring data-[status=active]:border data-[status=active]:border-brand-header-chip-border data-[status=active]:bg-brand-header-active data-[status=active]:text-brand-header-accent"
                      >
                        {t(`navigation.${item.key}`)}
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </nav>
              <LanguageSwitch className="self-start sm:hidden" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
