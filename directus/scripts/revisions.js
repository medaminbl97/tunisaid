// Alembic-style revisions for a Directus backend.
//
//   schemas/*.yaml          the model (like SQLModel classes); the only place you edit
//   revisions/0002_name/    one revision, written by `generate`, committed:
//     schema.json             Directus schema snapshot after this revision (generated)
//     changes.json            what up and down change, for review and as a guard (generated)
//     up.sql, down.sql        optional data steps (hand-written, data only)
//
// Upgrade to k runs three steps, so up.sql can still read what is being dropped:
//   1. add:  apply what the diff to schema.json(k) adds or changes (no deletions)
//   2. up.sql, with old and new fields both present
//   3. drop: apply the deletions
// Downgrade k is the mirror: re-add what the previous schema had, down.sql, then
// drop what k added. Every step is recorded in app_meta.revisions.state, so an
// interrupted run continues where it stopped.
//
// The diff is computed live, so a recreated field that differs in some detail
// does not break anything. A live diff that would delete something the revision
// does not list (for example a field added in the admin app) is refused.
// Collections that no revision ever contained are never touched.
// Applied revisions are recorded in app_meta.revisions, outside the `public`
// schema, so Directus never sees that table.
//
// Commands (inside the container, see tools/revisions-cli.sh):
//   upgrade            apply pending revisions (the entrypoint does this)
//   down               undo the newest applied revision
//   status             applied / pending / partial per revision
//   stamp <id|head>    record revisions as applied without running them
//                      (adopting a database that already matches them)
//   check              fail if the YAML has changes no revision contains
//   generate <dir>     write a new revision for the YAML into <dir>; the instance
//                      must be at the newest revision (a throwaway database)
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  desiredSnapshot,
  loadDefinitions,
  loginAsAdmin,
  request,
  waitForDirectus,
} from './schema-model.js'

const root = new URL('../', import.meta.url)
export const revisionsDir = fileURLToPath(new URL('revisions/', root))
const schemasDir = fileURLToPath(new URL('schemas/', root))

const NAME = /^\d{4}_[a-z0-9_]+$/
const FILES = new Set(['schema.json', 'changes.json', 'up.sql', 'down.sql'])
const DDL =
  /\b(?:ALTER|CREATE|DROP|TRUNCATE)\s+(?:TABLE|INDEX|SCHEMA|TYPE|VIEW|SEQUENCE)\b|\bRENAME\s+(?:COLUMN|TO)\b/i

// ---------------------------------------------------------------------------
// Pure helpers (unit tested)
// ---------------------------------------------------------------------------

// Whole-object changes carry no `path`; property edits and property deletions do.
const whole = (changes, kind) =>
  (changes ?? []).some((change) => change.kind === kind && !change.path)
const isDeletion = (entry) => whole(entry.diff, 'D')

// One line per change: "+ campaigns.goal_amount", "- campaigns.goal_cents", "~ ...".
export function describe(result) {
  const sign = (changes) =>
    whole(changes, 'D') ? '-' : whole(changes, 'N') ? '+' : '~'
  const { collections, fields, relations } = result.diff
  return [
    ...collections.map((item) => `${sign(item.diff)} ${item.collection}`),
    ...fields.map(
      (item) => `${sign(item.diff)} ${item.collection}.${item.field}`,
    ),
    ...relations.map(
      (item) => `${sign(item.diff)} relation ${item.collection}.${item.field}`,
    ),
  ]
}

const mapEntries = (result, keep) => ({
  ...result,
  diff: {
    ...result.diff,
    collections: result.diff.collections.filter(keep),
    fields: result.diff.fields.filter(keep),
    relations: result.diff.relations.filter(keep),
  },
})

export const withoutDeletions = (result) =>
  mapEntries(result, (entry) => !isDeletion(entry))

export const onlyCollections = (result, names) =>
  mapEntries(result, (entry) => names.has(entry.collection))

// Collections any revision ever contained: the ones this project owns.
export const ownedCollections = (schemas) =>
  new Set(
    schemas.flatMap((schema) =>
      schema.collections.map((item) => item.collection),
    ),
  )

// Owned collections that exist on the instance but are no longer declared.
export function removedCollections(owned, definitions, snapshot) {
  return [...owned].filter(
    (name) =>
      !definitions.some((item) => item.collection === name) &&
      snapshot.collections.some((item) => item.collection === name),
  )
}

export const unexpectedDeletions = (lines, expected) =>
  lines.filter((line) => line.startsWith('- ') && !expected.includes(line))

const stripSqlComments = (sql) =>
  sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '')

