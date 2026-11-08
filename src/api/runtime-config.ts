import type { CreateClientConfig } from './generated/client.gen'

export const apiBaseUrl: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8056'

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: apiBaseUrl,
})
