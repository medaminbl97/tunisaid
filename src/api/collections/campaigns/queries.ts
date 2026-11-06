import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { readItemsCampaigns } from '#/api/generated'
import { serializeDirectusQuery } from '#/api/directus-query'
import { campaignLanguageSchema, campaignsResponseSchema } from './schemas'
import type { Campaign, CampaignLanguage } from './schemas'

const summaryFields = [
  'id',
  'slug',
  'status',
  'goal_cents',
  'currency',
  'starts_at',
  'ends_at',
  'cover_image',
  'translations.id',
  'translations.parent',
  'translations.language',
  'translations.title',
  'translations.summary',
  'translations.image_alt',
]

const detailFields = [
  ...summaryFields,
  'translations.body',
  'projects.id',
  'projects.campaign',
  'projects.project.id',
  'projects.project.slug',
  'projects.project.status',
  'projects.project.translations.id',
  'projects.project.translations.parent',
  'projects.project.translations.language',
  'projects.project.translations.title',
  'projects.project.translations.summary',
]

const projectCampaignFields = [
  ...summaryFields,
  'projects.id',
  'projects.campaign',
  'projects.project.id',
  'projects.project.slug',
  'projects.project.status',
  'projects.project.translations.id',
  'projects.project.translations.parent',
  'projects.project.translations.language',
  'projects.project.translations.title',
  'projects.project.translations.summary',
]

const published = { status: { _eq: 'published' } }

const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100),
  offset: z.number().int().nonnegative(),
})

function localize(campaign: Campaign, language: CampaignLanguage) {
  if (campaign.status !== 'published') {
    throw new Error(`Campaign ${campaign.id} is not published.`)
  }
  const matches = campaign.translations.filter(
    (item) => item.language === language,
  )
  if (matches.length !== 1) {
    throw new Error(
      `Campaign ${campaign.id} must have exactly one ${language} translation.`,
    )
  }
  const projects = (campaign.projects ?? []).flatMap(({ project }) => {
    const translation = project.translations.find(
      (item) => item.language === language,
    )
    return project.status === 'published' && translation
      ? [
          {
            id: project.id,
            slug: project.slug,
            title: translation.title,
            summary: translation.summary ?? null,
          },
        ]
      : []
  })
  const { translations: _translations, projects: _projects, ...rest } = campaign
  return { ...rest, translation: matches[0], projects }
}

export type LocalizedCampaign = ReturnType<typeof localize>

export type CampaignsParams = {
  language: CampaignLanguage
  limit?: number
  offset?: number
}

export async function getActiveCampaigns(
  params: CampaignsParams,
  signal?: AbortSignal,
) {
  const language = campaignLanguageSchema.parse(params.language)
  const { limit, offset } = paginationSchema.parse({
    limit: params.limit ?? 12,
    offset: params.offset ?? 0,
  })
  const response = await readItemsCampaigns({
    signal,
    throwOnError: true,
    querySerializer: serializeDirectusQuery,
    query: {
      fields: summaryFields,
      filter: {
        _and: [
          published,
          {
            _or: [{ ends_at: { _null: true } }, { ends_at: { _gte: '$NOW' } }],
          },
        ],
      },
      sort: ['starts_at', 'slug'],
      limit,
      offset,
    },
  })
  return campaignsResponseSchema
    .parse(response.data)
    .data.map((campaign) => localize(campaign, language))
}

export class CampaignNotFoundError extends Error {
  constructor(slug: string) {
    super(`Campaign "${slug}" was not found.`)
    this.name = 'CampaignNotFoundError'
  }
}

export const campaignSlugSchema = z
  .string()
  .regex(/^[\w-]+$/)
  .max(200)

export async function getCampaignBySlug(
  slug: string,
  language: CampaignLanguage,
  signal?: AbortSignal,
) {
  const parsedSlug = campaignSlugSchema.safeParse(slug)
  if (!parsedSlug.success) throw new CampaignNotFoundError(slug)
  const campaignSlug = parsedSlug.data
  const campaignLanguage = campaignLanguageSchema.parse(language)
  const response = await readItemsCampaigns({
    signal,
    throwOnError: true,
    querySerializer: serializeDirectusQuery,
    query: {
      fields: detailFields,
      filter: { _and: [{ slug: { _eq: campaignSlug } }, published] },
      limit: 1,
    },
  })
  const campaign = campaignsResponseSchema.parse(response.data).data.at(0)
  if (!campaign) throw new CampaignNotFoundError(campaignSlug)
  return localize(campaign, campaignLanguage)
}

