// Directus accepts nested filters as JSON; OpenAPI's form encoding loses nesting.
export function serializeDirectusQuery(query: Record<string, unknown>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue
    search.set(
      key,
      Array.isArray(value)
        ? value.join(',')
        : typeof value === 'object'
          ? JSON.stringify(value)
          : String(value),
    )
  }
  return search.toString()
}
