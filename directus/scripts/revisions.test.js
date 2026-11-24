import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
  applyRevision,
  checkNumbering,
  checkRevisionFiles,
  checkRevisions,
  checkSql,
  describe,
  onlyCollections,
  ownedCollections,
  removedCollections,
  undoRevision,
  unexpectedDeletions,
  withoutDeletions,
} from './revisions.js'

const diff = {
  hash: 'abc',
  diff: {
    systemFields: [],
    collections: [{ collection: 'gone', diff: [{ kind: 'D' }] }],
    fields: [
      { collection: 'a', field: 'added', diff: [{ kind: 'N', rhs: {} }] },
      { collection: 'a', field: 'removed', diff: [{ kind: 'D' }] },
      // A property edit that deletes one property is still an edit.
      {
        collection: 'a',
        field: 'edited',
        diff: [{ kind: 'D', path: ['meta', 'note'] }],
      },
      { collection: 'unmanaged', field: 'x', diff: [{ kind: 'D' }] },
    ],
    relations: [
      { collection: 'a', field: 'r', diff: [{ kind: 'N', rhs: {} }] },
    ],
  },
}

test('describes changes as one line each', () => {
  assert.deepEqual(describe(diff), [
    '- gone',
    '+ a.added',
    '- a.removed',
    '~ a.edited',
    '- unmanaged.x',
    '+ relation a.r',
  ])
})

test('splits off deletions but keeps property edits and unrelated keys', () => {
  const additions = withoutDeletions(diff)
  assert.deepEqual(describe(additions), [
    '+ a.added',
    '~ a.edited',
    '+ relation a.r',
  ])
  assert.equal(additions.hash, 'abc')
  assert.deepEqual(additions.diff.systemFields, [])
})

test('limits a diff to the collections the project owns', () => {
  const owned = ownedCollections([
    { collections: [{ collection: 'a' }, { collection: 'gone' }] },
    { collections: [{ collection: 'a' }] },
  ])
  assert.deepEqual([...owned].sort(), ['a', 'gone'])
  assert.deepEqual(describe(onlyCollections(diff, owned)), [
    '- gone',
    '+ a.added',
    '- a.removed',
    '~ a.edited',
    '+ relation a.r',
  ])
})

test('finds owned collections that the YAML no longer declares', () => {
  const owned = new Set(['kept', 'legacy', 'already_gone'])
  const snapshot = {
    collections: [
      { collection: 'kept' },
      { collection: 'legacy' },
      { collection: 'other' },
    ],
  }
  assert.deepEqual(
    removedCollections(owned, [{ collection: 'kept' }], snapshot),
    ['legacy'],
  )
})

test('only deletions the revision lists are expected', () => {
  const lines = ['- a.goal_cents', '+ a.goal_amount', '- a.surprise']
  assert.deepEqual(unexpectedDeletions(lines, ['- a.goal_cents']), [
    '- a.surprise',
  ])
})

test('SQL steps are data only', () => {
  assert.deepEqual(checkSql('up.sql', 'UPDATE a SET b = c / 100.0;'), [])
  assert.deepEqual(
    checkSql(
      'up.sql',
      '-- ALTER TABLE a ADD COLUMN x int\nUPDATE a SET b = 1;',
    ),
    [],
  )
  assert.equal(checkSql('up.sql', 'ALTER TABLE a ADD COLUMN x int').length, 1)
  assert.equal(
    checkSql('up.sql', 'alter table a rename column b to c').length,
    1,
  )
  assert.equal(checkSql('up.sql', 'DROP TABLE a').length, 1)
  assert.equal(checkSql('up.sql', 'DELETE FROM directus_fields').length, 1)
})

test('revision folders need the generated files and nothing unknown', () => {
  assert.deepEqual(
    checkRevisionFiles('0002_x', ['schema.json', 'changes.json', 'up.sql']),
    [],
  )
  assert.equal(checkRevisionFiles('0002_x', ['schema.json']).length, 1)
  assert.equal(
    checkRevisionFiles('0002_x', ['schema.json', 'changes.json', 'notes.txt'])
      .length,
    1,
  )
  assert.equal(
    checkRevisionFiles('2_x', ['schema.json', 'changes.json']).length,
    1,
  )
  assert.equal(
    checkRevisionFiles('0002_Bad Name', ['schema.json', 'changes.json']).length,
    1,
  )
})

