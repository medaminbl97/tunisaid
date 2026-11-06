import { z } from 'zod'
import {
  zItemsCategories,
  zItemsCategoriesTranslations,
  zItemsDonationPurposes,
  zItemsDonationPurposesTranslations,
  zItemsProjects,
  zItemsProjectsTranslations,
} from '#/api/generated/zod.gen'
import { projectLanguageSchema } from '#/api/collections/projects/schemas'

export const donationPurposeLanguageSchema = projectLanguageSchema

const statusSchema = z.enum(['draft', 'published', 'archived'])

const categorySchema = zItemsCategories.extend({
  status: statusSchema,
  slug: z.string().trim().min(1),
  sort: z.int().nullish(),
  translations: z.array(
    zItemsCategoriesTranslations.extend({ language: z.string() }),
  ),
})

const linkedProjectSchema = zItemsProjects.pick({ id: true }).extend({
  slug: z.string().trim().min(1),
  status: statusSchema,
  translations: z.array(
    zItemsProjectsTranslations.extend({ language: z.string() }),
  ),
})

const translationSchema = zItemsDonationPurposesTranslations.extend({
  language: z.string(),
  title: z.string().trim().min(1),
})

export const donationPurposeSchema = zItemsDonationPurposes.extend({
  status: statusSchema,
  slug: z.string().trim().min(1),
  category: categorySchema.nullish(),
  project: linkedProjectSchema.nullish(),
  unit_amount_cents: z.int().positive(),
  currency: z.literal('EUR'),
  sort: z.int().nullish(),
  is_illustrative: z.boolean(),
  translations: z.array(translationSchema),
})

export const donationPurposesResponseSchema = z.object({
  data: z.array(donationPurposeSchema),
})

export type DonationPurposeLanguage = z.infer<
  typeof donationPurposeLanguageSchema
>
export type DonationPurpose = z.infer<typeof donationPurposeSchema>
