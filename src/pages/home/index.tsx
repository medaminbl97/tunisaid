import { HeroSection } from './components/hero-section'
import { ImpactSection } from './components/impact-section'
import { ProjectsSection } from './components/projects-section'
import { ValuesSection } from './components/values-section'
import { GetInvolvedSection } from './components/get-involved-section'
import { PartnersSection } from './components/partners-section'

export function HomePage() {
  return (
    <main className="-mt-[calc(var(--brand-header-height)+var(--brand-header-offset)+1rem)]">
      <HeroSection />
      <ImpactSection />
      <ProjectsSection />
      <ValuesSection />
      <GetInvolvedSection />
      <PartnersSection />
    </main>
  )
}
