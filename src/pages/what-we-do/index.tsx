import { ContactStrip } from '#/components/contact-strip'
import { WorkHero } from './components/work-hero'
import { SupportSection } from './components/support-section'
import { PossibilitiesSection } from './components/possibilities-section'
import { ProcessSection } from './components/process-section'
import { WorkInvitation } from './components/work-invitation'

export function WhatWeDoPage() {
  return (
    <main className="-mt-[calc(var(--brand-header-height)+var(--brand-header-offset)+1rem)]">
      <WorkHero />
      <SupportSection />
      <PossibilitiesSection />
      <ProcessSection />
      <WorkInvitation />
      <ContactStrip />
    </main>
  )
}
