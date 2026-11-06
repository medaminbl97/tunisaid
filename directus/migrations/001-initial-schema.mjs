import {
  amount,
  applyPermissions,
  applySchema,
  choices,
  collection,
  ensureRolePolicy,
  findPublicPolicy,
  flag,
  inlineToolbar,
  m2mAlias,
  note,
  o2mAlias,
  reference,
  relation,
  required,
  richText,
  text,
  timestamp,
  translationsAlias,
  unique,
} from '../scripts/schema.mjs'

export const version = '001'
export const name = 'initial-schema'

const publication = () => choices('status', ['draft', 'published', 'archived'])
const currency = () => choices('currency', ['EUR'])

// Stored payment lifecycle of a checkout. Refund state is derived from `refunds`.
export const donationStatuses = [
  'pending',
  'paid',
  'failed',
  'cancelled',
  'expired',
]

// ---------------------------------------------------------------------------
// Content catalog
// ---------------------------------------------------------------------------

const catalog = [
  collection('languages', [required('name')], {
    stringId: true,
    icon: 'translate',
  }),
  collection(
    'categories',
    [unique('slug'), publication(), amount('sort'), translationsAlias()],
    { icon: 'category' },
  ),
  collection(
    'partners',
    [
      unique('slug'),
      required('name'),
      publication(),
      text('website'),
      reference('logo'),
    ],
    { icon: 'handshake' },
  ),
  collection(
    'projects',
    [
      unique('slug'),
      publication(),
      reference('cover_image'),
      timestamp('starts_at'),
      timestamp('ends_at'),
      translationsAlias(),
      m2mAlias('campaigns'),
      o2mAlias('purposes'),
    ],
    { icon: 'volunteer_activism' },
  ),
  collection(
    'campaigns',
    [
      unique('slug'),
      publication(),
      amount('goal_cents'),
      currency(),
      timestamp('starts_at'),
      timestamp('ends_at'),
      reference('cover_image'),
      translationsAlias(),
      m2mAlias('projects'),
    ],
    { icon: 'campaign' },
  ),
  collection(
    'campaign_projects',
    [reference('campaign', 'uuid', true), reference('project', 'uuid', true)],
    { hidden: true },
  ),
  collection(
    'donation_purposes',
    [
      unique('slug'),
      publication(),
      reference('category'),
      reference('project'),
      amount('unit_amount_cents'),
      currency(),
      reference('image'),
      amount('sort'),
      flag('is_illustrative', true),
      translationsAlias(),
    ],
    {
      icon: 'redeem',
      note: 'Without a project, a purpose is a general purpose. A project link records donor intent; it does not move money.',
    },
  ),
]

export const translatedCollections = {
  categories: [required('title')],
  projects: [
    required('title'),
    note('summary'),
    richText('body'),
    text('image_alt'),
  ],
  campaigns: [
    required('title'),
    note('summary'),
    richText('body'),
    text('image_alt'),
  ],
  donation_purposes: [
    required('title'),
    text('category_label'),
    richText('description', inlineToolbar),
    text('impact'),
    text('unit_label'),
    text('basket_title'),
    text('image_alt'),
  ],
}

const translations = Object.entries(translatedCollections).map(
  ([parent, fields]) =>
    collection(
      `${parent}_translations`,
      [
        reference('parent', 'uuid', true),
        reference('language', 'string', true),
        ...fields,
      ],
      { hidden: true },
    ),
)

// ---------------------------------------------------------------------------
// Private donation ledger
// ---------------------------------------------------------------------------

