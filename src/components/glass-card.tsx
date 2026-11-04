import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '#/lib/utils'

type GlassCardProps = {
  children: ReactNode
  className?: string
  variant?: 'light' | 'inverse' | 'soft' | 'solid' | 'featured'
  animation?: 'reveal' | 'float'
  delay?: number
}

export function GlassCard({
  variant = 'light',
  animation = 'reveal',
  delay = 0,
  ...props
}: GlassCardProps) {
  const reduceMotion = useReducedMotion()
  const floating = animation === 'float'

  return (
    <motion.div
      initial={reduceMotion || floating ? false : { opacity: 0, y: 20 }}
      animate={floating ? { y: reduceMotion ? 0 : [0, -6, 0] } : undefined}
      whileInView={floating ? undefined : { opacity: 1, y: 0 }}
      whileHover={reduceMotion || floating ? undefined : { y: -4 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : floating
            ? { duration: 5, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.45, delay }
      }
      className={cn(
        'min-w-0 rounded-[28px] backdrop-blur-[12px]',
        variant === 'featured'
          ? 'border-[1.5px] border-brand-glass-inverse-border bg-brand-glass-featured text-brand-white shadow-glass-featured'
          : variant === 'solid'
            ? 'border border-brand-line bg-brand-white text-brand-ink backdrop-blur-none'
            : variant === 'inverse'
              ? 'border border-brand-glass-inverse-border bg-brand-glass-inverse text-brand-white'
              : variant === 'soft'
                ? 'border-[1.5px] border-brand-glass-soft-border bg-brand-glass-soft text-brand-ink shadow-glass-card'
                : 'border-[1.5px] border-brand-glass-border bg-brand-glass text-brand-ink shadow-glass-card',
        props.className,
      )}
    >
      {props.children}
    </motion.div>
  )
}