// SQL steps move data. The schema is the YAML's job, and Directus's own tables
// are Directus's.
export function checkSql(name, sql) {
  const code = stripSqlComments(sql)
  const problems = []
  if (DDL.test(code)) {
    problems.push(
      `${name}: schema changes belong in schemas/*.yaml, not in SQL`,
    )
  }
  if (/directus_/i.test(code)) {
    problems.push(`${name}: must not touch Directus system tables (directus_*)`)
  }
  return problems
}

export function checkRevisionFiles(name, files) {
  const problems = []
  if (!NAME.test(name))
    problems.push(`${name}: folder must look like 0002_short_name`)
  for (const required of ['schema.json', 'changes.json']) {
    if (!files.includes(required)) {
      problems.push(
        `${name}: missing ${required} (create revisions with make revision)`,
      )
    }
  }
  for (const file of files) {
    if (!FILES.has(file)) problems.push(`${name}: unexpected file ${file}`)
  }
  return problems
}

// Revisions are numbered 0001, 0002, ... without gaps or repeats.
export function checkNumbering(names) {
  const problems = []
  names.forEach((name, index) => {
    const expected = String(index + 1).padStart(4, '0')
    if (NAME.test(name) && name.slice(0, 4) !== expected) {
      problems.push(`${name}: expected number ${expected} (no gaps or repeats)`)
    }
  })
  return problems
}

// Validates every revision folder; nothing touches the database before this passes.
export async function checkRevisions(dir = revisionsDir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch((error) =>
    error.code === 'ENOENT' ? [] : Promise.reject(error),
  )
  const names = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
  const problems = checkNumbering(names)
  for (const name of names) {
    const files = await readdir(path.join(dir, name))
    problems.push(...checkRevisionFiles(name, files))
    for (const file of files.filter((item) => item.endsWith('.sql'))) {
      problems.push(
        ...checkSql(
          `${name}/${file}`,
          await readFile(path.join(dir, name, file), 'utf8'),
        ),
      )
    }
  }
  if (problems.length)
    throw new Error(`Invalid revisions:\n- ${problems.join('\n- ')}`)
  return names
}

// ---------------------------------------------------------------------------
// The state machine. `step` hides the database and Directus:
//   schema(phase)         'add' or 'drop' towards the revision's target schema
//   record(state)         insert or update the revision's state
//   sql(direction, state) run up.sql or down.sql in a transaction that also
//                         records `state`
//   remove()              forget the revision
// States: added -> sql -> done (upgrade); down-added -> down-sql -> (removed).
// ---------------------------------------------------------------------------

export async function applyRevision(step, state, id = 'revision') {
  if (state?.startsWith('down-')) {
    throw new Error(
      `${id} is half undone (${state}). Run \`down\` again to finish undoing it.`,
    )
  }
  if (state === undefined) {
    await step.schema('add')
    await step.record('added')
    state = 'added'
  }
  if (state === 'added') {
    await step.sql('up', 'sql')
    state = 'sql'
  }
  if (state === 'sql') {
    await step.schema('drop')
    await step.record('done')
  }
}

export async function undoRevision(step, state) {
  if (state === 'done' || state === 'sql') {
    // Bring back what the previous schema had; what this revision added stays for down.sql.
    await step.schema('add')
    await step.record('down-added')
    state = 'down-added'
  }
  if (state === 'down-added') {
    await step.sql('down', 'down-sql')
    state = 'down-sql'
  }
  // 'added': up.sql never ran, so there is no data to move back.
  if (state === 'added' || state === 'down-sql') {
    await step.schema('drop')
  }
  await step.remove()
}

// ---------------------------------------------------------------------------
// Database and Directus
// ---------------------------------------------------------------------------

// Directus's own knex and pg, resolved through its package.
function database(env) {
  const api = realpathSync('/directus/node_modules/@directus/api')
  const knex = createRequire(path.join(api, 'package.json'))('knex')
  return knex({
    client: 'pg',
    connection: {
      host: env.DB_HOST,
      port: Number(env.DB_PORT ?? 5432),
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_DATABASE,
    },
  })
}

async function ensureTable(db) {
  await db.raw('create schema if not exists app_meta')
  await db.raw(`create table if not exists app_meta.revisions (
    id text primary key,
    state text not null,
    applied_at timestamptz not null default now()
  )`)
}

const appliedStates = async (db) =>
  new Map(
    (await db('app_meta.revisions').select()).map((row) => [row.id, row.state]),
  )

const readText = (file) =>
  readFile(file, 'utf8').catch((error) =>
    error.code === 'ENOENT' ? null : Promise.reject(error),
  )
const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'))
const revisionFile = (id, name) => path.join(revisionsDir, id, name)

