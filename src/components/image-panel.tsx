import { motion, useReducedMotion } from 'motion/react'
import type { SiteImage } from '#/lib/site-images'
import { cn } from '#/lib/utils'

type ImagePanelProps = {
  image: SiteImage
  alt: string
  sizes: string
  caption?: string
  priority?: boolean
  className?: string
  imageClassName?: string
}

export function ImagePanel(props: ImagePanelProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.figure
      initial={reduceMotion || props.priority ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: reduceMotion ? 0 : 0.5 }}
      className={cn('min-w-0', props.className)}
    >
      <div className="relative isolate overflow-hidden rounded-[32px] bg-brand-cream">
        <img
          src={props.image.src}
          srcSet={props.image.srcSet}
          sizes={props.sizes}
          width={props.image.width}
          height={props.image.height}
          alt={props.alt}
          loading={props.priority ? 'eager' : 'lazy'}
          fetchPriority={props.priority ? 'high' : undefined}
          decoding="async"
          className={cn(
            'block aspect-[16/9] w-full object-cover',
            props.imageClassName,
          )}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-brand-image-wash"
        />
      </div>
      {props.caption && (
        <figcaption className="mt-3 px-1 text-xs leading-relaxed text-brand-ink-soft">
          {props.caption}
        </figcaption>
      )}
    </motion.figure>
  )
}
