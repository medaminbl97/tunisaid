import { Link } from '@tanstack/react-router'
import { ShoppingBasket } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDonationBasket } from '#/components/donation-provider'
import { Button } from '#/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { useDonationBasketLines } from '#/hooks/use-donation-basket-lines'
import { donationTotal, formatDonationAmount } from '#/lib/donation'
import { basketItemCount } from '#/lib/donation-storage'
import { cn } from '#/lib/utils'

type DonationBasketButtonProps = {
  className?: string
}

type BasketPreviewProps = {
  onNavigate: () => void
}

function BasketPreview(props: BasketPreviewProps) {
  const { t, i18n } = useTranslation('common', {
    keyPrefix: 'siteHeader.basket',
  })
  const { basket } = useDonationBasket()
  const lines = useDonationBasketLines()
  const format = (cents: number) => formatDonationAmount(cents, i18n.language)
  const empty = basketItemCount(basket) === 0

  return (
    <div className="space-y-4">
      <p className="font-display text-xl leading-tight font-bold">
        {t('title')}
      </p>
      {empty ? (
        <p className="text-sm leading-relaxed text-brand-ink-soft">
          {t('empty')}
        </p>
      ) : (
        <ul className="space-y-3 border-y border-brand-line py-4">
          {lines.map((line) => (
            <li
              key={line.slug}
              className="flex items-start justify-between gap-3 text-sm"
            >
              <span className="min-w-0">
                <span className="block font-bold">{line.title}</span>
                <span className="text-xs text-brand-ink-soft">
                  {t('lineDetail', {
                    quantity: line.quantity,
                    amount: format(line.unitCents),
                  })}
                </span>
              </span>
              <span className="shrink-0 font-bold">
                {format(line.quantity * line.unitCents)}
              </span>
            </li>
          ))}
          {basket.flexibleCents > 0 && (
            <li className="flex items-start justify-between gap-3 text-sm">
              <span className="font-bold">{t('flexible')}</span>
              <span className="shrink-0 font-bold">
                {format(basket.flexibleCents)}
              </span>
            </li>
          )}
        </ul>
      )}
      {!empty && (
        <p className="flex items-center justify-between gap-3 font-bold">
          <span>{t('total')}</span>
          <span className="font-display text-2xl">
            {format(donationTotal(basket))}
          </span>
        </p>
      )}
      <div className="flex flex-col gap-2">
        <Button asChild shape="pill" size="lg" className="w-full">
          <Link
            to={empty ? '/donate' : '/donate/checkout'}
            onClick={props.onNavigate}
          >
            {empty ? t('choose') : t('checkout')}
          </Link>
        </Button>
        {!empty && (
          <Button
            asChild
            variant="ghost"
            shape="pill"
            size="lg"
            className="w-full"
          >
            <Link to="/donate" onClick={props.onNavigate}>
              {t('addMore')}
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}

export function DonationBasketButton(props: DonationBasketButtonProps) {
  const { t, i18n } = useTranslation('common', {
    keyPrefix: 'siteHeader.basket',
  })
  const { basket } = useDonationBasket()
  const reduceMotion = useReducedMotion()
  const [open, setOpen] = useState(false)
  const count = basketItemCount(basket)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          shape="pill"
          aria-label={
            count > 0
              ? t('openWithCount', {
                  count,
                  total: formatDonationAmount(
                    donationTotal(basket),
                    i18n.language,
                  ),
                })
              : t('openEmpty')
          }
          className={cn(
            'relative size-11 cursor-pointer border-[1.5px] border-brand-header-chip-border bg-brand-header-chip text-brand-header-foreground hover:bg-brand-header-active',
            props.className,
          )}
        >
          <ShoppingBasket className="size-5" aria-hidden="true" />
          <AnimatePresence>
            {count > 0 && (
              <motion.span
                key="badge"
                aria-hidden="true"
                initial={reduceMotion ? false : { scale: 0 }}
                animate={{ scale: 1 }}
                exit={reduceMotion ? undefined : { scale: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 26 }}
                className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-sun px-1 text-[11px] leading-none font-extrabold text-brand-ink"
              >
                <motion.span
                  key={count}
                  initial={reduceMotion ? false : { scale: 1.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                >
                  {count > 99 ? '99+' : count}
                </motion.span>
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={14}
        collisionPadding={16}
        className="z-[60] w-[min(22rem,calc(100vw-2rem))] rounded-3xl border-[1.5px] border-brand-header-border bg-brand-white p-5 text-brand-ink shadow-header"
      >
        <BasketPreview onNavigate={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}