async function loadAll() {
  const names = await checkRevisions()
  const schemas = await Promise.all(
    names.map((id) => readJson(revisionFile(id, 'schema.json'))),
  )
  return { names, owned: ownedCollections(schemas) }
}

async function session(env, token) {
  if (token) return token
  await waitForDirectus()
  return loginAsAdmin(env)
}

const snapshot = async (token) =>
  (await request('/schema/snapshot', { token })).data

// The schema before the first revision: no user collections.
const empty = (current) => ({
  ...current,
  collections: [],
  fields: [],
  relations: [],
})

async function diffTo(target, token) {
  const result = await request('/schema/diff?force=true', {
    method: 'POST',
    body: target,
    token,
  })
  return result?.data?.diff ? result.data : null
}

// Brings the instance towards `target`, refusing deletions that `expected` does
// not list. phase 'add' applies everything except deletions; phase 'drop'
// applies what is left, recomputed against the current state.
async function migrateSchema({ target, expected, label, token, owned, phase }) {
  const full = await diffTo(target, token)
  if (!full) return
  const scoped = onlyCollections(full, owned)
  const lines = describe(scoped)
  if (!lines.length) return
  const unexpected = unexpectedDeletions(lines, expected)
  if (unexpected.length) {
    throw new Error(
      `${label} would also delete ${unexpected.join(', ')}, which the revision does not list. ` +
        'The database has drifted from the revisions; fix that first.',
    )
  }
  const extra = lines.filter((line) => !expected.includes(line))
  if (extra.length) console.log(`${label}: also syncing ${extra.join(', ')}`)
  const diff = phase === 'add' ? withoutDeletions(scoped) : scoped
  if (!describe(diff).length) return
  await request('/schema/apply', { method: 'POST', body: diff, token })
}

function makeStep({ db, id, target, expected, label, token, owned }) {
  return {
    schema: (phase) =>
      migrateSchema({ target, expected, label, token, owned, phase }),
    record: (state) =>
      db('app_meta.revisions')
        .insert({ id, state })
        .onConflict('id')
        .merge({ state }),
    sql: async (direction, state) => {
      const text = await readText(revisionFile(id, `${direction}.sql`))
      await db.transaction(async (trx) => {
        if (text?.trim()) await trx.raw(text)
        await trx('app_meta.revisions').where({ id }).update({ state })
      })
    },
    remove: () => db('app_meta.revisions').where({ id }).delete(),
  }
}

// YAML changes that no revision contains, as change lines (empty when none).
async function pendingYamlChanges(token, owned) {
  const definitions = await loadDefinitions(schemasDir)
  const current = await snapshot(token)
  const desired = desiredSnapshot(current, definitions, {
    dropCollections: removedCollections(owned, definitions, current),
  })
  const diff = await diffTo(desired, token)
  return diff ? { diff, lines: describe(diff) } : null
}

export async function upgrade({ env = process.env, token } = {}) {
  const { names, owned } = await loadAll()
  const db = database(env)
  try {
    await ensureTable(db)
    const applied = await appliedStates(db)

    // An older image must not start on a newer database: undo first.
    const unknown = [...applied.keys()].filter((id) => !names.includes(id))
    if (unknown.length) {
      throw new Error(
        `The database has revisions this release does not contain: ${unknown.join(', ')}. ` +
          'Run `down` with the newer release first.',
      )
    }

    token = await session(env, token)
    let count = 0
    for (const id of names) {
      const state = applied.get(id)
      if (state === 'done') continue
      const changes = await readJson(revisionFile(id, 'changes.json'))
      const target = await readJson(revisionFile(id, 'schema.json'))
      const step = makeStep({
        db,
        id,
        target,
        expected: changes.up,
        label: `Revision ${id}`,
        token,
        owned,
      })
      await applyRevision(step, state, id)
      console.log(`Applied revision ${id}.`)
      count++
    }
    if (!count) console.log('Revisions are up to date.')

    // The YAML should be fully described by the revisions.
    const pending = await pendingYamlChanges(token, owned)
    if (pending) {
      console.warn(
        `WARNING: the YAML has changes no revision contains (${pending.lines.join(', ')}). Run \`make revision\`.`,
      )
    }
  } finally {
    await db.destroy()
  }
}

