export function createClient(baseUrl, accessToken) {
  const base = new URL(baseUrl)
  if (!['http:', 'https:'].includes(base.protocol)) {
    throw new Error('DIRECTUS_URL must use HTTP or HTTPS.')
  }
  if (base.username || base.password) {
    throw new Error(
      'Use environment credentials, not credentials in DIRECTUS_URL.',
    )
  }

  return async function request(path, options = {}) {
    const response = await fetch(new URL(path, base), {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      ...(options.body === undefined
        ? {}
        : { body: JSON.stringify(options.body) }),
      signal: AbortSignal.timeout(30_000),
    })
    if (!response.ok) {
      throw new Error(
        `${options.method ?? 'GET'} ${path.split('?')[0]} failed: HTTP ${response.status}`,
      )
    }
    if (response.status === 204) return undefined
    const result = await response.json()
    return result.data
  }
}

export async function authenticate() {
  const { DIRECTUS_URL, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env
  if (!DIRECTUS_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error(
      'DIRECTUS_URL, ADMIN_EMAIL and ADMIN_PASSWORD are required.',
    )
  }
  const request = createClient(DIRECTUS_URL)
  const result = await request('/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, mode: 'json' },
  })
  if (!result?.access_token)
    throw new Error('Directus login returned no access credential.')
  return createClient(DIRECTUS_URL, result.access_token)
}
