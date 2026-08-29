// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import type Stripe from 'stripe'

// --- Mocks ----------------------------------------------------------------
// The Supabase admin client is faked with a chainable builder so each branch
// (new shipment / duplicate invoice / missing subscription) can be driven
// without a database. Same approach as lib/promotions.test.ts.

const { getSupabaseAdmin } = vi.hoisted(() => ({ getSupabaseAdmin: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin }))
vi.mock('./supabase', () => ({ getSupabaseAdmin }))
vi.mock('server-only', () => ({}))
vi.mock('./promotions', () => ({ subscribeToPromotions: vi.fn(async () => ({ ok: true })) }))

import {
  mapStripeStatus,
  persistSubscriptionFromSession,
  recordFulfillmentForInvoice,
} from './subscriptions'

type SubRow = {
  id: string
  email: string
  tokens_per_cycle: number
  wash_value: string
  status: string
} | null

type Scenario = {
  /** The `subscriptions` row the lookup finds, or null for "not yet created". */
  sub?: SubRow
  /** Rows returned by the fulfillment upsert — [] means the invoice was a dupe. */
  upsertRows?: unknown[]
  upsertError?: unknown
}

function makeSupabase(scenario: Scenario) {
  const upsertCalls: Array<{ table: string; row: Record<string, unknown>; opts: unknown }> =
    []
  const updateCalls: Array<{ table: string; patch: unknown }> = []

  const from = vi.fn((table: string) => {
    let didUpsert = false
    let didUpdate = false
    const builder: Record<string, unknown> = {}

    builder.upsert = vi.fn((row: Record<string, unknown>, opts: unknown) => {
      didUpsert = true
      upsertCalls.push({ table, row, opts })
      return builder
    })
    builder.update = vi.fn((patch: unknown) => {
      didUpdate = true
      updateCalls.push({ table, patch })
      return builder
    })
    builder.select = vi.fn(() => {
      if (!didUpsert) return builder
      // After an upsert `.select()` is awaited directly (fulfillments) OR
      // chained into `.single()` (the customers upsert), so the returned
      // promise carries a `single` of its own.
      const result = {
        data: scenario.upsertRows ?? [{ id: 'f_1' }],
        error: scenario.upsertError ?? null,
      }
      const p = Promise.resolve(result) as Promise<typeof result> & {
        single?: () => Promise<{ data: unknown; error: unknown }>
      }
      p.single = () =>
        Promise.resolve({ data: { id: 'customer_row_1' }, error: null })
      return p
    })
    builder.eq = vi.fn(() =>
      didUpdate ? Promise.resolve({ error: null }) : builder,
    )
    builder.maybeSingle = vi.fn(() =>
      Promise.resolve({ data: scenario.sub ?? null, error: null }),
    )
    return builder
  })

  getSupabaseAdmin.mockReturnValue({ from })
  return { upsertCalls, updateCalls }
}

const PERIOD_START = Date.UTC(2026, 7, 1) / 1000
const PERIOD_END = Date.UTC(2026, 8, 1) / 1000

function invoice(overrides: Partial<Stripe.Invoice> = {}): Stripe.Invoice {
  return {
    id: 'in_test_1',
    period_start: PERIOD_START,
    period_end: PERIOD_END,
    customer_email: 'pat@example.com',
    parent: {
      type: 'subscription_details',
      subscription_details: {
        subscription: 'sub_123',
        metadata: { plan: 'weekly', tokens_per_cycle: '4', wash_value: '12' },
      },
    },
    ...overrides,
  } as unknown as Stripe.Invoice
}

