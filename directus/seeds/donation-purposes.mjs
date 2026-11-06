export const purposeSeeds = [
  {
    slug: 'koffa',
    category: 'essentials',
    project: 'ramadan-food-boxes',
    cents: 3500,
    sort: 1,
    copy: {
      en: {
        title: 'Give a Koffa',
        category_label: 'Food & dignity',
        description:
          '<p>A bag of everyday groceries, chosen for a family in Tunisia.</p>',
        impact: 'One family. Essential groceries.',
        unit_label: 'per Koffa',
        basket_title: 'Koffa groceries',
        image_alt: 'A Koffa bag filled with everyday groceries',
      },
      de: {
        title: 'Verschenke eine Koffa',
        category_label: 'Lebensmittel & Würde',
        description:
          '<p>Eine Tasche mit Lebensmitteln für den Alltag einer Familie in Tunesien.</p>',
        impact: 'Eine Familie. Wichtige Lebensmittel.',
        unit_label: 'pro Koffa',
        basket_title: 'Koffa-Lebensmittel',
        image_alt: 'Eine Koffa-Tasche mit Lebensmitteln für den Alltag',
      },
    },
  },
  {
    slug: 'wheelchair',
    category: 'mobility',
    project: 'wheelchairs-for-students',
    cents: 3000,
    sort: 2,
    copy: {
      en: {
        title: 'Share a wheelchair',
        category_label: 'Mobility & independence',
        description:
          '<p>Help fund an illustrative €180 wheelchair, one share at a time. Six shares make a whole chair.</p>',
        impact: 'A step toward everyday freedom.',
        unit_label: 'per wheelchair share',
        basket_title: 'Wheelchair support',
        image_alt: 'A wheelchair ready for everyday use',
      },
      de: {
        title: 'Trage zu einem Rollstuhl bei',
        category_label: 'Mobilität & Selbstständigkeit',
        description:
          '<p>Hilf anteilig bei einem Rollstuhl für beispielhaft 180 €. Sechs Anteile ergeben einen ganzen Rollstuhl.</p>',
        impact: 'Ein Schritt zu mehr Freiheit im Alltag.',
        unit_label: 'pro Rollstuhlanteil',
        basket_title: 'Rollstuhl-Unterstützung',
        image_alt: 'Ein Rollstuhl, bereit für den Alltag',
      },
    },
  },
  {
    slug: 'school',
    category: 'education',
    project: 'school-supplies-support',
    cents: 2500,
    sort: 3,
    copy: {
      en: {
        title: 'Pack a school bag',
        category_label: 'Learning & possibility',
        description:
          '<p>Help a child start school with a bag, notebooks and essential supplies.</p>',
        impact: 'The tools for a brighter start.',
        unit_label: 'per school kit',
        basket_title: 'School supplies',
        image_alt: 'A school bag with notebooks and supplies',
      },
      de: {
        title: 'Packe eine Schultasche',
        category_label: 'Lernen & Möglichkeiten',
        description:
          '<p>Hilf einem Kind mit einer Tasche, Heften und wichtigen Schulmaterialien beim Schulstart.</p>',
        impact: 'Das Werkzeug für einen guten Anfang.',
        unit_label: 'pro Schulset',
        basket_title: 'Schulmaterialien',
        image_alt: 'Eine Schultasche mit Heften und Schulmaterialien',
      },
    },
  },
  {
    slug: 'warmth',
    category: 'essentials',
    project: null,
    cents: 4500,
    sort: 4,
    copy: {
      en: {
        title: 'Bring a little warmth',
        category_label: 'Care & comfort',
        description:
          '<p>Contribute to warm blankets and seasonal essentials for a household.</p>',
        impact: 'Comfort when it is needed most.',
        unit_label: 'per warmth kit',
        basket_title: 'Warmth & comfort',
        image_alt: 'Warm blankets folded for a household',
      },
      de: {
        title: 'Schenke ein wenig Wärme',
        category_label: 'Fürsorge & Geborgenheit',
        description:
          '<p>Trage zu warmen Decken und saisonalen Grundbedarfsartikeln für einen Haushalt bei.</p>',
        impact: 'Geborgenheit, wenn sie gebraucht wird.',
        unit_label: 'pro Wärmeset',
        basket_title: 'Wärme & Geborgenheit',
        image_alt: 'Warme Decken, gefaltet für einen Haushalt',
      },
    },
  },
]

export async function seedDonationPurposes({ ensure, publishDemo, ids }) {
  for (const purpose of purposeSeeds) {
    const project = purpose.project ? ids.projects[purpose.project] : null
    if (purpose.project && !project) {
      throw new Error(`Seed project ${purpose.project} is missing.`)
    }
    const item = await ensure(
      'donation_purposes',
      { slug: { _eq: purpose.slug } },
      {
        slug: purpose.slug,
        category: ids.categories[purpose.category],
        project,
        unit_amount_cents: purpose.cents,
        currency: 'EUR',
        sort: purpose.sort,
        status: 'draft',
        is_illustrative: true,
      },
    )
    for (const [language, copy] of Object.entries(purpose.copy)) {
      await ensure(
        'donation_purposes_translations',
        { parent: { _eq: item.id }, language: { _eq: language } },
        { parent: item.id, language, ...copy },
      )
    }
    await publishDemo('donation_purposes', item)
  }
}
