// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'

// --- Mocks ----------------------------------------------------------------
// subscribeToPromotions is the only thing under test; the Supabase admin client
// is faked with a chainable query builder so we can drive each branch (new /
// already-subscribed / previously-unsubscribed / errors) without a database.

const { getSupabaseAdmin } = vi.hoisted(() => ({ getSupabaseAdmin: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin }))
// 'server-only' throws if imported outside a Server Component; stub it away.
vi.mock('server-only', () => ({}))

import { subscribeToPromotions } from './promotions'

// A minimal stand-in for the two query shapes the code uses:
//   from(t).upsert(row, opts).select('id')                      -> { data, error }
//   from(t).select(cols).eq('email', e).maybeSingle()           -> { data, error }
//   from(t).update(patch).eq('id', id)                          -> { error }
// `update`s are consumed FIFO from `updates` (reactivate first, then back-fill).
type Scenario = {
  upsert?: { data?: unknown[] | null; error?: unknown }
  lookup?: { data?: unknown; error?: unknown }
  updates?: Array<{ error?: unknown }>
}

function makeSupabase(scenario: Scenario) {
  const updates = [...(scenario.updates ?? [])]
  const upsertCalls: unknown[] = []
  const updateCalls: unknown[] = []

  const from = vi.fn(() => {
    let didUpsert = false
    let didUpdate = false
    const builder: Record<string, unknown> = {}
    builder.upsert = vi.fn((row: unknown, opts: unknown) => {
      didUpsert = true
      upsertCalls.push({ row, opts })
      return builder
    })
    builder.update = vi.fn((patch: unknown) => {
      didUpdate = true
      updateCalls.push(patch)
      return builder
    })
    builder.select = vi.fn(() =>
      // After an upsert, `.select('id')` is the awaited terminal; otherwise it
      // continues the lookup chain (`.eq(...).maybeSingle()`).
      didUpsert ? Promise.resolve(scenario.upsert ?? { data: [], error: null }) : builder,
    )
    builder.eq = vi.fn(() =>
      // After an update, `.eq('id', …)` is the awaited terminal; otherwise it
      // continues the lookup chain toward `.maybeSingle()`.
      didUpdate ? Promise.resolve(updates.shift() ?? { error: null }) : builder,
    )
    builder.maybeSingle = vi.fn(() =>
      Promise.resolve(scenario.lookup ?? { data: null, error: null }),
    )
    return builder
  })

  return { client: { from }, upsertCalls, updateCalls }
}

afterEach(() => vi.clearAllMocks())

// --- Guard rails ----------------------------------------------------------

describe('subscribeToPromotions — guards', () => {
  it('rejects a malformed email before touching Supabase', async () => {
    getSupabaseAdmin.mockReturnValue(makeSupabase({}).client)
    const res = await subscribeToPromotions({ email: 'nope' })
    expect(res).toEqual({ ok: false, reason: 'invalid_email' })
    expect(getSupabaseAdmin).not.toHaveBeenCalled()
  })

  it('reports unconfigured when there is no admin client', async () => {
    getSupabaseAdmin.mockReturnValue(null)
    const res = await subscribeToPromotions({ email: 'a@b.com' })
    expect(res).toEqual({ ok: false, reason: 'unconfigured' })
  })
})

// --- New subscriber -------------------------------------------------------

describe('subscribeToPromotions — new email', () => {
  it('returns "subscribed" when the insert creates a row', async () => {
    const sb = makeSupabase({ upsert: { data: [{ id: 'row1' }], error: null } })
    getSupabaseAdmin.mockReturnValue(sb.client)
    const res = await subscribeToPromotions({ email: 'A@B.com ', name: ' Jo ', source: 'footer' })
    expect(res).toEqual({ ok: true, outcome: 'subscribed' })
    // Email is lowercased/trimmed and the row is marked subscribed.
    const { row } = sb.upsertCalls[0] as { row: Record<string, unknown> }
    expect(row.email).toBe('a@b.com')
    expect(row.name).toBe('Jo')
    expect(row.status).toBe('subscribed')
  })

  it('surfaces an insert error as reason "error"', async () => {
    const sb = makeSupabase({ upsert: { data: null, error: { message: 'boom' } } })
    getSupabaseAdmin.mockReturnValue(sb.client)
    const res = await subscribeToPromotions({ email: 'a@b.com' })
    expect(res).toEqual({ ok: false, reason: 'error' })
  })
})

// --- Existing email -------------------------------------------------------

describe('subscribeToPromotions — existing email', () => {
  it('returns "already_subscribed" for a still-subscribed row', async () => {
    const sb = makeSupabase({
      upsert: { data: [], error: null }, // ignoreDuplicates -> no row back
      lookup: { data: { id: 'r', status: 'subscribed', customer_id: 'c1' }, error: null },
    })
    getSupabaseAdmin.mockReturnValue(sb.client)
    const res = await subscribeToPromotions({ email: 'a@b.com' })
    expect(res).toEqual({ ok: true, outcome: 'already_subscribed' })
    expect(sb.updateCalls).toHaveLength(0) // nothing to back-fill
  })

  it('asks for confirmation before resubscribing an unsubscribed email', async () => {
    const sb = makeSupabase({
      upsert: { data: [], error: null },
      lookup: { data: { id: 'r', status: 'unsubscribed', customer_id: null }, error: null },
    })
    getSupabaseAdmin.mockReturnValue(sb.client)
    const res = await subscribeToPromotions({ email: 'a@b.com' })
    expect(res).toEqual({ ok: true, outcome: 'confirm_resubscribe' })
    expect(sb.updateCalls).toHaveLength(0) // no write until confirmed
  })

  it('reactivates when confirmResubscribe is passed', async () => {
    const sb = makeSupabase({
      upsert: { data: [], error: null },
      lookup: { data: { id: 'r', status: 'unsubscribed', customer_id: null }, error: null },
      updates: [{ error: null }],
    })
    getSupabaseAdmin.mockReturnValue(sb.client)
    const res = await subscribeToPromotions({ email: 'a@b.com', confirmResubscribe: true })
    expect(res).toEqual({ ok: true, outcome: 'resubscribed' })
    expect(sb.updateCalls[0]).toMatchObject({ status: 'subscribed', unsubscribed_at: null })
  })

  it('back-fills the customer link on an already-subscribed, unlinked row', async () => {
    const sb = makeSupabase({
      upsert: { data: [], error: null },
      lookup: { data: { id: 'r', status: 'subscribed', customer_id: null }, error: null },
      updates: [{ error: null }],
    })
    getSupabaseAdmin.mockReturnValue(sb.client)
    const res = await subscribeToPromotions({ email: 'a@b.com', customerId: 'cust_9' })
    expect(res).toEqual({ ok: true, outcome: 'already_subscribed' })
    expect(sb.updateCalls[0]).toEqual({ customer_id: 'cust_9' })
  })

  it('surfaces a lookup error as reason "error"', async () => {
    const sb = makeSupabase({
      upsert: { data: [], error: null },
      lookup: { data: null, error: { message: 'boom' } },
    })
    getSupabaseAdmin.mockReturnValue(sb.client)
    const res = await subscribeToPromotions({ email: 'a@b.com' })
    expect(res).toEqual({ ok: false, reason: 'error' })
  })
})
