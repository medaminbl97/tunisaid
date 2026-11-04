import type { ReactNode } from 'react'
import { useId, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { IconChip } from '#/components/icon-chip'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

type ContactItemProps = {
  icon: ReactNode
  title: string
  children: ReactNode
  description: string
  delay?: number
}

export function ContactItem(props: ContactItemProps) {
  const reduceMotion = useReducedMotion()
  const descriptionId = useId()
  const [hovered, setHovered] = useState(false)
  const [open, setOpen] = useState(false)
  const expanded = hovered || open

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: reduceMotion ? 0 : 0.45,
        delay: reduceMotion ? 0 : props.delay,
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onFocusCapture={(event) => {
        if (event.target.matches(':focus-visible')) setOpen(true)
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setOpen(false)
          setHovered(false)
        }
      }}
      className={cn(
        'min-w-0 rounded-[28px] border border-transparent p-4 transition-colors motion-reduce:transition-none',
        expanded && 'border-brand-glass-border bg-brand-glass-soft',
      )}
    >
      <div className="flex min-w-0 items-center gap-4">
        <IconChip className="size-[52px] bg-brand-white">{props.icon}</IconChip>
        <div className="min-w-0 flex-1">
          <h3>
            <Button
              variant="ghost"
              onClick={() => setOpen(!open)}
              aria-expanded={expanded}
              aria-controls={descriptionId}
              className="h-auto max-w-full justify-start p-0 text-left text-sm leading-5 font-bold whitespace-normal text-brand-lagoon-deep hover:bg-transparent hover:text-brand-ink"
            >
              {props.title}
              <motion.span
                aria-hidden="true"
                animate={{ rotate: expanded ? 45 : 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.2 }}
                className="inline-block shrink-0 text-lg"
              >
                +
              </motion.span>
            </Button>
          </h3>
          <div className="mt-1.5 text-sm leading-[22px] break-words text-brand-ink">
            {props.children}
          </div>
        </div>
      </div>
      <motion.div
        id={descriptionId}
        aria-hidden={!expanded}
        initial={false}
        animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
        transition={{
          duration: reduceMotion ? 0 : 0.3,
          ease: 'easeInOut',
        }}
        className="overflow-hidden"
      >
        <p className="pt-4 text-sm leading-relaxed text-brand-ink-soft">
          {props.description}
        </p>
      </motion.div>
    </motion.div>
  )
}