const ACTIVE_SUB: SubRow = {
  id: 'sub_row_1',
  email: 'pat@example.com',
  tokens_per_cycle: 4,
  wash_value: '12',
  status: 'active',
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('recordFulfillmentForInvoice', () => {
  it('queues one shipment for a paid invoice', async () => {
    const { upsertCalls } = makeSupabase({ sub: ACTIVE_SUB })

    const result = await recordFulfillmentForInvoice(invoice())

    expect(result).toEqual({ isNew: true, tokensCount: 4, email: 'pat@example.com' })
    expect(upsertCalls).toHaveLength(1)
    expect(upsertCalls[0].table).toBe('fulfillments')
    expect(upsertCalls[0].row).toMatchObject({
      subscription_id: 'sub_row_1',
      stripe_invoice_id: 'in_test_1',
      tokens_count: 4,
      wash_value: '12',
      status: 'pending',
    })
  })

  it('keys idempotency on the invoice id so a redelivery cannot double-ship', async () => {
    const { upsertCalls } = makeSupabase({ sub: ACTIVE_SUB })
    await recordFulfillmentForInvoice(invoice())
    expect(upsertCalls[0].opts).toEqual({
      onConflict: 'stripe_invoice_id',
      ignoreDuplicates: true,
    })
  })

  it('reports isNew=false when the invoice was already fulfilled', async () => {
    // An empty upsert result is what ignoreDuplicates returns on a repeat —
    // the dunning-recovery path lands here too (payment_failed then paid for
    // the same invoice), and must not produce a second shipment.
    makeSupabase({ sub: ACTIVE_SUB, upsertRows: [] })

    const result = await recordFulfillmentForInvoice(invoice())

    expect(result?.isNew).toBe(false)
  })

  it('carries the invoice period onto the shipment', async () => {
    const { upsertCalls } = makeSupabase({ sub: ACTIVE_SUB })
    await recordFulfillmentForInvoice(invoice())
    expect(upsertCalls[0].row.period_start).toBe(
      new Date(PERIOD_START * 1000).toISOString(),
    )
    expect(upsertCalls[0].row.period_end).toBe(new Date(PERIOD_END * 1000).toISOString())
  })

  it('gives each cycle its own shipment', async () => {
    const { upsertCalls } = makeSupabase({ sub: ACTIVE_SUB })

    await recordFulfillmentForInvoice(invoice({ id: 'in_1' } as Partial<Stripe.Invoice>))
    await recordFulfillmentForInvoice(invoice({ id: 'in_2' } as Partial<Stripe.Invoice>))
    await recordFulfillmentForInvoice(invoice({ id: 'in_3' } as Partial<Stripe.Invoice>))

    // Monthly billing = monthly fulfillment: no accrual, no batching.
    expect(upsertCalls).toHaveLength(3)
    expect(upsertCalls.map((c) => c.row.stripe_invoice_id)).toEqual([
      'in_1',
      'in_2',
      'in_3',
    ])
    expect(upsertCalls.every((c) => c.row.tokens_count === 4)).toBe(true)
  })

  it('ignores a one-off invoice that has no subscription', async () => {
    const { upsertCalls } = makeSupabase({ sub: ACTIVE_SUB })

    const result = await recordFulfillmentForInvoice(
      invoice({ parent: null } as Partial<Stripe.Invoice>),
    )

    expect(result).toBeNull()
    expect(upsertCalls).toHaveLength(0)
  })

  it('still ships using the invoice metadata snapshot when the subscription row is missing', async () => {
    // Stripe does not guarantee event ordering: invoice.paid can beat
    // checkout.session.completed. Dropping the shipment would lose a cycle.
    const { upsertCalls } = makeSupabase({ sub: null })

    const result = await recordFulfillmentForInvoice(invoice())

    expect(result?.isNew).toBe(true)
    expect(upsertCalls[0].row).toMatchObject({
      subscription_id: null,
      tokens_count: 4,
      wash_value: '12',
    })
  })

  it('refuses to guess when neither the row nor the snapshot has a token count', async () => {
    const { upsertCalls } = makeSupabase({ sub: null })

    const result = await recordFulfillmentForInvoice(
      invoice({
        parent: {
          type: 'subscription_details',
          subscription_details: { subscription: 'sub_123', metadata: {} },
        },
      } as unknown as Partial<Stripe.Invoice>),
    )

    expect(result).toBeNull()
    expect(upsertCalls).toHaveLength(0)
  })

  it('clears a past_due subscription once a payment clears', async () => {
    const { updateCalls } = makeSupabase({
      sub: { ...ACTIVE_SUB, status: 'past_due' } as SubRow,
    })

    await recordFulfillmentForInvoice(invoice())

    expect(updateCalls).toContainEqual({
      table: 'subscriptions',
      patch: { status: 'active' },
    })
  })

  it('returns null rather than throwing when Supabase is unconfigured', async () => {
    getSupabaseAdmin.mockReturnValue(null)
    await expect(recordFulfillmentForInvoice(invoice())).resolves.toBeNull()
  })
})

describe('mapStripeStatus', () => {
  it('treats trialing as active — a trialing plan still ships', () => {
    expect(mapStripeStatus('trialing')).toBe('active')
    expect(mapStripeStatus('active')).toBe('active')
  })

  it('maps every terminal state onto canceled so shipping stops', () => {
    expect(mapStripeStatus('canceled')).toBe('canceled')
    expect(mapStripeStatus('unpaid')).toBe('canceled')
    expect(mapStripeStatus('incomplete_expired')).toBe('canceled')
  })

  it('preserves past_due and paused distinctly', () => {
    expect(mapStripeStatus('past_due')).toBe('past_due')
    expect(mapStripeStatus('paused')).toBe('paused')
  })
})

// --- Address persistence --------------------------------------------------
// The mailing address is collected on our own form and travels in `mail_*`
// session metadata. If it does not land on the subscription row, Joe has no
// address to mail tokens to.

function subscriptionSession(
  metaOverrides: Record<string, string> = {},
  extra: Record<string, unknown> = {},
) {
  return {
    id: 'cs_sub_1',
    mode: 'subscription',
    subscription: 'sub_123',
    customer: 'cus_123',
    customer_email: 'pat@example.com',
    customer_details: { email: 'pat@example.com', phone: '', address: null, name: 'Pat' },
    metadata: {
      plan: 'weekly',
      tokens_per_cycle: '4',
      wash_value: '9',
      customer_name: 'Pat Driver',
      mail_line1: '7802 Madison St',
      mail_line2: 'Apt 2B',
      mail_city: 'Forest Park',
      mail_state: 'IL',
      mail_postal_code: '60130',
      mail_list_subscribed: 'false',
      ...metaOverrides,
    },
    ...extra,
  } as never
}

describe('persistSubscriptionFromSession', () => {
  it('writes the mailing address and chosen token onto the subscription row', async () => {
    const { upsertCalls } = makeSupabase({ sub: ACTIVE_SUB })
    await persistSubscriptionFromSession(subscriptionSession())

    const sub = upsertCalls.find((c) => c.table === 'subscriptions')
    expect(sub?.row).toMatchObject({
      stripe_subscription_id: 'sub_123',
      plan: 'weekly',
      tokens_per_cycle: 4,
      wash_value: '9',
      ship_line1: '7802 Madison St',
      ship_line2: 'Apt 2B',
      ship_city: 'Forest Park',
      ship_state: 'IL',
      ship_postal_code: '60130',
      ship_country: 'US',
    })
  })

  it('mirrors the address onto the customer record too', async () => {
    const { upsertCalls } = makeSupabase({ sub: ACTIVE_SUB })
    await persistSubscriptionFromSession(subscriptionSession())

    const cust = upsertCalls.find((c) => c.table === 'customers')
    expect(cust?.row).toMatchObject({
      email: 'pat@example.com',
      mailing_line1: '7802 Madison St',
      mailing_city: 'Forest Park',
    })
  })

  it('falls back to Stripe shipping details when metadata has no address', async () => {
    // Covers sessions created before the form collected the address itself.
    const { upsertCalls } = makeSupabase({ sub: ACTIVE_SUB })
    await persistSubscriptionFromSession(
      subscriptionSession(
        { mail_line1: '', mail_city: '', mail_state: '', mail_postal_code: '' },
        {
          collected_information: {
            shipping_details: {
              address: {
                line1: '1 Fallback Ave',
                city: 'Oak Park',
                state: 'IL',
                postal_code: '60302',
              },
            },
          },
        },
      ),
    )

    const sub = upsertCalls.find((c) => c.table === 'subscriptions')
    expect(sub?.row).toMatchObject({
      ship_line1: '1 Fallback Ave',
      ship_city: 'Oak Park',
    })
  })

  it('never creates a fulfillment — invoice.paid owns that', async () => {
    const { upsertCalls } = makeSupabase({ sub: ACTIVE_SUB })
    await persistSubscriptionFromSession(subscriptionSession())
    expect(upsertCalls.some((c) => c.table === 'fulfillments')).toBe(false)
  })

  it('does nothing when Supabase is unconfigured', async () => {
    getSupabaseAdmin.mockReturnValue(null)
    await expect(
      persistSubscriptionFromSession(subscriptionSession()),
    ).resolves.toBeUndefined()
  })
})
