import { randomBytes, randomUUID } from 'node:crypto'
import { z } from 'zod'
import {
  checkoutInputSchema,
  maxDonationCents,
  minDonationCents,
  storedDonationStatuses,
} from '#/api/collections/donations/schemas'
import type {
  CampaignRaised,
  CheckoutInput,
  CheckoutResult,
  DonationReceipt,
  DonationStatus,
  MockPaymentDetails,
  MockPaymentOutcome,
} from '#/api/collections/donations/schemas'
import {
  readItemsCampaignProjects,
  readItemsCampaigns,
  readItemsCheckouts,
  readItemsDonationItems,
  readItemsDonationPurposes,
  readItemsPaymentAttempts,
  readItemsPaymentEvents,
  readItemsRefunds,
} from '#/api/generated'
import {
  zItemsCampaigns,
  zItemsCampaignsTranslations,
  zItemsCheckouts,
  zItemsDonationItems,
  zItemsDonationPurposes,
  zItemsDonationPurposesTranslations,
  zItemsPaymentAttempts,
  zItemsPaymentEvents,
} from '#/api/generated/zod.gen'
import { DirectusError, createServiceClient } from './directus'
import type { ServiceConnection } from './directus'

const flexibleTitles = { en: 'Flexible support', de: 'Flexible Unterstützung' }

export function receiptStatus(
  status: (typeof storedDonationStatuses)[number],
  totalCents: number,
  refundedCents: number,
): DonationStatus {
  if (status !== 'paid' || refundedCents <= 0) return status
  return refundedCents >= totalCents ? 'refunded' : 'partially_refunded'
}

// Row schemas narrow the generated record schemas to the fields each request
// selects, and tighten the loosely typed values the service relies on.
const idSchema = z.object({ id: z.uuid() })
const purposeRowSchema = zItemsDonationPurposes
  .pick({ id: true, slug: true })
  .extend({
    status: z.literal('published'),
    project: z.uuid().nullish(),
    unit_amount_cents: z.int().positive(),
    currency: z.literal('EUR'),
    translations: z.array(
      zItemsDonationPurposesTranslations
        .pick({ basket_title: true })
        .extend({ language: z.string(), title: z.string().min(1) }),
    ),
  })
const campaignLinkSchema = z.object({
  project: z.uuid(),
  campaign: zItemsCampaigns
    .pick({ id: true, ends_at: true })
    .extend({ status: z.string() }),
})
const attemptRowSchema = zItemsPaymentAttempts.pick({ id: true }).extend({
  checkout: z.uuid(),
  status: z.enum(['created', 'pending', 'succeeded', 'failed', 'cancelled']),
  amount_cents: z.int(),
  currency: z.literal('EUR'),
})
const checkoutRowSchema = zItemsCheckouts
  .pick({ id: true, reference: true, created_at: true, paid_at: true })
  .extend({
    status: z.enum(storedDonationStatuses),
    currency: z.literal('EUR'),
    total_cents: z.int(),
  })
const itemRowSchema = zItemsDonationItems
  .pick({ id: true, title_snapshot: true })
  .extend({
    donation: z.object({
      campaign: zItemsCampaigns
        .pick({ slug: true })
        .extend({
          translations: z.array(
            zItemsCampaignsTranslations
              .pick({ title: true })
              .extend({ language: z.string() }),
          ),
        })
        .nullish(),
    }),
    kind: z.enum(['purpose', 'flexible']),
    quantity: z.int(),
    unit_amount_cents: z.int(),
    total_cents: z.int(),
  })
const eventRowSchema = zItemsPaymentEvents.pick({ id: true }).extend({
  status: z.enum(['received', 'processed', 'failed']),
})
const amountSchema = z.object({ amount_cents: z.int() })

function rowsOf<T extends z.ZodType>(
  schema: T,
  result: { data: { data?: unknown } },
) {
  return z.array(schema).parse(result.data.data)
}

const base32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
export function createDonationReference(bytes = randomBytes(12)) {
  return `TA-${[...bytes].map((byte) => base32[byte % 32]).join('')}`
}

const attemptOutcomes = {
  succeeded: { attempt: 'succeeded', checkout: 'paid', failure: null },
  failed: { attempt: 'failed', checkout: 'failed', failure: 'mock_declined' },
  cancelled: { attempt: 'cancelled', checkout: 'cancelled', failure: null },
} as const

export type DonationServiceOptions = ServiceConnection & {
  now?: () => Date
  createReference?: () => string
}

