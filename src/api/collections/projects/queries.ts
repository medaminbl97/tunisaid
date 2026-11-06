import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { readItemsProjects, readSingleItemsProjects } from '#/api/generated'
import { serializeDirectusQuery } from '#/api/directus-query'
import {
  projectLanguageSchema,
  projectResponseSchema,
  projectsResponseSchema,
} from './schemas'
import type { Project, ProjectLanguage } from './schemas'

const projectFields = [
  'id',
  'slug',
  'status',
  'cover_image',
  'starts_at',
  'ends_at',
  'translations.id',
  'translations.parent',
  'translations.language',
  'translations.title',
  'translations.summary',
  'translations.body',
  'translations.image_alt',
]

const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100),
  offset: z.number().int().nonnegative(),
})

function localize(project: Project, language: ProjectLanguage) {
  if (project.status !== 'published') {
    throw new Error(`Project ${project.id} is not published.`)
  }
  const matches = project.translations.filter(
    (item) => item.language === language,
  )
  if (matches.length !== 1) {
    throw new Error(
      `Project ${project.id} must have exactly one ${language} translation.`,
    )
  }
  const { translations: _translations, ...rest } = project
  return { ...rest, translation: matches[0] }
}

export type ProjectsParams = {
  language: ProjectLanguage
  limit?: number
  offset?: number
}

export async function getProjects(
  params: ProjectsParams,
  signal?: AbortSignal,
) {
  const language = projectLanguageSchema.parse(params.language)
  const { limit, offset } = paginationSchema.parse({
    limit: params.limit ?? 12,
    offset: params.offset ?? 0,
  })
  const response = await readItemsProjects({
    signal,
    throwOnError: true,
    querySerializer: serializeDirectusQuery,
    query: {
      fields: projectFields,
      filter: { status: { _eq: 'published' } },
      sort: ['slug'],
      limit,
      offset,
    },
  })
  return projectsResponseSchema
    .parse(response.data)
    .data.map((project) => localize(project, language))
}

export async function getProject(
  id: string,
  language: ProjectLanguage,
  signal?: AbortSignal,
) {
  const projectId = z.uuid().parse(id)
  const projectLanguage = projectLanguageSchema.parse(language)
  const response = await readSingleItemsProjects({
    signal,
    throwOnError: true,
    path: { id: projectId },
    query: { fields: projectFields },
  })
  const project = projectResponseSchema.parse(response.data).data
  return localize(project, projectLanguage)
}

export class ProjectNotFoundError extends Error {
  constructor(slug: string) {
    super(`Project "${slug}" was not found.`)
    this.name = 'ProjectNotFoundError'
  }
}

export const projectSlugSchema = z
  .string()
  .regex(/^[\w-]+$/)
  .max(200)

export async function getProjectBySlug(
  slug: string,
  language: ProjectLanguage,
  signal?: AbortSignal,
) {
  const parsedSlug = projectSlugSchema.safeParse(slug)
  if (!parsedSlug.success) throw new ProjectNotFoundError(slug)
  const projectSlug = parsedSlug.data
  const projectLanguage = projectLanguageSchema.parse(language)
  const response = await readItemsProjects({
    signal,
    throwOnError: true,
    querySerializer: serializeDirectusQuery,
    query: {
      fields: projectFields,
      filter: {
        _and: [
          { slug: { _eq: projectSlug } },
          { status: { _eq: 'published' } },
        ],
      },
      limit: 1,
    },
  })
  const project = projectsResponseSchema.parse(response.data).data.at(0)
  if (!project) throw new ProjectNotFoundError(projectSlug)
  return localize(project, projectLanguage)
}

export const projectKeys = {
  all: ['projects'] as const,
  list: (params: ProjectsParams) =>
    [
      ...projectKeys.all,
      'list',
      params.language,
      params.limit ?? 12,
      params.offset ?? 0,
    ] as const,
  detail: (id: string, language: ProjectLanguage) =>
    [...projectKeys.all, 'detail', id, language] as const,
  bySlug: (slug: string, language: ProjectLanguage) =>
    [...projectKeys.all, 'slug', slug, language] as const,
}

export const projectsQueryOptions = (params: ProjectsParams) =>
  queryOptions({
    queryKey: projectKeys.list(params),
    queryFn: ({ signal }) => getProjects(params, signal),
  })

export const projectBySlugQueryOptions = (
  slug: string,
  language: ProjectLanguage,
) =>
  queryOptions({
    queryKey: projectKeys.bySlug(slug, language),
    queryFn: ({ signal }) => getProjectBySlug(slug, language, signal),
    retry: (failureCount, error) =>
      !(error instanceof ProjectNotFoundError) && failureCount < 1,
  })

export const projectQueryOptions = (id: string, language: ProjectLanguage) =>
  queryOptions({
    queryKey: projectKeys.detail(id, language),
    queryFn: ({ signal }) => getProject(id, language, signal),
  })
