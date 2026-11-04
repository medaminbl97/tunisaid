import { ContactHero } from './components/contact-hero'
import { ContactHub } from './components/contact-hub'
import { ConversationStarters } from './components/conversation-starters'
import { ContactClosing } from './components/contact-closing'

export function ContactPage() {
  return (
    <main className="-mt-[calc(var(--brand-header-height)+var(--brand-header-offset)+1rem)]">
      <ContactHero />
      <ContactHub />
      <ConversationStarters />
      <ContactClosing />
    </main>
  )
}
