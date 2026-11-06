export const campaignSeeds = [
  {
    slug: 'inclusive-school-year-2027',
    goalCents: 650000,
    startsAt: '2026-11-01T00:00:00+01:00',
    endsAt: '2027-06-30T23:59:59+02:00',
    projects: ['school-supplies-support', 'wheelchairs-for-students'],
    translations: {
      en: {
        title: 'An inclusive school year',
        summary:
          'School supplies and mobility aids so that children with disabilities can learn alongside their classmates.',
        body: [
          '<h2>Why this campaign</h2>',
          '<p>For many children with disabilities in Tunisia, the school year fails on small things: missing supplies, or no way to get to class. This campaign bundles two projects that remove exactly these barriers.</p>',
          '<h2>What your gift supports</h2>',
          '<h3>School supplies</h3>',
          '<p>Backpacks, notebooks and adapted learning materials, put together with families and partner associations.</p>',
          '<h3>Mobility</h3>',
          '<p>Electric wheelchairs for students whose journey to school is otherwise not possible on their own.</p>',
          '<h2>How we report back</h2>',
          '<ul><li>Updates on each project page</li><li>Transparent allocation of every gift</li><li>A summary at the end of the school year</li></ul>',
        ],
      },
      de: {
        title: 'Ein inklusives Schuljahr',
        summary:
          'Schulmaterial und Mobilitätshilfen, damit Kinder mit Behinderungen gemeinsam mit ihren Mitschülerinnen und Mitschülern lernen können.',
        body: [
          '<h2>Warum diese Kampagne</h2>',
          '<p>Für viele Kinder mit Behinderungen in Tunesien scheitert das Schuljahr an kleinen Dingen: fehlendes Material oder kein Weg zur Schule. Diese Kampagne bündelt zwei Projekte, die genau diese Hürden abbauen.</p>',
          '<h2>Was deine Spende bewirkt</h2>',
          '<h3>Schulmaterial</h3>',
          '<p>Rucksäcke, Hefte und angepasste Lernmaterialien, zusammengestellt mit Familien und Partnervereinen.</p>',
          '<h3>Mobilität</h3>',
          '<p>Elektrorollstühle für Schülerinnen und Schüler, die den Schulweg sonst nicht selbstständig schaffen.</p>',
          '<h2>Wie wir berichten</h2>',
          '<ul><li>Updates auf jeder Projektseite</li><li>Transparente Zuordnung jeder Spende</li><li>Eine Zusammenfassung am Ende des Schuljahres</li></ul>',
        ],
      },
    },
  },
  {
    slug: 'ramadan-2027',
    goalCents: 400000,
    startsAt: '2027-01-15T00:00:00+01:00',
    endsAt: '2027-03-10T23:59:59+01:00',
    projects: ['ramadan-food-boxes'],
    translations: {
      en: {
        title: 'Ramadan 2027 food boxes',
        summary:
          'Grocery boxes for families that include people with disabilities, delivered before and during Ramadan.',
        body: [
          '<h2>The idea</h2>',
          '<p>Ramadan is a time of sharing. Together with local partners we put together food boxes with staple groceries and deliver them to families who need them most.</p>',
          '<h2>What is in a box</h2>',
          '<p>Flour, oil, semolina, pasta, dates, tomato paste and other staples for a family for several weeks.</p>',
          '<blockquote><p>Every box is put together and handed over by volunteers in the region.</p></blockquote>',
        ],
      },
      de: {
        title: 'Lebensmittelpakete Ramadan 2027',
        summary:
          'Lebensmittelpakete für Familien, in denen Menschen mit Behinderungen leben, verteilt vor und während des Ramadan.',
        body: [
          '<h2>Die Idee</h2>',
          '<p>Ramadan ist eine Zeit des Teilens. Gemeinsam mit lokalen Partnern stellen wir Pakete mit Grundnahrungsmitteln zusammen und bringen sie zu Familien, die sie am dringendsten brauchen.</p>',
          '<h2>Was in einem Paket ist</h2>',
          '<p>Mehl, Öl, Grieß, Nudeln, Datteln, Tomatenmark und weitere Grundnahrungsmittel für eine Familie für mehrere Wochen.</p>',
          '<blockquote><p>Jedes Paket wird von Freiwilligen in der Region gepackt und übergeben.</p></blockquote>',
        ],
      },
    },
  },
]

const demoNotice = {
  en: 'Demo campaign for local development. Goal, dates and copy are illustrative and not a real fundraising appeal.',
  de: 'Demo-Kampagne für die lokale Entwicklung. Ziel, Zeitraum und Texte sind beispielhaft und kein echter Spendenaufruf.',
}

export async function seedCampaigns({ ensure, publishDemo, ids }) {
  for (const definition of campaignSeeds) {
    const campaign = await ensure(
      'campaigns',
      { slug: { _eq: definition.slug } },
      {
        slug: definition.slug,
        status: 'draft',
        goal_cents: definition.goalCents,
        currency: 'EUR',
        starts_at: definition.startsAt,
        ends_at: definition.endsAt,
      },
    )
    for (const [language, copy] of Object.entries(definition.translations)) {
      await ensure(
        'campaigns_translations',
        { parent: { _eq: campaign.id }, language: { _eq: language } },
        {
          parent: campaign.id,
          language,
          title: copy.title,
          summary: copy.summary,
          body: [...copy.body, `<p><em>${demoNotice[language]}</em></p>`].join(
            '\n',
          ),
        },
      )
    }
    // campaign_projects is the many-to-many junction: one row per link.
    for (const slug of definition.projects) {
      const project = ids.projects[slug]
      if (!project) throw new Error(`Seed project ${slug} is missing.`)
      await ensure(
        'campaign_projects',
        { campaign: { _eq: campaign.id }, project: { _eq: project } },
        { campaign: campaign.id, project },
      )
    }
    await publishDemo('campaigns', campaign)
    ids.campaigns[definition.slug] = campaign.id
  }
}
