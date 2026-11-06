import { escapeHtml } from '../scripts/rich-text.mjs'

export const projectSeeds = [
  {
    slug: 'school-supplies-support',
    translations: {
      en: {
        title: 'School supplies for children with disabilities',
        summary:
          'Helping children with disabilities in Tunisia access the supplies they need for school.',
      },
      de: {
        title: 'Schulmaterial für Kinder mit Behinderungen',
        summary:
          'Unterstützung für Kinder mit Behinderungen in Tunesien beim Zugang zu benötigtem Schulmaterial.',
      },
    },
  },
  {
    slug: 'ramadan-food-boxes',
    translations: {
      en: {
        title: 'Ramadan food boxes for families',
        summary:
          'Grocery support during Ramadan for families in Tunisia that include people with disabilities.',
      },
      de: {
        title: 'Lebensmittelpakete für Familien im Ramadan',
        summary:
          'Lebensmittelhilfe im Ramadan für Familien in Tunesien, in denen Menschen mit Behinderungen leben.',
      },
    },
  },
  {
    slug: 'wheelchairs-for-students',
    translations: {
      en: {
        title: 'Electric wheelchairs for students',
        summary:
          'An initiative to help two students access electric wheelchairs for their journeys to school.',
      },
      de: {
        title: 'Elektrorollstühle für Schülerinnen',
        summary:
          'Eine Initiative, die zwei Schülerinnen beim Zugang zu Elektrorollstühlen für ihren Schulweg unterstützt.',
      },
    },
  },
]

const provenance = {
  en: 'Editorial draft based on the project overview at https://tunisaid.org/. Current project status and availability must be confirmed before publication.',
  de: 'Redaktioneller Entwurf auf Grundlage der Projektübersicht unter https://tunisaid.org/. Aktueller Projektstatus und Verfügbarkeit müssen vor der Veröffentlichung bestätigt werden.',
}

export const projectBody = (language, copy) =>
  [
    `<h2>${escapeHtml(copy.title)}</h2>`,
    `<p>${escapeHtml(copy.summary)}</p>`,
    `<p><em>${escapeHtml(provenance[language])}</em></p>`,
    '<p><a href="https://tunisaid.org/">TunisAid.org</a></p>',
  ].join('\n')

export async function seedProjects({ ensure, publishDemo, ids }) {
  for (const definition of projectSeeds) {
    const project = await ensure(
      'projects',
      { slug: { _eq: definition.slug } },
      { slug: definition.slug, status: 'draft' },
    )
    for (const [language, copy] of Object.entries(definition.translations)) {
      await ensure(
        'projects_translations',
        { parent: { _eq: project.id }, language: { _eq: language } },
        {
          parent: project.id,
          language,
          ...copy,
          body: projectBody(language, copy),
        },
      )
    }
    await publishDemo('projects', project)
    ids.projects[definition.slug] = project.id
  }
}