export async function down({ env = process.env } = {}) {
  const { owned } = await loadAll()
  const db = database(env)
  try {
    await ensureTable(db)
    const rows = await db('app_meta.revisions')
      .orderBy('id')
      .select('id', 'state')
    const last = rows.at(-1)
    if (!last) throw new Error('No revision is applied.')
    if (!(await readText(revisionFile(last.id, 'changes.json')))) {
      throw new Error(
        `${last.id} is not part of this release. Run \`down\` with the release that contains it.`,
      )
    }
    const token = await session(env)
    const previous = rows.at(-2)
    const target = previous
      ? await readJson(revisionFile(previous.id, 'schema.json'))
      : empty(await snapshot(token))
    const changes = await readJson(revisionFile(last.id, 'changes.json'))
    const step = makeStep({
      db,
      id: last.id,
      target,
      expected: changes.down,
      label: `Undoing ${last.id}`,
      token,
      owned,
    })
    await undoRevision(step, last.state)
    console.log(`Undid revision ${last.id}.`)
  } finally {
    await db.destroy()
  }
}

export async function status({ env = process.env } = {}) {
  const { names } = await loadAll()
  const db = database(env)
  try {
    await ensureTable(db)
    const applied = await appliedStates(db)
    for (const id of names) {
      const state = applied.get(id)
      console.log(
        `${state === 'done' ? 'applied' : state ? `partial (${state})` : 'pending'}  ${id}`,
      )
    }
  } finally {
    await db.destroy()
  }
}

// Records revisions as applied without running them: for a database that
// already matches them (created by an earlier sync, or restored from a backup).
export async function stamp(target = 'head', { env = process.env } = {}) {
  const { names } = await loadAll()
  const last =
    target === 'head'
      ? names.at(-1)
      : names.find((id) => id === target || id.startsWith(`${target}_`))
  if (!last)
    throw new Error(
      `Unknown revision "${target}". Use head or one of: ${names.join(', ')}`,
    )
  const db = database(env)
  try {
    await ensureTable(db)
    const applied = await appliedStates(db)
    for (const id of names.slice(0, names.indexOf(last) + 1)) {
      if (applied.has(id) && applied.get(id) !== 'done') {
        throw new Error(
          `${id} is partly applied (${applied.get(id)}); finish or undo it first.`,
        )
      }
      if (!applied.has(id)) {
        await db('app_meta.revisions').insert({ id, state: 'done' })
        console.log(`Stamped ${id} as applied.`)
      }
    }
    console.log(
      'Nothing was changed in the schema. Run `check` to confirm the database matches the YAML.',
    )
  } finally {
    await db.destroy()
  }
}

export async function check({ env = process.env } = {}) {
  const { owned } = await loadAll()
  const token = await session(env)
  const pending = await pendingYamlChanges(token, owned)
  if (pending) {
    throw new Error(
      `The YAML has changes no revision contains: ${pending.lines.join(', ')}. Run \`make revision\`.`,
    )
  }
  console.log('The revisions match the YAML.')
}

// Autogenerate. The instance must be at the newest revision (a throwaway
// database that applied all of them): up = instance -> YAML; down is found by
// applying up and diffing back to the previous state.
export async function generate(outDir, { env = process.env } = {}) {
  const { names, owned } = await loadAll()
  const db = database(env)
  try {
    await ensureTable(db)
    const applied = await appliedStates(db)
    const behind = names.filter((id) => applied.get(id) !== 'done')
    if (behind.length) {
      throw new Error(
        `The instance is not at the newest revision (pending: ${behind.join(', ')}).`,
      )
    }
  } finally {
    await db.destroy()
  }

  const token = await session(env)
  const before = await snapshot(token)
  const up = await pendingYamlChanges(token, owned)
  if (!up) {
    console.log('No changes: the YAML matches the newest revision.')
    return
  }
  await request('/schema/apply', { method: 'POST', body: up.diff, token })
  const after = await snapshot(token)
  const reverse = await diffTo(before, token)
  const changes = { up: up.lines, down: reverse ? describe(reverse) : [] }
  await mkdir(outDir, { recursive: true })
  await writeFile(
    path.join(outDir, 'schema.json'),
    `${JSON.stringify(after, null, 2)}\n`,
  )
  await writeFile(
    path.join(outDir, 'changes.json'),
    `${JSON.stringify(changes, null, 2)}\n`,
  )
  console.log(changes.up.join('\n'))
  const drops = changes.up.filter((line) => line.startsWith('- '))
  if (drops.length) {
    console.log(
      `DESTRUCTIVE: ${drops.join(', ')}. up.sql runs before they are dropped: copy the data there if it is still needed.`,
    )
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const [command, arg] = process.argv.slice(2)
  try {
    if (command === 'upgrade') await upgrade()
    else if (command === 'down') await down()
    else if (command === 'status') await status()
    else if (command === 'stamp') await stamp(arg)
    else if (command === 'check') await check()
    else if (command === 'generate' && arg) await generate(arg)
    else
      throw new Error(
        'Usage: revisions.js upgrade | down | status | stamp <id|head> | check | generate <dir>',
      )
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
