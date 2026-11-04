import { Link } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import logo from '#/assets/images/tunisaid-logo-scaled.png'
import { Button } from '#/components/ui/button'

const navigationItems = [
  { key: 'home', route: '/' },
  { key: 'about', route: '/about' },
  { key: 'whatWeDo', route: '/what-we-do' },
  { key: 'contact', route: '/contact' },
] as const

const navLinkClassName =
  'inline-flex min-h-11 shrink-0 items-center rounded-md px-2 text-xs font-semibold tracking-wide whitespace-nowrap text-brand-header-foreground uppercase no-underline outline-none transition-colors hover:text-brand-header-accent focus-visible:ring-2 focus-visible:ring-ring data-[status=active]:text-brand-header-accent sm:px-3 sm:text-sm'

const headerSpring = {
  type: 'spring',
  stiffness: 260,
  damping: 28,
  mass: 0.8,
} as const

export function SiteHeader() {
  const { t } = useTranslation('common', { keyPrefix: 'siteHeader' })
  const reduceMotion = useReducedMotion()
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const expanded = hovered || focused
  const transition = reduceMotion ? { duration: 0 } : headerSpring
  const logoSize = expanded
    ? 'var(--brand-header-logo-expanded-size)'
    : 'var(--brand-header-logo-size)'

  return (
    <div className="h-(--brand-header-height)">
      <motion.header
        initial={false}
        animate={{
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
        className="fixed inset-x-0 top-0 z-50 h-(--brand-header-height) border-b border-brand-header-border bg-brand-header-glass shadow-header backdrop-blur-xl backdrop-saturate-150"
      >
        <div className="mx-auto grid h-full max-w-site grid-cols-[auto_1fr_auto] grid-rows-[minmax(0,1fr)_4rem] items-center gap-x-4 px-4 sm:px-6 lg:flex lg:gap-8 lg:px-8">
          <Link
            to="/"
            aria-label={t('homeLabel')}
            className="col-start-1 row-start-1 shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <motion.img
              initial={false}
              animate={{ width: logoSize, height: logoSize }}
              transition={transition}
              src={logo}
              alt={t('logoAlt')}
              className="size-(--brand-header-logo-size) object-contain"
            />
          </Link>

          <nav
            aria-label={t('navigationLabel')}
            className="col-span-3 row-start-2 -mx-2 flex min-w-0 items-center gap-1 overflow-x-auto px-2 py-2 lg:mx-0 lg:ml-auto lg:gap-2 lg:overflow-visible lg:px-0"
          >
            {navigationItems.map((item) => (
              <Link
                key={item.key}
                to={item.route}
                activeOptions={{ exact: true, includeHash: true }}
                className={navLinkClassName}
              >
                {t(`navigation.${item.key}`)}
              </Link>
            ))}
          </nav>

          <Button
            className="col-start-3 row-start-1 min-h-11 cursor-pointer text-xs font-bold tracking-wide uppercase"
            size="lg"
          >
            {t('navigation.donate')}
          </Button>
        </div>
      </motion.header>
    </div>
  )
}
