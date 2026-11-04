import { HeroSection } from './components/hero-section'

export function HomePage() {
  return (
    <main lang="en" className="mx-auto max-w-[1600px] p-3 sm:p-4 lg:p-5">
      <HeroSection />
      <HeroSection />
      <HeroSection />
      <HeroSection />
    </main>
  )
}
