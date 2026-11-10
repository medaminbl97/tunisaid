import { Link } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { SiteLogo } from '#/components/site-logo'
import { Button } from '#/components/ui/button'
import { siteContact } from '#/lib/site-contact'

const navigationItems = [
  { key: 'home', route: '/' },
  { key: 'about', route: '/about' },
  { key: 'whatWeDo', route: '/what-we-do' },
  { key: 'contact', route: '/contact' },
] as const

const socialNames = ['Facebook', 'LinkedIn', 'Instagram'] as const

export function SiteFooter() {
  const { t } = useTranslation('common')
  const reduceMotion = useReducedMotion()

  return (
    <div className="bg-brand-cream">
      <motion.footer
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: reduceMotion ? 0 : 0.6 }}
        className="rounded-t-[48px] bg-brand-footer px-6 pt-16 pb-10 text-brand-white sm:px-10 lg:pt-20"
      >
        <div className="mx-auto flex max-w-[75rem] flex-col gap-14">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[minmax(0,420px)_auto_auto] lg:justify-between lg:gap-12">
            <div className="flex min-w-0 flex-col items-start gap-5">
              <Link
                to="/"
                aria-label={t('siteHeader.homeLabel')}
                className="flex items-center gap-3 rounded-full text-brand-white no-underline outline-none hover:text-brand-sun focus-visible:ring-2 focus-visible:ring-brand-sun"
              >
                <SiteLogo className="size-14" />
                <span className="font-display text-[28px] leading-[1.1] font-bold">
                  TunisAid
                </span>
              </Link>
              <address className="text-[15px] leading-[1.65] text-brand-footer-muted not-italic">
                {t('siteHeader.tagline')}
                <br />
                {siteContact.address}
              </address>
            </div>
            <nav aria-label={t('siteFooter.explore')}>
              <h2 className="mb-4 text-xs leading-none font-extrabold text-brand-sun uppercase">
                {t('siteFooter.explore')}
              </h2>
              <ul className="flex flex-col items-start gap-4">
                {navigationItems.map((item) => (
                  <li key={item.key}>
                    <Link
                      to={item.route}
                      className="rounded-sm text-[15px] leading-none font-medium text-brand-footer-link no-underline outline-none hover:text-brand-sun focus-visible:ring-2 focus-visible:ring-brand-sun"
                    >
                      {t(`siteHeader.navigation.${item.key}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="min-w-0 md:col-span-2 lg:col-span-1">
              <h2 className="mb-4 text-xs leading-none font-extrabold text-brand-sun uppercase">
                {t('siteFooter.follow')}
              </h2>
              <div className="flex flex-wrap gap-2.5">
                {socialNames.map((name) => (
                  <Button
                    key={name}
                    disabled
                    variant="footerOutline"
                    shape="pill"
                    aria-label={t('siteFooter.socialPlaceholder', { name })}
                    title={t('siteFooter.socialPlaceholder', { name })}
                    className="h-auto px-4 py-2.5 text-[13px] leading-none font-semibold disabled:opacity-70"
                  >
                    {name}
                  </Button>
                ))}
              </div>
              <p className="mt-3 max-w-xs text-xs leading-normal text-brand-footer-muted">
                {t('siteFooter.socialNotice')}
              </p>
            </div>
          </div>
          <div className="h-px bg-brand-footer-divider" />
          <p className="text-sm leading-normal text-brand-footer-copyright">
            {t('siteFooter.copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </motion.footer>
    </div>
  )
}
