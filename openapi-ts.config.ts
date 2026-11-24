import { existsSync, readFileSync } from 'node:fs'
import { loadEnvFile } from 'node:process'
import { defineConfig } from '@hey-api/openapi-ts'
import type { UserConfig } from '@hey-api/openapi-ts'
import { z } from 'zod'

type Schema = { properties?: Record<string, Record<string, unknown>> }

// Directus returns decimal columns as strings ("35.00") but its OpenAPI export
// declares them as numbers, so the generated Zod response validation would
// reject every amount. Amount fields carry the note below in their schema; they
// are declared as decimal strings instead, which also matches what writes accept.
const amountNote = /^Amount in euros/

function declareAmountsAsStrings(spec: Record<string, unknown>) {
  const components = spec.components as
    { schemas?: Record<string, Schema> } | undefined
  for (const schema of Object.values(components?.schemas ?? {})) {
    for (const property of Object.values(schema.properties ?? {})) {
      if (amountNote.test(String(property.description ?? ''))) {
        property.type = 'string'
        property.pattern = '^-?\\d+(\\.\\d+)?$'
        delete property.format
      }
    }
  }
  return spec
}

export default defineConfig(async (): Promise<UserConfig> => {
  // Already-set variables win, so the shell can override .env.local, and .env.local
  // can override .env.
  for (const file of ['.env']) {
    if (existsSync(file)) loadEnvFile(file)
  }
  let input: string | Record<string, unknown> = process.env.OPENAPI_INPUT ?? ''

  if (!input || /^https?:\/\//i.test(input)) {
    // The donation service token is enough: its policy can read everything the
    // website client uses, and Directus only lists what the caller may read.
    // OPENAPI_TOKEN overrides it; an admin token is never needed.
    const token = process.env.DIRECTUS_SERVICE_TOKEN
    if (!input && !token) {
      throw new Error(
        'Set DIRECTUS_SERVICE_TOKEN in .env (or OPENAPI_TOKEN in .env.local or the shell), or provide OPENAPI_INPUT.',
      )
    }
    const baseUrl =
      process.env.DIRECTUS_URL ??
      `http://localhost:${process.env.DIRECTUS_PORT ?? '8056'}`
    const response = await fetch(
      input || new URL('/server/specs/oas', baseUrl),
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        redirect: 'error',
        signal: AbortSignal.timeout(30_000),
      },
    )
    if (!response.ok)
      throw new Error(`OpenAPI export failed: HTTP ${response.status}`)
    input = z.record(z.string(), z.unknown()).parse(await response.json())
  } else if (existsSync(input)) {
    input = z
      .record(z.string(), z.unknown())
      .parse(JSON.parse(readFileSync(input, 'utf8')))
  }
  if (typeof input === 'object') declareAmountsAsStrings(input)

  return {
    input,
    output: 'src/api/generated',
    parser: {
      filters: {
        operations: {
          include: ['/^[A-Z]+ \\/items\\//'],
        },
      },
    },
    plugins: [
      '@hey-api/typescript',
      {
        name: '@hey-api/client-fetch',
        runtimeConfigPath: './src/api/runtime-config.ts',
      },
      { name: '@hey-api/sdk', validator: { response: 'zod' } },
      { name: 'zod', compatibilityVersion: 4 },
    ],
  }
})
