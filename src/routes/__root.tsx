import {
  HeadContent,
  Scripts,
  createRootRoute,
  useRouterState,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { useTranslation } from 'react-i18next'

import { SiteHeader } from '../components/site-header'
import { SiteFooter } from '../components/site-footer'
import { DonationProvider } from '#/components/donation-provider'
import { DonationLayout } from '#/components/donation-layout'
import '../locales/i18n'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const compactLayout = ['/donate/checkout', '/donate/thank-you'].includes(
    pathname.replace(/\/$/, ''),
  )

  return (
    <html lang={i18n.resolvedLanguage}>
      <head>
        <HeadContent />
      </head>
      <body>
        <DonationProvider>
          {compactLayout ? (
            <DonationLayout>{children}</DonationLayout>
          ) : (
            <>
              <SiteHeader />
              {children}
              <SiteFooter />
            </>
          )}
        </DonationProvider>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
