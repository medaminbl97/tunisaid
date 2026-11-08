import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { applySchema, collection, required, timestamp } from './schema.mjs'

export async function migrate(request) {
  await applySchema(
    request,
    [
      collection(
        'backend_migrations',
        [required('name'), required('checksum'), timestamp('applied_at')],
        {
          stringId: true,
          hidden: true,
          note: 'Versioned application API migrations. Never edit applied migration files.',
        },
      ),
    ],
    [],
  )

  const directory = new URL('../migrations/', import.meta.url)
  const files = (await readdir(directory))
    .filter((file) => /^\d{3}-.+\.mjs$/.test(file))
    .sort()
  if (!files.length) {
    throw new Error('No application migrations found in the mounted directory.')
  }

  for (const file of files) {
    const url = new URL(file, directory)
    const checksum = createHash('sha256')
      .update(await readFile(url))
      .digest('hex')
    const migration = await import(url.href)
    if (
      migration.version !== file.slice(0, 3) ||
      typeof migration.up !== 'function'
    ) {
      throw new Error(`Invalid migration contract: ${file}`)
    }
    const applied = await request(
      `/items/backend_migrations?filter[id][_eq]=${migration.version}&limit=1`,
    )
    if (applied.length) {
      if (applied[0].checksum !== checksum) {
        throw new Error(
          `Applied migration changed: ${file}. Add a new migration instead.`,
        )
      }
      console.log(`Already applied ${file}`)
      continue
    }
    console.log(`Applying ${file}`)
    await migration.up(request)
    await request('/items/backend_migrations', {
      method: 'POST',
      body: {
        id: migration.version,
        name: migration.name,
        checksum,
        applied_at: new Date().toISOString(),
      },
    })
  }
}
