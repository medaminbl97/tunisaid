import { existsSync } from 'node:fs'
import { loadEnvFile } from 'node:process'
import { defineConfig } from '@hey-api/openapi-ts'
import type { UserConfig } from '@hey-api/openapi-ts'
import { z } from 'zod'

export default defineConfig(async (): Promise<UserConfig> => {
  if (existsSync('.env.local')) loadEnvFile('.env.local')
  let input: string | Record<string, unknown> = process.env.OPENAPI_INPUT ?? ''

  if (!input || /^https?:\/\//i.test(input)) {
    const token = process.env.OPENAPI_TOKEN
    if (!input && !token) {
      throw new Error(
        'Set OPENAPI_TOKEN locally in .env.local or the shell, or provide OPENAPI_INPUT.',
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
  }

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
