import { authenticate } from './client.mjs'
import { migrate } from './migrate.mjs'
import { seed } from './seed.mjs'
import { ensureServiceUser } from './service-user.mjs'

const request = await authenticate()

await migrate(request)
await seed(request)
await ensureServiceUser(request, process.env.DONATION_SERVICE_TOKEN)
console.log(
  'Backend setup complete. Only published projects, campaigns and donation purposes are publicly readable; donation records stay private to the donation service.',
)
