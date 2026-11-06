import { createClient, createConfig } from '#/api/generated/client'
import type { Client } from '#/api/generated/client'
import type {
  ItemsCheckouts,
  ItemsDonationItems,
  ItemsDonations,
  ItemsDonors,
  ItemsPaymentAttempts,
  ItemsPaymentEvents,
} from '#/api/generated/types.gen'
import { serializeDirectusQuery } from '#/api/directus-query'

export class DirectusError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
    path: string,
  ) {
    super(
      `Directus request to ${path} failed: HTTP ${status}${code ? ` ${code}` : ''}`,
    )
    this.name = 'DirectusError'
  }
}

export type ServiceConnection = {
  directusUrl: string
  serviceToken: string
  fetch?: typeof fetch
}

type WritableItems = {
  donors: ItemsDonors
  checkouts: ItemsCheckouts
  donations: ItemsDonations
  donation_items: ItemsDonationItems
  payment_attempts: ItemsPaymentAttempts
  payment_events: ItemsPaymentEvents
}
// Directus' spec reuses read schemas for writes, marking ids and other fields
// as required. Writes send only the fields being set; Directus creates ids.
type ItemInput<T> = Partial<Omit<T, 'id'>>
type Collection = keyof WritableItems

const errorCodeOf = (payload: unknown) =>
  (
    payload as { errors?: Array<{ extensions?: { code?: string } }> } | null
  )?.errors?.at(0)?.extensions?.code

// Server-only: the service token must never be imported into browser code.
export function createServiceClient(connection: ServiceConnection) {
  const fetcher = connection.fetch ?? fetch
  const client: Client = createClient(
    createConfig({
      baseUrl: connection.directusUrl,
      headers: {
        Authorization: `Bearer ${connection.serviceToken}`,
        'Content-Type': 'application/json',
      },
      fetch: (input, init) =>
        fetcher(input, { ...init, signal: AbortSignal.timeout(15_000) }),
      querySerializer: serializeDirectusQuery,
      throwOnError: true,
    }),
  )
  client.interceptors.error.use((error, response, request) =>
    response
      ? new DirectusError(
          response.status,
          errorCodeOf(error),
          request ? new URL(request.url).pathname : '',
        )
      : error,
  )

  // Generated read operations validate full records, but Directus returns only
  // the requested fields; each caller parses its own narrow schema instead.
  const reads = {
    client,
    throwOnError: true,
    querySerializer: serializeDirectusQuery,
    responseValidator: undefined,
  } as const

  async function create<TCollection extends Collection>(
    collection: TCollection,
    body:
      | ItemInput<WritableItems[TCollection]>
      | Array<ItemInput<WritableItems[TCollection]>>,
    fields: string[] = ['id'],
  ): Promise<unknown> {
    const { data } = await client.post({
      throwOnError: true,
      url: '/items/{collection}',
      path: { collection },
      query: { fields },
      body,
    })
    return (data as { data?: unknown } | undefined)?.data
  }

  async function update<TCollection extends Collection>(
    collection: TCollection,
    id: string,
    body: ItemInput<WritableItems[TCollection]>,
  ) {
    await client.patch({
      throwOnError: true,
      url: '/items/{collection}/{id}',
      path: { collection, id },
      query: { fields: ['id'] },
      body,
    })
  }

  return { client, reads, create, update }
}

export type ServiceClient = ReturnType<typeof createServiceClient>