export function createDonationService(options: DonationServiceOptions) {
  const { client, reads, create, update } = createServiceClient(options)
  const now = () => (options.now ?? (() => new Date()))().toISOString()

  async function readPurposes(slugs: string[]) {
    if (!slugs.length) return []
    const response = await readItemsDonationPurposes({
      ...reads,
      query: {
        fields: [
          'id',
          'slug',
          'status',
          'project',
          'unit_amount_cents',
          'currency',
          'translations.language',
          'translations.title',
          'translations.basket_title',
        ],
        filter: {
          _and: [{ slug: { _in: slugs } }, { status: { _eq: 'published' } }],
        },
        limit: slugs.length,
      },
    })
    return rowsOf(purposeRowSchema, response)
  }

  // A gift counts toward the open campaign that includes its purpose's
  // project. Editors must not put a project in two open campaigns.
  async function readOpenCampaigns(projectIds: string[]) {
    const byProject = new Map<string, string[]>()
    if (!projectIds.length) return byProject
    const response = await readItemsCampaignProjects({
      ...reads,
      query: {
        fields: [
          'project',
          'campaign.id',
          'campaign.status',
          'campaign.ends_at',
        ],
        filter: {
          _and: [
            { project: { _in: projectIds } },
            { campaign: { status: { _eq: 'published' } } },
          ],
        },
        limit: -1,
      },
    })
    const current = Date.parse(now())
    for (const link of rowsOf(campaignLinkSchema, response)) {
      const { campaign } = link
      // Upcoming campaigns are listed on the site, so they accept gifts too.
      if (
        campaign.status !== 'published' ||
        (campaign.ends_at && Date.parse(campaign.ends_at) < current)
      ) {
        continue
      }
      byProject.set(link.project, [
        ...(byProject.get(link.project) ?? []),
        campaign.id,
      ])
    }
    return byProject
  }

  async function createCheckout(
    rawInput: CheckoutInput,
    provider: 'mock',
  ): Promise<
    | { ok: true; reference: string; attemptId: string }
    | Extract<CheckoutResult, { ok: false }>
  > {
    const input = checkoutInputSchema.parse(rawInput)
    const purposes = await readPurposes(input.items.map((item) => item.slug))
    const lines = []
    for (const item of input.items) {
      const purpose = purposes.find((row) => row.slug === item.slug)
      const translation =
        purpose?.translations.find((row) => row.language === input.language) ??
        purpose?.translations.find((row) => row.language === 'en')
      if (
        !purpose ||
        !translation ||
        purpose.unit_amount_cents !== item.unitCents
      ) {
        return { ok: false, code: 'catalog_changed' }
      }
      const totalCents = purpose.unit_amount_cents * item.quantity
      if (!Number.isSafeInteger(totalCents) || totalCents > maxDonationCents) {
        return { ok: false, code: 'invalid_amount' }
      }
      lines.push({
        project: purpose.project ?? null,
        purpose: purpose.id,
        kind: 'purpose' as const,
        title_snapshot: translation.basket_title || translation.title,
        quantity: item.quantity,
        unit_amount_cents: purpose.unit_amount_cents,
        total_cents: totalCents,
        requested_purpose_snapshot: purpose.slug,
      })
    }
    if (input.flexibleCents > 0) {
      lines.push({
        project: null,
        purpose: null,
        kind: 'flexible' as const,
        title_snapshot: flexibleTitles[input.language],
        quantity: 1,
        unit_amount_cents: input.flexibleCents,
        total_cents: input.flexibleCents,
        requested_purpose_snapshot: null,
      })
    }
    const total = lines.reduce((sum, line) => sum + line.total_cents, 0)
    if (total < minDonationCents || total > maxDonationCents) {
      return { ok: false, code: 'invalid_amount' }
    }
    if (total !== input.expectedTotalCents) {
      return { ok: false, code: 'catalog_changed' }
    }
    const openCampaigns = await readOpenCampaigns([
      ...new Set(lines.flatMap((line) => (line.project ? [line.project] : []))),
    ])
    // One donation per campaign; flexible and unlinked gifts share one
    // donation without a campaign.
    const groups = new Map<string | null, typeof lines>()
    for (const line of lines) {
      const campaigns = line.project
        ? (openCampaigns.get(line.project) ?? [])
        : []
      if (campaigns.length > 1) return { ok: false, code: 'campaign_conflict' }
      const campaign = campaigns.at(0) ?? null
      groups.set(campaign, [...(groups.get(campaign) ?? []), line])
    }

    const createdAt = now()
    const { donor } = input
    const donorId =
      donor.name || donor.email
        ? idSchema.parse(
            await create('donors', {
              display_name: donor.name ?? null,
              email: donor.email ?? null,
              country_code: donor.countryCode ?? null,
              preferred_language: input.language,
              keep_name_private: donor.keepNamePrivate,
              created_at: createdAt,
            }),
          ).id
        : null
    const reference = (options.createReference ?? createDonationReference)()
    const checkout = idSchema.parse(
      await create('checkouts', {
        reference,
        donor: donorId,
        status: 'pending',
        currency: 'EUR',
        total_cents: total,
        created_at: createdAt,
      }),
    )
    try {
      const shares = [...groups]
      const donations = z.array(idSchema).parse(
        await create(
          'donations',
          shares.map(([campaign, group]) => ({
            checkout: checkout.id,
            campaign,
            currency: 'EUR',
            total_cents: group.reduce((sum, line) => sum + line.total_cents, 0),
          })),
        ),
      )
      await create(
        'donation_items',
        shares.flatMap(([, group], index) =>
          group.map(({ project: _project, ...line }) => ({
            ...line,
            donation: donations[index].id,
          })),
        ),
      )
      const attempt = idSchema.parse(
        await create('payment_attempts', {
          checkout: checkout.id,
          provider,
          provider_payment_id: `${provider}_${randomUUID()}`,
          idempotency_key: `checkout:${randomUUID()}`,
          status: 'pending',
          amount_cents: total,
          currency: 'EUR',
          created_at: createdAt,
          updated_at: createdAt,
        }),
      )
      return { ok: true, reference, attemptId: attempt.id }
    } catch (error) {
      await update('checkouts', checkout.id, { status: 'failed' }).catch(
        () => undefined,
      )
      throw error
    }
  }

  async function readAttempt(id: string) {
    const response = await readItemsPaymentAttempts({
      ...reads,
      query: {
        fields: ['id', 'checkout', 'status', 'amount_cents', 'currency'],
        filter: { id: { _eq: id } },
        limit: 1,
      },
    })
    return rowsOf(attemptRowSchema, response).at(0) ?? null
  }

  async function readCheckout(filter: Record<string, unknown>) {
    const response = await readItemsCheckouts({
      ...reads,
      query: {
        fields: [
          'id',
          'reference',
          'status',
          'currency',
          'total_cents',
          'created_at',
          'paid_at',
        ],
        filter,
        limit: 1,
      },
    })
    return rowsOf(checkoutRowSchema, response).at(0) ?? null
  }

  async function getMockPayment(
    attemptId: string,
  ): Promise<MockPaymentDetails | null> {
    const attempt = await readAttempt(attemptId)
    if (!attempt) return null
    const checkout = await readCheckout({ id: { _eq: attempt.checkout } })
    if (!checkout) return null
    return {
      reference: checkout.reference,
      amountCents: attempt.amount_cents,
      currency: attempt.currency,
      status: attempt.status,
    }
  }

  async function findEvent(key: string) {
    const response = await readItemsPaymentEvents({
      ...reads,
      query: {
        fields: ['id', 'status'],
        filter: { provider_event_key: { _eq: key } },
        limit: 1,
      },
    })
    return rowsOf(eventRowSchema, response).at(0) ?? null
  }

  // Shared by the mock provider and a future provider webhook: each provider
  // event is stored once, and only open attempts/donations move forward.
  async function recordPaymentEvent(event: {
    provider: string
    eventId: string
    attemptId: string
    outcome: MockPaymentOutcome
  }) {
    const attemptId = z.uuid().parse(event.attemptId)
    const key = `${event.provider}:${event.eventId}`
    let stored: z.infer<typeof eventRowSchema>
    try {
      stored = eventRowSchema.parse(
        await create(
          'payment_events',
          {
            provider: event.provider,
            provider_event_key: key,
            event_type: `payment.${event.outcome}`,
            payment_attempt: attemptId,
            status: 'received',
            received_at: now(),
          },
          ['id', 'status'],
        ),
      )
    } catch (error) {
      if (
        !(error instanceof DirectusError) ||
        error.code !== 'RECORD_NOT_UNIQUE'
      ) {
        throw error
      }
      const existing = await findEvent(key)
      if (!existing) throw error
      stored = existing
    }
    if (stored.status !== 'received') return { duplicate: true, applied: false }

    const attempt = await readAttempt(attemptId)
    const transition = attemptOutcomes[event.outcome]
    let applied = false
    if (
      attempt &&
      (attempt.status === 'created' || attempt.status === 'pending')
    ) {
      await update('payment_attempts', attempt.id, {
        status: transition.attempt,
        failure_code: transition.failure,
        updated_at: now(),
      })
      const checkout = await readCheckout({ id: { _eq: attempt.checkout } })
      if (checkout?.status === 'pending') {
        await update('checkouts', checkout.id, {
          status: transition.checkout,
          ...(transition.checkout === 'paid' ? { paid_at: now() } : {}),
        })
      }
      applied = true
    }
    await update('payment_events', stored.id, {
      status: 'processed',
      processed_at: now(),
      error_code: applied ? null : 'stale_transition',
    })
    return { duplicate: false, applied }
  }

  async function getReceipt(
    reference: string,
  ): Promise<DonationReceipt | null> {
    const checkout = await readCheckout({ reference: { _eq: reference } })
    if (!checkout) return null
    const ofCheckout = { donation: { checkout: { _eq: checkout.id } } }
    const response = await readItemsDonationItems({
      ...reads,
      query: {
        fields: [
          'id',
          'donation.campaign.slug',
          'donation.campaign.translations.language',
          'donation.campaign.translations.title',
          'kind',
          'title_snapshot',
          'quantity',
          'unit_amount_cents',
          'total_cents',
        ],
        filter: ofCheckout,
        sort: ['kind'],
        limit: 100,
      },
    })
    const items = rowsOf(itemRowSchema, response)
    const refundedCents =
      checkout.status === 'paid'
        ? rowsOf(
            amountSchema,
            await readItemsRefunds({
              ...reads,
              query: {
                fields: ['amount_cents'],
                filter: {
                  _and: [ofCheckout, { status: { _eq: 'succeeded' } }],
                },
                limit: -1,
              },
            }),
          ).reduce((sum, refund) => sum + refund.amount_cents, 0)
        : 0
    return {
      reference: checkout.reference,
      status: receiptStatus(
        checkout.status,
        checkout.total_cents,
        refundedCents,
      ),
      totalCents: checkout.total_cents,
      currency: checkout.currency,
      createdAt: checkout.created_at ?? null,
      paidAt: checkout.paid_at ?? null,
      items: items
        .sort(
          (a, b) =>
            Number(a.kind === 'flexible') - Number(b.kind === 'flexible'),
        )
        .map((item) => ({
          id: item.id,
          kind: item.kind,
          title: item.title_snapshot,
          quantity: item.quantity,
          unitCents: item.unit_amount_cents,
          totalCents: item.total_cents,
          campaign: item.donation.campaign
            ? {
                slug: item.donation.campaign.slug,
                titles: Object.fromEntries(
                  item.donation.campaign.translations.map((translation) => [
                    translation.language,
                    translation.title,
                  ]),
                ),
              }
            : null,
        })),
    }
  }

  async function getCampaignRaised(slugs: string[]): Promise<CampaignRaised> {
    const campaigns = rowsOf(
      zItemsCampaigns.pick({ id: true, slug: true }),
      await readItemsCampaigns({
        ...reads,
        query: {
          fields: ['id', 'slug'],
          filter: {
            _and: [{ slug: { _in: slugs } }, { status: { _eq: 'published' } }],
          },
          limit: slugs.length,
        },
      }),
    )
    const result: CampaignRaised = Object.fromEntries(
      campaigns.map((campaign) => [
        campaign.slug,
        { raisedCents: 0, donationCount: 0 },
      ]),
    )
    if (!campaigns.length) return result
    const ids = campaigns.map((campaign) => campaign.id)
    const slugById = new Map(
      campaigns.map((campaign) => [campaign.id, campaign.slug]),
    )
    // Aggregation parameters are not part of Directus' OpenAPI spec.
    const totals = rowsOf(
      z.object({
        campaign: z.uuid(),
        sum: z.object({ total_cents: z.coerce.number().nullable() }),
        count: z.object({ id: z.coerce.number() }),
      }),
      await client.get<{ 200: { data?: unknown } }, unknown, true>({
        throwOnError: true,
        url: '/items/donations',
        query: {
          'aggregate[sum]': 'total_cents',
          'aggregate[count]': 'id',
          'groupBy[]': 'campaign',
          filter: {
            _and: [
              { campaign: { _in: ids } },
              { checkout: { status: { _eq: 'paid' } } },
            ],
          },
        },
      }),
    )
    for (const row of totals) {
      const slug = slugById.get(row.campaign)
      if (slug) {
        result[slug] = {
          raisedCents: row.sum.total_cents ?? 0,
          donationCount: row.count.id,
        }
      }
    }
    const refunds = rowsOf(
      amountSchema.extend({ donation: z.object({ campaign: z.uuid() }) }),
      await readItemsRefunds({
        ...reads,
        query: {
          fields: ['amount_cents', 'donation.campaign'],
          filter: {
            _and: [
              { status: { _eq: 'succeeded' } },
              { donation: { campaign: { _in: ids } } },
            ],
          },
          limit: -1,
        },
      }),
    )
    for (const refund of refunds) {
      const slug = slugById.get(refund.donation.campaign)
      const entry = slug ? result[slug] : undefined
      if (entry)
        entry.raisedCents = Math.max(entry.raisedCents - refund.amount_cents, 0)
    }
    return result
  }

  return {
    createCheckout,
    getMockPayment,
    recordPaymentEvent,
    getReceipt,
    getCampaignRaised,
  }
}

export type DonationService = ReturnType<typeof createDonationService>
