import logoEmblem from '#/assets/images/tunisaid-logo-scaled.png'
import { cn } from '#/lib/utils'

type SiteLogoProps = {
  className?: string
}

export function SiteLogo(props: SiteLogoProps) {
  return (
    <span
      className={cn(
        'relative block size-14 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-brand-header-chip-border',
        props.className,
      )}
    >
      <img
        src={logoEmblem}
        alt=""
        width={96}
        height={96}
        className="size-full scale-[1.4] object-cover"
      />
    </span>
  )
}
