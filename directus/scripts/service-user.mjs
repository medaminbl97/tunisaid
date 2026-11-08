import { serviceRole } from '../migrations/001-initial-schema.mjs'

export const serviceUserEmail = 'donation-service@example.com'

export async function ensureServiceUser(request, token) {
  if (!token) {
    console.log(
      'DONATION_SERVICE_TOKEN is not set; skipped the donation service user. Online checkout stays disabled.',
    )
    return
  }
  if (!/^[\w-]{32,}$/.test(token)) {
    throw new Error(
      'DONATION_SERVICE_TOKEN must be at least 32 letters, digits, - or _.',
    )
  }
  const [role] = await request(
    `/roles?filter[name][_eq]=${encodeURIComponent(serviceRole.name)}&fields=id&limit=1`,
  )
  if (!role) throw new Error('Donation service role is missing.')
  const [user] = await request(
    `/users?filter[email][_eq]=${encodeURIComponent(serviceUserEmail)}&fields=id,role,status&limit=1`,
  )
  const values = { role: role.id, status: 'active', token }
  if (user) {
    await request(`/users/${user.id}`, { method: 'PATCH', body: values })
  } else {
    await request('/users', {
      method: 'POST',
      body: {
        ...values,
        email: serviceUserEmail,
        first_name: 'Donation',
        last_name: 'Service',
      },
    })
  }
  console.log('Donation service user is active with the configured token.')
}
