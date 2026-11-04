import * as React from 'react'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { cn } from 'cn'
import { motion, useReducedMotion } from 'motion/react'
import { Slot } from 'radix-ui'

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
        brandOutline:
          'border-[1.5px] border-brand-ink bg-transparent text-brand-ink hover:bg-brand-sun-soft hover:text-brand-ink',
        white:
          'bg-brand-white text-brand-lagoon-deep hover:bg-brand-sun-soft hover:text-brand-lagoon-deep',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        cta: 'min-h-12 h-auto gap-2.5 px-7 py-[15px] text-[15px] leading-none font-bold',
        icon: 'size-9',
        'icon-xs': "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
      shape: {
        default: '',
        pill: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      shape: 'default',
    },
  },
)

const MotionSlot = motion.create(Slot.Root)

const spring = { type: 'spring', stiffness: 500, damping: 30 } as const

type ButtonProps = Omit<
  React.ComponentProps<'button'>,
  'onAnimationStart' | 'onDrag' | 'onDragStart' | 'onDragEnd'
> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

function Button({
  className,
  variant = 'default',
  size = 'default',
  shape = 'default',
  asChild = false,
  ...props
}: ButtonProps) {
  const reduceMotion = useReducedMotion()
  const Comp = asChild ? MotionSlot : motion.button
  const animated = !props.disabled && !reduceMotion && variant !== 'link'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-shape={shape}
      className={cn(buttonVariants({ variant, size, shape, className }))}
      whileHover={animated ? { scale: 1.04, y: -1 } : undefined}
      whileTap={animated ? { scale: 0.95, y: 0 } : undefined}
      transition={spring}
      {...props}
    />
  )
}

export { Button, buttonVariants }
