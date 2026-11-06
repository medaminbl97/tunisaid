import { seedCampaigns } from '../seeds/campaigns.mjs'
import { seedCategories } from '../seeds/categories.mjs'
import { seedDonationPurposes } from '../seeds/donation-purposes.mjs'
import { seedLanguages } from '../seeds/languages.mjs'
import { seedProjects } from '../seeds/projects.mjs'

// Dependency order: referenced rows must exist before the rows linking to them.
export const seedSteps = [
  ['languages', seedLanguages],
  ['categories', seedCategories],
  ['projects', seedProjects],
  ['campaigns + campaign_projects', seedCampaigns],
  ['donation_purposes', seedDonationPurposes],
]

export async function seed(request) {
  const publish = process.env.SEED_PUBLISH_DEMO === 'true'

  // Seeds only create missing rows; existing editor content is never overwritten.
  async function ensure(name, filter, values) {
    const query = encodeURIComponent(JSON.stringify(filter))
    const existing = await request(`/items/${name}?filter=${query}&limit=2`)
    if (existing.length > 1)
      throw new Error(`Duplicate seed identity in ${name}.`)
    if (existing.length) return existing[0]
    return request(`/items/${name}`, { method: 'POST', body: values })
  }

  async function publishDemo(name, item) {
    if (!publish || item.status !== 'draft') return
    await request(`/items/${name}/${item.id}`, {
      method: 'PATCH',
      body: { status: 'published' },
    })
  }

  const context = {
    request,
    ensure,
    publishDemo,
    ids: { categories: {}, projects: {}, campaigns: {} },
  }
  for (const [label, step] of seedSteps) {
    await step(context)
    console.log(`Seeded ${label}`)
  }
  console.log(
    publish
      ? 'Seeds verified and draft demo records published. Existing content was not overwritten.'
      : 'Seeds verified as drafts. Existing content was not overwritten.',
  )
}
