import { z } from 'zod'
import {
  zItemsProjects,
  zItemsProjectsTranslations,
} from '#/api/generated/zod.gen'

export const projectLanguageSchema = z.enum(['en', 'de'])

const translationSchema = zItemsProjectsTranslations.extend({
  language: projectLanguageSchema,
  title: z.string().trim().min(1),
})

export const projectSchema = zItemsProjects.extend({
  status: z.enum(['draft', 'published', 'archived']),
  slug: z.string().trim().min(1),
  translations: z.array(translationSchema).min(1),
})

export const projectsResponseSchema = z.object({
  data: z.array(projectSchema),
})

export const projectResponseSchema = z.object({
  data: projectSchema,
})

export type ProjectLanguage = z.infer<typeof projectLanguageSchema>
export type Project = z.infer<typeof projectSchema>
