import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { apiBaseUrl } from '#/api/runtime-config'
import { GlassCard } from '#/components/glass-card'
import { IconChip } from '#/components/icon-chip'
import { RelationshipBadge } from '#/components/relationship-badge'
import { RichText } from '#/components/rich-text'
import { prepareRichText } from '#/lib/rich-text'

type PurposeCardProps = {
  icon: ReactNode
  category?: string | null
  title: string
  /** Rich-text HTML from the CMS; sanitized before rendering. */
  description?: string | null
  impact?: string | null
  amount: string
  unit?: string | null
  project?: { slug: string; title: string } | null
  projectLabel?: string
  generalPurposeLabel?: string
  action: ReactNode
  image?: ReactNode
}

export function PurposeCard(props: PurposeCardProps) {
  const description = useMemo(
    () =>
      props.description && typeof window !== 'undefined'
        ? prepareRichText(props.description, window, {
            assetBaseUrl: apiBaseUrl,
          }).html
        : null,
    [props.description],
  )

  return (
    <GlassCard variant="solid" className="flex h-full flex-col overflow-hidden">
      {props.image}
      <div className="flex grow flex-col gap-5 p-6">
        <div className="flex items-center justify-between gap-4">
          {!props.image && (
            <IconChip
              tone="sun"
              className="size-16 rounded-[22px] text-brand-lagoon-deep"
            >
              {props.icon}
            </IconChip>
          )}
          {props.category && (
            <p className="text-[11px] font-extrabold uppercase">
              {props.category}
            </p>
          )}
        </div>
        <h3 className="font-display text-[28px] leading-tight font-bold">
          {props.title}
        </h3>
        <div className="grow">
          {description && <RichText html={description} size="compact" />}
        </div>
        {props.impact && (
          <p className="flex items-center gap-3 text-xs font-bold">
            <Heart
              aria-hidden="true"
              className="size-6 shrink-0 text-brand-lagoon-deep"
            />
            {props.impact}
          </p>
        )}
        {props.project && props.projectLabel && (
          <div>
            <Link
              to="/projects/$slug"
              params={{ slug: props.project.slug }}
              className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-lagoon-deep"
            >
              <RelationshipBadge>
                {props.projectLabel}: {props.project.title}
              </RelationshipBadge>
            </Link>
          </div>
        )}
        {!props.project && props.generalPurposeLabel && (
          <div>
            <Link
              to="/donate"
              search={{ project: undefined, purpose: 'general' }}
              hash="donation-purposes"
              className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-lagoon-deep"
            >
              <RelationshipBadge>{props.generalPurposeLabel}</RelationshipBadge>
            </Link>
          </div>
        )}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <p>
            <span className="block font-display text-[32px] leading-tight font-bold">
              {props.amount}
            </span>
            {props.unit && (
              <span className="text-xs text-brand-ink-soft">{props.unit}</span>
            )}
          </p>
          {props.action}
        </div>
      </div>
    </GlassCard>
  )
}
