import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { SectionHeading } from '#/components/section-heading'
import { Button } from '#/components/ui/button'

type DetailHeroProps = {
  titleId: string
  eyebrow: string
  title: string
  summary?: string | null
  backLabel: string
  backTo: LinkProps['to']
  backHash?: string
  children?: ReactNode
}

export function DetailHero(props: DetailHeroProps) {
  return (
    <section
      aria-labelledby={props.titleId}
      className="bg-brand-flow-cool px-6 pt-[calc(var(--brand-header-height)+var(--brand-header-offset)+3rem)] pb-14 sm:px-10 lg:pb-20"
    >
      <div className="mx-auto flex max-w-[75rem] flex-col items-start gap-8">
        <Button
          asChild
          variant="link"
          className="h-auto p-0 text-[15px] font-bold text-brand-lagoon-deep"
        >
          <Link to={props.backTo} hash={props.backHash}>
            <ArrowLeft aria-hidden />
            {props.backLabel}
          </Link>
        </Button>
        <SectionHeading
          id={props.titleId}
          as="h1"
          align="left"
          eyebrow={props.eyebrow}
          title={props.title}
          description={props.summary ?? undefined}
          className="max-w-[52rem]"
        />
        {props.children}
      </div>
    </section>
  )
}
