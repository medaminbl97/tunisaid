import { fileURLToPath, pathToFileURL } from 'node:url'
import { applyPolicies } from './apply-policies.js'
import { checkRevisions, upgrade } from './revisions.js'
import {
  loadDefinitions,
  loginAsAdmin,
  request,
  waitForDirectus,
} from './schema-model.js'
import { seedData, seedEnvironment } from './seed-data.js'

// Startup, in this order: validate everything that is baked into the image,
// apply pending revisions (schema and data), then access policies, then seeds.
// A failure anywhere exits nonzero, and the entrypoint never opens the public port.
const root = new URL('../', import.meta.url)
const dir = (name) => fileURLToPath(new URL(`${name}/`, root))

export async function synchronize({ env = process.env } = {}) {
  const environment = seedEnvironment(env.CMS_ENV ?? 'prod')

  // Everything is read and validated before the database is touched.
  const definitions = await loadDefinitions(dir('schemas'))
  await checkRevisions()
  await waitForDirectus()
  const token = await loginAsAdmin(env)

  await upgrade({ env, token })

  // `make revision` starts a throwaway stack that only needs the revisions: the
  // policies and seeds may refer to collections the new revision creates.
  if (env.REVISIONS_ONLY === 'true') {
    console.log('REVISIONS_ONLY=true: skipping access policies and seeds.')
    return
  }

  await applyPolicies(request, token, definitions, {
    env,
    accessDir: dir('access'),
  })
  await seedData(definitions, request, token, {
    environment,
    seedsDir: dir('seeds'),
    publishDraft: env.SEED_PUBLISH_DEMO === 'true',
  })
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    await synchronize()
  } catch (error) {
    console.error(`Startup synchronization failed: ${error.message}`)
    process.exitCode = 1
  }
}
