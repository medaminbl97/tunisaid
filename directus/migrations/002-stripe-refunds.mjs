import { applyPermissions, ensureRolePolicy } from '../scripts/schema.mjs'
import { servicePolicy, serviceRole } from './001-initial-schema.mjs'

export const version = '002'
export const name = 'stripe-refunds'

// Provider refund webhooks record refunds through the donation service user.
export const refundGrants = [
  {
    collection: 'refunds',
    action: 'read',
    fields: [
      'id',
      'donation',
      'payment_attempt',
      'provider_refund_id',
      'status',
      'amount_cents',
    ],
  },
  {
    collection: 'refunds',
    action: 'create',
    fields: [
      'donation',
      'payment_attempt',
      'provider',
      'provider_refund_id',
      'idempotency_key',
      'status',
      'amount_cents',
      'currency',
      'reason_code',
      'created_at',
    ],
    validation: { status: { _in: ['pending', 'succeeded', 'failed'] } },
  },
  {
    collection: 'refunds',
    action: 'update',
    fields: ['status'],
    permissions: { status: { _eq: 'pending' } },
    validation: { status: { _in: ['succeeded', 'failed'] } },
  },
]

export async function up(request) {
  await applyPermissions(
    request,
    await ensureRolePolicy(request, serviceRole, servicePolicy),
    refundGrants,
  )
}
