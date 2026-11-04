import * as React from 'react'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { cn } from 'cn'

const textareaVariants = cva(
  'flex field-sizing-content min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:ring-destructive/40',
  {
    variants: {
      variant: {
        default: '',
        brand:
          'min-h-36 resize-y rounded-[14px] border-brand-line bg-brand-white px-[18px] py-4 text-brand-ink shadow-none placeholder:text-brand-ink-soft md:text-[15px]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

type TextareaProps = React.ComponentProps<'textarea'> &
  VariantProps<typeof textareaVariants>

function Textarea({ className, variant, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Textarea }
