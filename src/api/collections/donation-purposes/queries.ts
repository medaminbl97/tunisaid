import { queryOptions } from '@tanstack/react-query'
import { readItemsDonationPurposes } from '#/api/generated'
import { serializeDirectusQuery } from '#/api/directus-query'
import {
  donationPurposeLanguageSchema,
  donationPurposesResponseSchema,
} from './schemas'
import type { DonationPurpose, DonationPurposeLanguage } from './schemas'

const fields = [
  'id',
  'slug',
  'status',
  'unit_amount_cents',
  'currency',
  'sort',
  'is_illustrative',
  'image',
  'category.id',
  'category.slug',
  'category.status',
  'category.sort',
  'category.translations.id',
  'category.translations.parent',
  'category.translations.language',
  'category.translations.title',
  'project.id',
  'project.slug',
  'project.status',
  'project.translations.id',
  'project.translations.parent',
  'project.translations.language',
  'project.translations.title',
  'translations.id',
  'translations.parent',
  'translations.language',
  'translations.title',
  'translations.category_label',
  'translations.description',
  'translations.impact',
  'translations.unit_label',
  'translations.basket_title',
  'translations.image_alt',
]

// Purposes without a translation for the requested language are left out so
// one incomplete record cannot break the whole catalog.
function localize(purpose: DonationPurpose, language: DonationPurposeLanguage) {
  if (purpose.status !== 'published') return []
  const translation = purpose.translations.find(
    (item) => item.language === language,
  )
  if (!translation) return []
  const category =
    purpose.category?.status === 'published' ? purpose.category : null
  const categoryTitle = category?.translations.find(
    (item) => item.language === language,
  )?.title
  const projectTranslation = purpose.project?.translations.find(
    (item) => item.language === language,
  )
  return [
    {
      id: purpose.id,
      slug: purpose.slug,
      unitAmountCents: purpose.unit_amount_cents,
      currency: purpose.currency,
      isIllustrative: purpose.is_illustrative,
      category:
        category && categoryTitle
          ? {
              slug: category.slug,
              title: categoryTitle,
              sort: category.sort ?? null,
            }
          : null,
      project:
        purpose.project?.status === 'published' && projectTranslation
          ? {
              slug: purpose.project.slug,
              title: projectTranslation.title,
            }
          : null,
      title: translation.title,
      categoryLabel: translation.category_label ?? categoryTitle ?? null,
      description: translation.description ?? null,
      impact: translation.impact ?? null,
      unitLabel: translation.unit_label ?? null,
      basketTitle: translation.basket_title ?? translation.title,
      imageAlt: translation.image_alt ?? null,
    },
  ]
}

export type LocalizedDonationPurpose = ReturnType<typeof localize>[number]

export async function getDonationPurposes(
  language: DonationPurposeLanguage,
  signal?: AbortSignal,
) {
  const purposeLanguage = donationPurposeLanguageSchema.parse(language)
  const response = await readItemsDonationPurposes({
    signal,
    throwOnError: true,
    querySerializer: serializeDirectusQuery,
    query: {
      fields,
      filter: { status: { _eq: 'published' } },
      sort: ['sort', 'slug'],
      limit: 100,
    },
  })
  return donationPurposesResponseSchema
    .parse(response.data)
    .data.flatMap((purpose) => localize(purpose, purposeLanguage))
}

export function donationPurposeCategories(
  purposes: LocalizedDonationPurpose[],
) {
  const categories = new Map<
    string,
    NonNullable<LocalizedDonationPurpose['category']>
  >()
  for (const purpose of purposes) {
    if (purpose.category)
      categories.set(purpose.category.slug, purpose.category)
  }
  return [...categories.values()].sort(
    (a, b) =>
      (a.sort ?? Number.MAX_SAFE_INTEGER) -
        (b.sort ?? Number.MAX_SAFE_INTEGER) || a.slug.localeCompare(b.slug),
  )
}

export const donationPurposeKeys = {
  all: ['donation-purposes'] as const,
  list: (language: DonationPurposeLanguage) =>
    [...donationPurposeKeys.all, 'list', language] as const,
}

export const donationPurposesQueryOptions = (
  language: DonationPurposeLanguage,
) =>
  queryOptions({
    queryKey: donationPurposeKeys.list(language),
    queryFn: ({ signal }) => getDonationPurposes(language, signal),
    staleTime: 5 * 60 * 1000,
  })