const ledger = [
  collection(
    'donors',
    [
      text('display_name'),
      text('email'),
      text('country_code'),
      choices('preferred_language', ['en', 'de']),
      flag('keep_name_private', true),
      timestamp('created_at'),
    ],
    {
      icon: 'person',
      note: 'Private personal data. Apply retention and access policies before production.',
    },
  ),
  collection(
    'checkouts',
    [
      unique('reference'),
      reference('donor'),
      choices('status', donationStatuses),
      currency(),
      amount('total_cents'),
      timestamp('created_at'),
      timestamp('paid_at'),
      o2mAlias('donations'),
      o2mAlias('payment_attempts'),
    ],
    {
      icon: 'shopping_cart',
      note: 'One basket and its single payment. Payment state is changed only by the verified server integration.',
    },
  ),
  collection(
    'donations',
    [
      reference('checkout', 'uuid', true),
      reference('campaign'),
      currency(),
      amount('total_cents'),
      o2mAlias('items'),
      o2mAlias('refunds'),
    ],
    {
      icon: 'payments',
      note: "One share of a checkout per campaign (or without a campaign). Payment state is the checkout's; refund state is derived from linked refunds.",
    },
  ),
  collection(
    'donation_items',
    [
      reference('donation', 'uuid', true),
      reference('purpose'),
      choices('kind', ['purpose', 'flexible']),
      required('title_snapshot'),
      amount('quantity', 1),
      amount('unit_amount_cents'),
      amount('total_cents'),
      text('requested_purpose_snapshot'),
    ],
    {
      hidden: true,
      note: 'Historical snapshots: catalog edits must not rewrite financial records.',
    },
  ),
  collection(
    'payment_attempts',
    [
      reference('checkout', 'uuid', true),
      required('provider'),
      text('provider_payment_id', { is_unique: true }),
      unique('idempotency_key'),
      choices('status', [
        'created',
        'pending',
        'succeeded',
        'failed',
        'cancelled',
      ]),
      amount('amount_cents'),
      currency(),
      text('failure_code'),
      timestamp('created_at'),
      timestamp('updated_at'),
    ],
    { icon: 'credit_card' },
  ),
  collection(
    'payment_events',
    [
      required('provider'),
      unique('provider_event_key'),
      required('event_type'),
      reference('payment_attempt'),
      choices('status', ['received', 'processed', 'failed']),
      timestamp('received_at'),
      timestamp('processed_at'),
      text('error_code'),
    ],
    {
      icon: 'receipt_long',
      note: 'Use provider:event-id as the unique key. Do not store raw card or unnecessary personal data.',
    },
  ),
  collection(
    'refunds',
    [
      reference('donation', 'uuid', true),
      reference('payment_attempt', 'uuid', true),
      required('provider'),
      text('provider_refund_id', { is_unique: true }),
      unique('idempotency_key'),
      choices('status', ['pending', 'succeeded', 'failed']),
      amount('amount_cents'),
      currency(),
      text('reason_code'),
      timestamp('created_at'),
    ],
    {
      icon: 'undo',
      note: "Record refunds after they were issued at the payment provider, on the donation (campaign share) they reduce. Succeeded refunds reduce campaign totals and the checkout's receipt status.",
    },
  ),
]

export const collections = [...catalog, ...translations, ...ledger]

const cascade = { onDelete: 'CASCADE' }

export const relations = [
  relation('partners', 'logo', 'directus_files'),
  relation('projects', 'cover_image', 'directus_files'),
  relation('campaigns', 'cover_image', 'directus_files'),
  relation('campaign_projects', 'campaign', 'campaigns', {
    ...cascade,
    oneField: 'projects',
    junctionField: 'project',
  }),
  relation('campaign_projects', 'project', 'projects', {
    ...cascade,
    oneField: 'campaigns',
    junctionField: 'campaign',
  }),
  relation('donation_purposes', 'category', 'categories'),
  relation('donation_purposes', 'project', 'projects', {
    oneField: 'purposes',
  }),
  relation('donation_purposes', 'image', 'directus_files'),
  ...Object.keys(translatedCollections).flatMap((parent) => [
    relation(`${parent}_translations`, 'parent', parent, {
      ...cascade,
      oneField: 'translations',
      junctionField: 'language',
    }),
    relation(`${parent}_translations`, 'language', 'languages', {
      junctionField: 'parent',
    }),
  ]),
  relation('checkouts', 'donor', 'donors'),
  relation('donations', 'checkout', 'checkouts', { oneField: 'donations' }),
  relation('donations', 'campaign', 'campaigns'),
  relation('donation_items', 'donation', 'donations', { oneField: 'items' }),
  relation('donation_items', 'purpose', 'donation_purposes'),
  relation('payment_attempts', 'checkout', 'checkouts', {
    oneField: 'payment_attempts',
  }),
  relation('payment_events', 'payment_attempt', 'payment_attempts'),
  relation('refunds', 'donation', 'donations', { oneField: 'refunds' }),
  relation('refunds', 'payment_attempt', 'payment_attempts'),
]

// ---------------------------------------------------------------------------
// Access: anonymous visitors read published catalog content only
// ---------------------------------------------------------------------------

const published = { status: { _eq: 'published' } }
const translationFields = (parent) => [
  'id',
  'parent',
  'language',
  ...translatedCollections[parent].map((item) => item.field),
]

export const publicGrants = [
  {
    collection: 'projects',
    fields: [
      'id',
      'slug',
      'status',
      'cover_image',
      'starts_at',
      'ends_at',
      'translations',
    ],
    permissions: published,
  },
  {
    collection: 'campaigns',
    fields: [
      'id',
      'slug',
      'status',
      'goal_cents',
      'currency',
      'starts_at',
      'ends_at',
      'cover_image',
      'translations',
      'projects',
    ],
    permissions: published,
  },
  {
    collection: 'campaign_projects',
    fields: ['id', 'campaign', 'project'],
    permissions: { _and: [{ campaign: published }, { project: published }] },
  },
  {
    collection: 'categories',
    fields: ['id', 'slug', 'status', 'sort', 'translations'],
    permissions: published,
  },
  {
    collection: 'donation_purposes',
    fields: [
      'id',
      'slug',
      'status',
      'category',
      'project',
      'unit_amount_cents',
      'currency',
      'image',
      'sort',
      'is_illustrative',
      'translations',
    ],
    permissions: published,
  },
  ...Object.keys(translatedCollections).map((parent) => ({
    collection: `${parent}_translations`,
    fields: translationFields(parent),
    permissions: { parent: published },
  })),
].map((grant) => ({ ...grant, action: 'read' }))