export async function getCampaignsForProject(
  projectSlug: string,
  language: CampaignLanguage,
  signal?: AbortSignal,
) {
  const parsedSlug = z
    .string()
    .regex(/^[\w-]+$/)
    .max(200)
    .parse(projectSlug)
  const campaignLanguage = campaignLanguageSchema.parse(language)
  const response = await readItemsCampaigns({
    signal,
    throwOnError: true,
    querySerializer: serializeDirectusQuery,
    query: {
      fields: projectCampaignFields,
      filter: {
        _and: [
          published,
          {
            projects: {
              project: {
                _and: [
                  { slug: { _eq: parsedSlug } },
                  { status: { _eq: 'published' } },
                ],
              },
            },
          },
        ],
      },
      sort: ['starts_at', 'slug'],
      limit: 100,
    },
  })
  return campaignsResponseSchema
    .parse(response.data)
    .data.map((campaign) => localize(campaign, campaignLanguage))
    .filter((campaign) =>
      campaign.projects.some((project) => project.slug === parsedSlug),
    )
}

export async function getCampaignsForProjects(
  projectSlugs: string[],
  language: CampaignLanguage,
  signal?: AbortSignal,
) {
  const parsedSlugs = z
    .array(
      z
        .string()
        .regex(/^[\w-]+$/)
        .max(200),
    )
    .max(100)
    .parse([...new Set(projectSlugs)].sort())
  if (parsedSlugs.length === 0) return []
  const campaignLanguage = campaignLanguageSchema.parse(language)
  const response = await readItemsCampaigns({
    signal,
    throwOnError: true,
    querySerializer: serializeDirectusQuery,
    query: {
      fields: projectCampaignFields,
      filter: {
        _and: [
          published,
          {
            projects: {
              project: {
                _and: [
                  { slug: { _in: parsedSlugs } },
                  { status: { _eq: 'published' } },
                ],
              },
            },
          },
        ],
      },
      sort: ['starts_at', 'slug'],
      limit: 100,
    },
  })
  return campaignsResponseSchema
    .parse(response.data)
    .data.map((campaign) => localize(campaign, campaignLanguage))
    .filter((campaign) =>
      campaign.projects.some((project) => parsedSlugs.includes(project.slug)),
    )
}

export const campaignKeys = {
  all: ['campaigns'] as const,
  active: (params: CampaignsParams) =>
    [
      ...campaignKeys.all,
      'active',
      params.language,
      params.limit ?? 12,
      params.offset ?? 0,
    ] as const,
  bySlug: (slug: string, language: CampaignLanguage) =>
    [...campaignKeys.all, 'slug', slug, language] as const,
  forProject: (slug: string, language: CampaignLanguage) =>
    [...campaignKeys.all, 'project', slug, language] as const,
  forProjects: (slugs: string[], language: CampaignLanguage) =>
    [
      ...campaignKeys.all,
      'projects',
      [...new Set(slugs)].sort(),
      language,
    ] as const,
}

export const activeCampaignsQueryOptions = (params: CampaignsParams) =>
  queryOptions({
    queryKey: campaignKeys.active(params),
    queryFn: ({ signal }) => getActiveCampaigns(params, signal),
  })

export const campaignBySlugQueryOptions = (
  slug: string,
  language: CampaignLanguage,
) =>
  queryOptions({
    queryKey: campaignKeys.bySlug(slug, language),
    queryFn: ({ signal }) => getCampaignBySlug(slug, language, signal),
    retry: (failureCount, error) =>
      !(error instanceof CampaignNotFoundError) && failureCount < 1,
  })

export const campaignsForProjectQueryOptions = (
  slug: string,
  language: CampaignLanguage,
) =>
  queryOptions({
    queryKey: campaignKeys.forProject(slug, language),
    queryFn: ({ signal }) => getCampaignsForProject(slug, language, signal),
  })

export const campaignsForProjectsQueryOptions = (
  slugs: string[],
  language: CampaignLanguage,
) =>
  queryOptions({
    queryKey: campaignKeys.forProjects(slugs, language),
    queryFn: ({ signal }) => getCampaignsForProjects(slugs, language, signal),
    enabled: slugs.length > 0,
  })
