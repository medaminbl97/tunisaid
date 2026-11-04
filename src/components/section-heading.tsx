import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '#/lib/utils'

type SectionHeadingProps = {
  id?: string
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  as?: 'h1' | 'h2' | 'h3'
  align?: 'left' | 'center'
  tone?: 'default' | 'inverse'
  eyebrowVariant?: 'plain' | 'pill'
  className?: string
}

export function SectionHeading({
  as: Heading = 'h2',
  align = 'center',
  tone = 'default',
  eyebrowVariant = 'plain',
  ...props
}: SectionHeadingProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: reduceMotion ? 0 : 0.6 }}
      className={cn(
        'flex flex-col gap-4',
        align === 'center'
          ? 'items-center text-center'
          : 'items-start text-left',
        tone === 'inverse' ? 'text-brand-white' : 'text-brand-ink',
        props.className,
      )}
    >
      {props.eyebrow && (
        <p
          className={cn(
            'inline-flex max-w-full items-center gap-2.5 text-[13px] leading-none font-extrabold uppercase',
            tone === 'inverse' ? 'text-brand-white' : 'text-brand-terracotta',
            eyebrowVariant === 'pill' && 'rounded-full px-4 py-2 text-xs',
            eyebrowVariant === 'pill' &&
              (tone === 'inverse'
                ? 'bg-brand-impact-glass'
                : 'bg-brand-sun-soft text-brand-ink'),
          )}
        >
          {props.eyebrow}
        </p>
      )}
      <Heading
        id={props.id}
        className={cn(
          'font-display font-bold text-balance',
          Heading === 'h1'
            ? 'text-[clamp(2.5rem,4.73vw,4.25rem)] leading-[1.08]'
            : 'text-[clamp(2rem,3.62vw,3.25rem)] leading-[1.12]',
        )}
      >
        {props.title}
      </Heading>
      {props.description && (
        <p
          className={cn(
            'max-w-[40rem] text-lg leading-[1.6]',
            Heading === 'h1' && 'sm:text-[19px]',
            tone === 'inverse'
              ? 'text-brand-impact-copy'
              : 'text-brand-ink-soft',
          )}
        >
          {props.description}
        </p>
      )}
    </motion.div>
  )
}
