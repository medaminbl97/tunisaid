export const field = (name, type, schema = {}, meta = {}) => ({
  field: name,
  type,
  schema,
  meta: { interface: type === 'text' ? 'input-multiline' : 'input', ...meta },
})

export const text = (name, schema = {}) => field(name, 'string', schema)
export const required = (name) => text(name, { is_nullable: false })
export const unique = (name) =>
  text(name, { is_nullable: false, is_unique: true })
export const amount = (name, defaultValue = 0) =>
  field(
    name,
    'integer',
    { is_nullable: false, default_value: defaultValue },
    {
      validation: { [name]: { _gte: 0 } },
    },
  )
export const flag = (name, defaultValue) =>
  field(
    name,
    'boolean',
    { is_nullable: false, default_value: defaultValue },
    { interface: 'boolean' },
  )
export const timestamp = (name) =>
  field(name, 'timestamp', {}, { interface: 'datetime' })
export const note = (name) => field(name, 'text')

export const articleToolbar = [
  'undo',
  'redo',
  'h2',
  'h3',
  'bold',
  'italic',
  'underline',
  'bullist',
  'numlist',
  'blockquote',
  'customLink',
  'unlink',
  'customImage',
  'table',
  'removeformat',
  'fullscreen',
  'code',
]
export const inlineToolbar = [
  'undo',
  'redo',
  'bold',
  'italic',
  'underline',
  'bullist',
  'numlist',
  'customLink',
  'unlink',
  'removeformat',
]

// Every body/description rendered by the website is sanitized HTML.
export const richText = (name, toolbar = articleToolbar) =>
  field(
    name,
    'text',
    {},
    {
      interface: 'input-rich-text-html',
      display: 'formatted-value',
      display_options: { format: true },
      width: 'full',
      options: { toolbar },
    },
  )

export const reference = (name, type = 'uuid', required = false) =>
  field(
    name,
    type,
    { is_nullable: !required },
    {
      special: ['m2o'],
      interface: 'select-dropdown-m2o',
    },
  )
export const choices = (name, values, defaultValue = values[0]) =>
  field(
    name,
    'string',
    { is_nullable: false, default_value: defaultValue },
    {
      interface: 'select-dropdown',
      options: { choices: values.map((value) => ({ text: value, value })) },
      validation: { [name]: { _in: values } },
    },
  )

export const translationsAlias = () => ({
  field: 'translations',
  type: 'alias',
  meta: {
    special: ['translations'],
    interface: 'translations',
    options: { languageField: 'name', defaultLanguage: 'en' },
  },
})
export const m2mAlias = (name) => ({
  field: name,
  type: 'alias',
  meta: { special: ['m2m'], interface: 'list-m2m' },
})
export const o2mAlias = (name) => ({
  field: name,
  type: 'alias',
  meta: { special: ['o2m'], interface: 'list-o2m' },
})

export function collection(name, fields, options = {}) {
  return {
    collection: name,
    meta: {
      icon: options.icon ?? 'folder',
      accountability: 'all',
      ...(options.hidden ? { hidden: true } : {}),
      ...(options.note ? { note: options.note } : {}),
    },
    schema: {},
    fields: [
      options.stringId
        ? field('id', 'string', { is_primary_key: true, is_nullable: false })
        : field(
            'id',
            'uuid',
            { is_primary_key: true, is_nullable: false },
            { special: ['uuid'], hidden: true },
          ),
      ...fields,
    ],
  }
}

// Owned rows (translations, junction links) cascade with their parent; every
// other reference is RESTRICT so catalog and financial history stay intact.
export function relation(collectionName, fieldName, target, options = {}) {
  return {
    collection: collectionName,
    field: fieldName,
    related_collection: target,
    schema: { on_delete: options.onDelete ?? 'RESTRICT' },
    meta: {
      one_field: options.oneField ?? null,
      junction_field: options.junctionField ?? null,
    },
  }
}

export async function applySchema(request, definitions, relations) {
  const existing = new Set(
    (await request('/collections')).map((item) => item.collection),
  )
  for (const definition of definitions) {
    const name = definition.collection
    if (!existing.has(name)) {
      await request('/collections', { method: 'POST', body: definition })
      console.log(`Created collection ${name}`)
    } else {
      const current = new Map(
        (await request(`/fields/${name}`)).map((item) => [item.field, item]),
      )
      for (const desired of definition.fields) {
        const found = current.get(desired.field)
        if (!found) {
          await request(`/fields/${name}`, { method: 'POST', body: desired })
        } else if (found.type !== desired.type) {
          throw new Error(
            `Schema drift: ${name}.${desired.field} is ${found.type}, expected ${desired.type}.`,
          )
        }
      }
    }
  }
  const currentRelations = new Map(
    (await request('/relations')).map((item) => [
      `${item.collection}.${item.field}`,
      item,
    ]),
  )
  for (const desired of relations) {
    const key = `${desired.collection}.${desired.field}`
    const found = currentRelations.get(key)
    if (found && found.related_collection !== desired.related_collection) {
      throw new Error(
        `Relation drift: ${key} points to a different collection.`,
      )
    }
    if (!found) await request('/relations', { method: 'POST', body: desired })
  }
}

export async function findPublicPolicy(request) {
  const [access] = await request(
    '/access?filter[role][_null]=true&filter[user][_null]=true&fields=policy&limit=1',
  )
  if (!access?.policy) throw new Error('Directus Public policy not found.')
  return access.policy
}

async function findOrCreate(request, endpoint, name, body) {
  const [existing] = await request(
    `/${endpoint}?filter[name][_eq]=${encodeURIComponent(name)}&fields=id&limit=1`,
  )
  if (existing) return existing.id
  const created = await request(`/${endpoint}`, {
    method: 'POST',
    body: { name, ...body },
  })
  return created.id
}

export async function ensureRolePolicy(request, role, policy) {
  const roleId = await findOrCreate(request, 'roles', role.name, role.body)
  const policyId = await findOrCreate(
    request,
    'policies',
    policy.name,
    policy.body,
  )
  const links = await request(
    `/access?filter[role][_eq]=${roleId}&filter[policy][_eq]=${policyId}&fields=id&limit=1`,
  )
  if (!links.length) {
    await request('/access', {
      method: 'POST',
      body: { role: roleId, policy: policyId },
    })
  }
  return policyId
}

export async function applyPermissions(request, policy, grants) {
  for (const grant of grants) {
    const existing = await request(
      `/permissions?filter[policy][_eq]=${policy}&filter[collection][_eq]=${grant.collection}&filter[action][_eq]=${grant.action}&fields=id&limit=1`,
    )
    const body = {
      fields: grant.fields,
      permissions: grant.permissions ?? null,
      validation: grant.validation ?? null,
      presets: null,
    }
    if (existing.length) {
      await request(`/permissions/${existing[0].id}`, {
        method: 'PATCH',
        body,
      })
    } else {
      await request('/permissions', {
        method: 'POST',
        body: {
          ...body,
          policy,
          collection: grant.collection,
          action: grant.action,
        },
      })
    }
  }
}