// ---------------------------------------------------------------------------
// Access: the website server (static token) records donations and payments.
// It cannot read donor details, delete anything or create refunds.
// ---------------------------------------------------------------------------

export const serviceRole = {
  name: 'Donation service',
  body: {
    icon: 'support_agent',
    description: 'Website server: creates donations and records payments.',
  },
}
export const servicePolicy = {
  name: 'donation-service-policy',
  body: {
    icon: 'lock',
    admin_access: false,
    app_access: false,
    description: 'Least-privilege access for the website donation server.',
  },
}

export const serviceGrants = [
  {
    collection: 'donation_purposes',
    action: 'read',
    fields: [
      'id',
      'slug',
      'status',
      'project',
      'unit_amount_cents',
      'currency',
      'translations',
    ],
    permissions: published,
  },
  {
    collection: 'donation_purposes_translations',
    action: 'read',
    fields: ['id', 'parent', 'language', 'title', 'basket_title'],
    permissions: { parent: published },
  },
  {
    collection: 'campaigns',
    action: 'read',
    fields: [
      'id',
      'slug',
      'status',
      'starts_at',
      'ends_at',
      'goal_cents',
      'translations',
    ],
    permissions: published,
  },
  {
    collection: 'campaigns_translations',
    action: 'read',
    fields: ['id', 'parent', 'language', 'title'],
    permissions: { parent: published },
  },
  {
    collection: 'campaign_projects',
    action: 'read',
    fields: ['id', 'campaign', 'project'],
    permissions: { campaign: published },
  },
  {
    collection: 'donors',
    action: 'create',
    fields: [
      'display_name',
      'email',
      'country_code',
      'preferred_language',
      'keep_name_private',
      'created_at',
    ],
  },
  { collection: 'donors', action: 'read', fields: ['id'] },
  {
    collection: 'checkouts',
    action: 'create',
    fields: [
      'reference',
      'donor',
      'status',
      'currency',
      'total_cents',
      'created_at',
    ],
    validation: { status: { _eq: 'pending' } },
  },
  {
    collection: 'checkouts',
    action: 'read',
    fields: [
      'id',
      'reference',
      'status',
      'currency',
      'total_cents',
      'created_at',
      'paid_at',
    ],
  },
  {
    collection: 'checkouts',
    action: 'update',
    fields: ['status', 'paid_at'],
    permissions: { status: { _eq: 'pending' } },
    validation: { status: { _in: donationStatuses } },
  },
  {
    collection: 'donations',
    action: 'create',
    fields: ['checkout', 'campaign', 'currency', 'total_cents'],
  },
  {
    collection: 'donations',
    action: 'read',
    fields: ['id', 'checkout', 'campaign', 'currency', 'total_cents'],
  },
  {
    collection: 'donation_items',
    action: 'create',
    fields: [
      'donation',
      'purpose',
      'kind',
      'title_snapshot',
      'quantity',
      'unit_amount_cents',
      'total_cents',
      'requested_purpose_snapshot',
    ],
  },
  {
    collection: 'donation_items',
    action: 'read',
    fields: [
      'id',
      'donation',
      'kind',
      'title_snapshot',
      'quantity',
      'unit_amount_cents',
      'total_cents',
    ],
  },
  {
    collection: 'payment_attempts',
    action: 'create',
    fields: [
      'checkout',
      'provider',
      'provider_payment_id',
      'idempotency_key',
      'status',
      'amount_cents',
      'currency',
      'created_at',
      'updated_at',
    ],
    validation: { status: { _in: ['created', 'pending'] } },
  },
  {
    collection: 'payment_attempts',
    action: 'read',
    fields: [
      'id',
      'checkout',
      'provider',
      'provider_payment_id',
      'status',
      'amount_cents',
      'currency',
      'failure_code',
    ],
  },
  {
    collection: 'payment_attempts',
    action: 'update',
    fields: ['status', 'provider_payment_id', 'failure_code', 'updated_at'],
    permissions: { status: { _in: ['created', 'pending'] } },
  },
  {
    collection: 'payment_events',
    action: 'create',
    fields: [
      'provider',
      'provider_event_key',
      'event_type',
      'payment_attempt',
      'status',
      'received_at',
    ],
    validation: { status: { _eq: 'received' } },
  },
  {
    collection: 'payment_events',
    action: 'read',
    fields: ['id', 'provider_event_key', 'event_type', 'status'],
  },
  {
    collection: 'payment_events',
    action: 'update',
    fields: ['status', 'processed_at', 'error_code'],
    permissions: { status: { _eq: 'received' } },
  },
  {
    collection: 'refunds',
    action: 'read',
    fields: ['id', 'donation', 'status', 'amount_cents'],
  },
]

export async function up(request) {
  await applySchema(request, collections, relations)
  await applyPermissions(request, await findPublicPolicy(request), publicGrants)
  await applyPermissions(
    request,
    await ensureRolePolicy(request, serviceRole, servicePolicy),
    serviceGrants,
  )
}
