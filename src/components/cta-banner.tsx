import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { SectionHeading } from '#/components/section-heading'

type CtaBannerProps = {
  id: string
  title: string
  description: string
  actions: ReactNode
  decoration?: ReactNode
}

export function CtaBanner(props: CtaBannerProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: reduceMotion ? 0 : 0.6 }}
      className="relative isolate flex flex-col items-start justify-between gap-8 overflow-clip rounded-[32px] bg-brand-sun px-6 py-10 sm:rounded-[48px] sm:px-10 lg:flex-row lg:items-center lg:gap-12 lg:px-20 lg:py-[72px]"
    >
      {props.decoration && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
        >
          {props.decoration}
        </div>
      )}
      <SectionHeading
        id={props.id}
        title={props.title}
        description={props.description}
        align="left"
        size="compact"
        className="max-w-[40rem] gap-3.5 [&>p]:text-brand-ink"
      />
      <div className="flex max-w-full shrink-0 flex-col items-start gap-3.5 lg:items-end">
        {props.actions}
      </div>
    </motion.div>
  )
}
