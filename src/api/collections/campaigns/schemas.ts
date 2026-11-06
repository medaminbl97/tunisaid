import { z } from 'zod'
import {
  zItemsCampaignProjects,
  zItemsCampaigns,
  zItemsCampaignsTranslations,
  zItemsProjects,
  zItemsProjectsTranslations,
} from '#/api/generated/zod.gen'
import { projectLanguageSchema } from '#/api/collections/projects/schemas'

export const campaignLanguageSchema = projectLanguageSchema

const statusSchema = z.enum(['draft', 'published', 'archived'])

const campaignTranslationSchema = zItemsCampaignsTranslations.extend({
  language: campaignLanguageSchema,
  title: z.string().trim().min(1),
})

const linkedProjectSchema = zItemsProjects.extend({
  status: statusSchema,
  slug: z.string().trim().min(1),
  translations: z.array(
    zItemsProjectsTranslations.extend({ language: z.string() }),
  ),
})

const campaignProjectSchema = zItemsCampaignProjects.extend({
  project: linkedProjectSchema,
})

export const campaignSchema = zItemsCampaigns.extend({
  status: statusSchema,
  slug: z.string().trim().min(1),
  goal_cents: z.int().nonnegative(),
  currency: z.literal('EUR'),
  translations: z.array(campaignTranslationSchema).min(1),
  projects: z.array(campaignProjectSchema).optional(),
})

export const campaignsResponseSchema = z.object({
  data: z.array(campaignSchema),
})

export type CampaignLanguage = z.infer<typeof campaignLanguageSchema>
export type Campaign = z.infer<typeof campaignSchema>
