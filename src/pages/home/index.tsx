import { HeroSection } from './components/hero-section'
import { ImpactSection } from './components/impact-section'

export function HomePage() {
  return (
    <main className="-mt-[calc(var(--brand-header-height)+var(--brand-header-offset)+1rem)]">
      <HeroSection />
      <ImpactSection />
    </main>
  )
}
