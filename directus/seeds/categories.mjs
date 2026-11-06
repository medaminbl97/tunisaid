export const categorySeeds = [
  ['essentials', 1, { en: 'Essentials', de: 'Grundbedarf' }],
  ['mobility', 2, { en: 'Mobility', de: 'Mobilität' }],
  ['education', 3, { en: 'Education', de: 'Bildung' }],
]

export async function seedCategories({ ensure, publishDemo, ids }) {
  for (const [slug, sort, titles] of categorySeeds) {
    const category = await ensure(
      'categories',
      { slug: { _eq: slug } },
      { slug, sort, status: 'draft' },
    )
    for (const [language, title] of Object.entries(titles)) {
      await ensure(
        'categories_translations',
        { parent: { _eq: category.id }, language: { _eq: language } },
        { parent: category.id, language, title },
      )
    }
    await publishDemo('categories', category)
    ids.categories[slug] = category.id
  }
}