test('revisions are numbered without gaps or repeats', () => {
  assert.deepEqual(checkNumbering(['0001_a', '0002_b']), [])
  assert.equal(checkNumbering(['0001_a', '0003_c']).length, 1)
  assert.equal(checkNumbering(['0001_a', '0001_b']).length, 1)
  assert.equal(checkNumbering(['0002_a']).length, 1)
})

test('checkRevisions validates a folder and treats a missing one as empty', async () => {
  assert.deepEqual(await checkRevisions('/nonexistent-folder'), [])
  const root = await mkdtemp(path.join(os.tmpdir(), 'revisions-'))
  try {
    const revision = path.join(root, '0001_initial')
    await mkdir(revision)
    await writeFile(path.join(revision, 'schema.json'), '{}')
    await writeFile(path.join(revision, 'changes.json'), '{}')
    await writeFile(path.join(revision, 'up.sql'), 'UPDATE a SET b = 1;')
    assert.deepEqual(await checkRevisions(root), ['0001_initial'])
    await writeFile(path.join(revision, 'down.sql'), 'DROP TABLE a;')
    await assert.rejects(
      () => checkRevisions(root),
      /0001_initial\/down.sql: schema changes/,
    )
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('the revisions in this repository are valid', async () => {
  await checkRevisions()
})

// A fake step records what happens, can fail at a chosen call, and keeps the
// recorded state like the database would.
function fakeStep({ failAt } = {}) {
  const log = []
  const store = { state: undefined, removed: false }
  const call = (name, action) => {
    if (failAt === name) throw new Error(`failed at ${name}`)
    log.push(name)
    action?.()
  }
  return {
    log,
    store,
    schema: async (phase) => call(`schema:${phase}`),
    record: async (state) =>
      call(`record:${state}`, () => (store.state = state)),
    sql: async (direction, state) =>
      call(`sql:${direction}`, () => (store.state = state)),
    remove: async () => call('remove', () => (store.removed = true)),
  }
}

test('upgrade adds, moves data, then drops', async () => {
  const step = fakeStep()
  await applyRevision(step, undefined)
  assert.deepEqual(step.log, [
    'schema:add',
    'record:added',
    'sql:up',
    'schema:drop',
    'record:done',
  ])
  assert.equal(step.store.state, 'done')
})

test('an interrupted upgrade continues where it stopped', async () => {
  const resumed = async (state) => {
    const step = fakeStep()
    await applyRevision(step, state)
    return step.log
  }
  assert.deepEqual(await resumed('added'), [
    'sql:up',
    'schema:drop',
    'record:done',
  ])
  assert.deepEqual(await resumed('sql'), ['schema:drop', 'record:done'])

  // up.sql fails: the schema step stays recorded, the data step is retried next start.
  const failing = fakeStep({ failAt: 'sql:up' })
  await assert.rejects(
    () => applyRevision(failing, undefined),
    /failed at sql:up/,
  )
  assert.equal(failing.store.state, 'added')
  const retry = fakeStep()
  await applyRevision(retry, failing.store.state)
  assert.deepEqual(retry.log, ['sql:up', 'schema:drop', 'record:done'])
})

test('a half-undone revision is not applied again', async () => {
  await assert.rejects(
    () => applyRevision(fakeStep(), 'down-added', '0002_x'),
    /half undone/,
  )
})

test('downgrade re-adds, moves data back, then drops', async () => {
  const step = fakeStep()
  await undoRevision(step, 'done')
  assert.deepEqual(step.log, [
    'schema:add',
    'record:down-added',
    'sql:down',
    'schema:drop',
    'remove',
  ])
})

test('an interrupted downgrade continues where it stopped', async () => {
  const resumed = async (state) => {
    const step = fakeStep()
    await undoRevision(step, state)
    return step.log
  }
  assert.deepEqual(await resumed('sql'), [
    'schema:add',
    'record:down-added',
    'sql:down',
    'schema:drop',
    'remove',
  ])
  assert.deepEqual(await resumed('down-added'), [
    'sql:down',
    'schema:drop',
    'remove',
  ])
  assert.deepEqual(await resumed('down-sql'), ['schema:drop', 'remove'])
  // up.sql never ran, so down.sql must not run either.
  assert.deepEqual(await resumed('added'), ['schema:drop', 'remove'])
})
