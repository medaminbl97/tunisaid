import { ContactStrip } from '#/components/contact-strip'
import { AboutHero } from './components/about-hero'
import { StorySection } from './components/story-section'
import { TeamSection } from './components/team-section'
import { ApproachSection } from './components/approach-section'

export function AboutPage() {
  return (
    <main className="-mt-[calc(var(--brand-header-height)+var(--brand-header-offset)+1rem)]">
      <AboutHero />
      <StorySection />
      <TeamSection />
      <ApproachSection />
      <ContactStrip />
    </main>
  )
}
