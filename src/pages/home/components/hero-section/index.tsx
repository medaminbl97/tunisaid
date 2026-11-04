import { Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'

export function HeroSection() {
  return (
    <section
      aria-labelledby="home-hero-heading"
      className="flex min-h-[32rem] items-center justify-center rounded-[2rem] bg-linear-to-br from-brand-hero-background-start to-brand-hero-background-end p-6 sm:min-h-[36rem] sm:p-12 lg:min-h-[42rem] lg:p-20"
    >
      <div className="w-full max-w-6xl rounded-2xl bg-brand-hero-glass p-6 text-brand-hero-foreground backdrop-blur-md sm:p-10 lg:p-14">
        <p className="text-xs leading-relaxed font-bold tracking-widest uppercase">
          United in purpose, blessed in stride
        </p>
        <h1
          id="home-hero-heading"
          className="mt-5 max-w-[22ch] text-4xl leading-[1.15] font-extrabold text-balance sm:text-5xl lg:text-7xl"
        >
          True nobility lies in the hands that give.
        </h1>
        <Button
          asChild
          size="lg"
          className="mt-8 min-h-11 w-full text-xs font-bold tracking-widest uppercase sm:w-auto lg:mt-10"
        >
          <Link from="/" href="/contact" preload={false}>
            Reach out your hand
          </Link>
        </Button>
      </div>
    </section>
  )
}
