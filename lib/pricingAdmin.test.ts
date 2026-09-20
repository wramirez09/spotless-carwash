// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Exercises the WRITE services end to end with Stripe and Supabase faked.
//
// The invariant worth most of this file: every service writes **Stripe first,
// then Supabase**. If Stripe succeeds and the database write fails, the result
// is an orphaned Stripe object nothing points at — inert. The other order
// would point the storefront at a Stripe object that doesn't exist, which
// breaks checkout. Several tests below assert that ordering explicitly.

const {
  pricesRetrieve,
  pricesCreate,
  pricesUpdate,
  couponsCreate,
  couponsDel,
  productsSearch,
  productsCreate,
  productsUpdate,
  getSupabaseAdmin,
  getStripeSecretKey,
  getPricingSnapshot,
  invalidatePricingCache,
  StripeError,
} = vi.hoisted(() => ({
  pricesRetrieve: vi.fn(),
  pricesCreate: vi.fn(),
  pricesUpdate: vi.fn(),
  couponsCreate: vi.fn(),
  couponsDel: vi.fn(),
  productsSearch: vi.fn(),
  productsCreate: vi.fn(),
  productsUpdate: vi.fn(),
  getSupabaseAdmin: vi.fn(),
  getStripeSecretKey: vi.fn<() => string | undefined>(() => 'sk_test_fake'),
  getPricingSnapshot: vi.fn(),
  invalidatePricingCache: vi.fn(),
  // Declared inside vi.hoisted so it exists before the (hoisted) vi.mock
  // factory below references it.
  StripeError: class StripeError extends Error {},
}))

vi.mock('stripe', () => {
  const FakeStripe = class {
    prices = { retrieve: pricesRetrieve, create: pricesCreate, update: pricesUpdate }
    coupons = { create: couponsCreate, del: couponsDel }
    products = {
      search: productsSearch,
      create: productsCreate,
      update: productsUpdate,
    }
  } as unknown as { new (): unknown; errors: { StripeError: typeof StripeError } }
  FakeStripe.errors = { StripeError }
  return { default: FakeStripe }
})

vi.mock('./supabase', () => ({ getSupabaseAdmin }))
vi.mock('./stripeEnv', () => ({ getStripeSecretKey }))
vi.mock('./pricingStore', async () => {
  const { mapSaleRow } = await vi.importActual<typeof import('./pricingStore')>(
    './pricingStore',
  )
  return { getPricingSnapshot, invalidatePricingCache, mapSaleRow }
})

import {
  adoptCatalogSku,
  cancelSale,
  publishSale,
  reprovisionSale,
  saveSale,
  updateBaseDiscount,
  updateCatalogPrice,
} from './pricingAdmin'

// --- Supabase fake -------------------------------------------------------
// A chainable, thenable builder: `.update(x).eq(a).eq(b)` is awaited directly,
// while `.insert(x).select('id').single()` terminates explicitly. Results are
// queued per table so one test can give the same table different answers for
// successive calls.

type Result = { data?: unknown; error?: unknown }
let queues: Record<string, Result[]>
let inserts: Array<{ table: string; payload: unknown }>
let updates: Array<{ table: string; payload: unknown }>

function enqueue(table: string, result: Result) {
  ;(queues[table] ??= []).push(result)
}

function nextResult(table: string): Result {
  const q = queues[table]
  return (q && q.length ? q.shift() : undefined) ?? { data: null, error: null }
}

function makeSupabase() {
  return {
    from(table: string) {
      const builder: Record<string, unknown> = {}
      const chain = () => builder
      for (const m of ['select', 'eq', 'order', 'limit']) builder[m] = chain
      builder.insert = (payload: unknown) => {
        inserts.push({ table, payload })
        return builder
      }
      builder.update = (payload: unknown) => {
        updates.push({ table, payload })
        return builder
      }
      builder.upsert = (payload: unknown) => {
        updates.push({ table, payload })
        return builder
      }
      builder.single = async () => nextResult(table)
      builder.maybeSingle = async () => nextResult(table)
      builder.then = (res: (v: Result) => unknown, rej: (e: unknown) => unknown) =>
        Promise.resolve(nextResult(table)).then(res, rej)
      return builder
    },
  }
}

// --- Fixtures ------------------------------------------------------------

const HOUR = 3_600_000
const NOW = Date.UTC(2026, 7, 25, 12, 0, 0)

const SNAPSHOT = {
  prices: {
    pack: {
      '8': { stripePriceId: 'price_pack_8', cents: 3200 },
      '9': { stripePriceId: 'price_pack_9', cents: 3600 },
      '10': { stripePriceId: 'price_pack_10', cents: 4000 },
      '12': { stripePriceId: 'price_pack_12', cents: 4800 },
    },
    single: {
      '8': { stripePriceId: 'price_single_8', cents: 800 },
      '9': { stripePriceId: 'price_single_9', cents: 900 },
      '10': { stripePriceId: 'price_single_10', cents: 1000 },
      '12': { stripePriceId: 'price_single_12', cents: 1200 },
    },
  },
  sales: [],
  settings: { baseDiscountCents: 500, baseCouponId: 'coupon_base' },
  source: 'db' as const,
}

function saleRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sale-1',
    slug: 'labor-day-2026',
    label: 'Labor Day',
    badge: 'LABOR DAY',
    emoji: '🛠️',
    end_label: null,
    starts_at: new Date(NOW - 24 * HOUR).toISOString(),
    ends_at: new Date(NOW + 24 * HOUR).toISOString(),
    extra_discount_cents: 500,
    stripe_coupon_id: 'coupon_labor',
    stripe_amount_off_cents: 1000,
    status: 'scheduled',
    ...overrides,
  }
}

const baseSaleInput = {
  slug: 'labor-day-2026',
  label: 'Labor Day',
  badge: 'LABOR DAY',
  emoji: '🛠️',
  endLabel: null,
  startMs: NOW - 24 * HOUR,
  endMs: NOW + 24 * HOUR,
  extraDiscountCents: 500,
  publish: true,
  actorEmail: 'will@example.com',
}

beforeEach(() => {
  vi.clearAllMocks()
  queues = {}
  inserts = []
  updates = []
  getSupabaseAdmin.mockReturnValue(makeSupabase())
  getStripeSecretKey.mockReturnValue('sk_test_fake')
  getPricingSnapshot.mockResolvedValue(SNAPSHOT)
  pricesRetrieve.mockResolvedValue({
    id: 'price_pack_12',
    product: 'prod_12',
    metadata: {},
  })
  pricesCreate.mockResolvedValue({ id: 'price_new' })
  pricesUpdate.mockResolvedValue({})
  couponsCreate.mockImplementation(async () => ({ id: 'coupon_new' }))
  couponsDel.mockResolvedValue({})
  productsUpdate.mockResolvedValue({})
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

// =========================================================================
describe('updateCatalogPrice', () => {
  it('creates a new Stripe Price on the same Product and records it', async () => {
    const res = await updateCatalogPrice({
      kind: 'pack',
      washValue: '12',
      unitAmountCents: 4500,
      actorEmail: 'will@example.com',
    })

    expect(res.ok).toBe(true)
    expect(pricesCreate).toHaveBeenCalledWith(
      expect.objectContaining({ product: 'prod_12', unit_amount: 4500, currency: 'usd' }),
    )
    const row = inserts.find((i) => i.table === 'catalog_prices')?.payload as Record<string, unknown>
    expect(row).toMatchObject({
      kind: 'pack',
      wash_value: '12',
      unit_amount_cents: 4500,
      stripe_price_id: 'price_new',
      active: true,
    })
    expect(invalidatePricingCache).toHaveBeenCalled()
  })

  it('deactivates the previous row before inserting the new one', async () => {
    // The partial unique index allows only one active row per SKU, so the
    // opposite order would trip a constraint violation.
    await updateCatalogPrice({
      kind: 'pack',
      washValue: '12',
      unitAmountCents: 4500,
      actorEmail: null,
    })
    expect(updates[0]).toMatchObject({ table: 'catalog_prices', payload: { active: false } })
    expect(inserts.some((i) => i.table === 'catalog_prices')).toBe(true)
  })

  it('leaves an env-configured Price active so the fallback keeps working', async () => {
    // Archiving the env-var Price would turn a Supabase blip into a checkout
    // outage: archived Prices can't be used in new Checkout Sessions.
    pricesRetrieve.mockResolvedValue({ id: 'price_pack_12', product: 'prod_12', metadata: {} })
    await updateCatalogPrice({
      kind: 'pack',
      washValue: '12',
      unitAmountCents: 4500,
      actorEmail: null,
    })
    expect(pricesUpdate).not.toHaveBeenCalled()
  })

  it('archives a superseded Price this tool created', async () => {
    pricesRetrieve.mockResolvedValue({
      id: 'price_prev',
      product: 'prod_12',
      metadata: { source: 'admin_pricing' },
    })
    await updateCatalogPrice({
      kind: 'pack',
      washValue: '12',
      unitAmountCents: 4500,
      actorEmail: null,
    })
    expect(pricesUpdate).toHaveBeenCalledWith('price_prev', { active: false })
  })

  it('bootstraps a Product when the SKU has never been priced', async () => {
    // This is what removes the "go set it up in Stripe first" step.
    getPricingSnapshot.mockResolvedValue({
      ...SNAPSHOT,
      prices: {
        ...SNAPSHOT.prices,
        pack: { ...SNAPSHOT.prices.pack, '12': { stripePriceId: '', cents: null } },
      },
    })
    productsSearch.mockResolvedValue({ data: [] })
    productsCreate.mockResolvedValue({ id: 'prod_fresh' })

    const res = await updateCatalogPrice({
      kind: 'pack',
      washValue: '12',
      unitAmountCents: 4500,
      actorEmail: null,
    })

    expect(res.ok).toBe(true)
    expect(productsCreate).toHaveBeenCalled()
    expect(pricesCreate).toHaveBeenCalledWith(
      expect.objectContaining({ product: 'prod_fresh' }),
    )
  })

  it('reuses an existing Product found by lookup key instead of duplicating it', async () => {
    getPricingSnapshot.mockResolvedValue({
      ...SNAPSHOT,
      prices: {
        ...SNAPSHOT.prices,
        pack: { ...SNAPSHOT.prices.pack, '12': { stripePriceId: '', cents: null } },
      },
    })
    productsSearch.mockResolvedValue({ data: [{ id: 'prod_existing' }] })

    await updateCatalogPrice({
      kind: 'pack',
      washValue: '12',
      unitAmountCents: 4500,
      actorEmail: null,
    })

    expect(productsCreate).not.toHaveBeenCalled()
    expect(pricesCreate).toHaveBeenCalledWith(
      expect.objectContaining({ product: 'prod_existing' }),
    )
  })

  it.each([
    [0, 'zero'],
    [-100, 'negative'],
    [50_001, 'above the $500 typo guard'],
  ])('rejects %s (%s) without touching Stripe', async (cents) => {
    const res = await updateCatalogPrice({
      kind: 'pack',
      washValue: '12',
      unitAmountCents: cents,
      actorEmail: null,
    })
    expect(res.ok).toBe(false)
    expect(pricesCreate).not.toHaveBeenCalled()
  })

  it('rejects a no-op change', async () => {
    const res = await updateCatalogPrice({
      kind: 'pack',
      washValue: '12',
      unitAmountCents: 4800,
      actorEmail: null,
    })
    expect(res.ok).toBe(false)
    expect(pricesCreate).not.toHaveBeenCalled()
  })

  it('writes nothing to the database when Stripe rejects the price', async () => {
    pricesCreate.mockRejectedValue(new Error('card_declined'))
    const res = await updateCatalogPrice({
      kind: 'pack',
      washValue: '12',
      unitAmountCents: 4500,
      actorEmail: null,
    })
    expect(res.ok).toBe(false)
    expect(inserts.filter((i) => i.table === 'catalog_prices')).toHaveLength(0)
  })

  it('reports the orphaned Price id when the database write fails', async () => {
    // The admin needs to know a Stripe object was created, since the audit log
    // is the only other record of it.
    enqueue('catalog_prices', { error: null })
    enqueue('catalog_prices', { error: { message: 'boom' } })
    const res = await updateCatalogPrice({
      kind: 'pack',
      washValue: '12',
      unitAmountCents: 4500,
      actorEmail: null,
    })
    expect(res.ok).toBe(false)
    expect(res.message).toContain('price_new')
  })

  it('fails closed when Stripe is not configured', async () => {
    // The Stripe client is a module-scoped singleton (the secret can't change
    // at runtime in production), so this needs a freshly imported module
    // rather than just a re-stubbed env getter.
    vi.resetModules()
    getStripeSecretKey.mockReturnValue(undefined)
    const fresh = await import('./pricingAdmin')

    const res = await fresh.updateCatalogPrice({
      kind: 'pack',
      washValue: '12',
      unitAmountCents: 4500,
      actorEmail: null,
    })

    expect(res).toMatchObject({ ok: false })
    expect(res.message).toMatch(/not configured/i)
    expect(pricesCreate).not.toHaveBeenCalled()
  })
})

// =========================================================================
describe('adoptCatalogSku', () => {
  it('points the Product at the current Price and stamps the lookup key', async () => {
    // Adoption is how a SKU created by hand, long before this tool existed,
    // becomes Stripe-authoritative WITHOUT changing its price.
    const res = await adoptCatalogSku('pack', '12', 'will@example.com')

    expect(res.ok).toBe(true)
    expect(productsUpdate).toHaveBeenCalledWith(
      'prod_12',
      expect.objectContaining({
        default_price: 'price_pack_12',
        metadata: expect.objectContaining({ lookup_key: 'spotless_pack_12' }),
      }),
    )
    expect(invalidatePricingCache).toHaveBeenCalled()
  })

  it('never creates a new Price — the amount must not change', async () => {
    await adoptCatalogSku('pack', '12', null)
    expect(pricesCreate).not.toHaveBeenCalled()
  })

  it('refuses when the SKU has no Stripe price to adopt', async () => {
    getPricingSnapshot.mockResolvedValue({
      ...SNAPSHOT,
      prices: {
        ...SNAPSHOT.prices,
        pack: { ...SNAPSHOT.prices.pack, '12': { stripePriceId: '', cents: null } },
      },
    })
    const res = await adoptCatalogSku('pack', '12', null)
    expect(res.ok).toBe(false)
    expect(productsUpdate).not.toHaveBeenCalled()
  })

  it('reports a Stripe failure instead of claiming success', async () => {
    productsUpdate.mockRejectedValue(new Error('permission denied'))
    const res = await adoptCatalogSku('pack', '12', null)
    expect(res.ok).toBe(false)
    expect(res.message).toContain('permission denied')
  })

  it('fails closed when Stripe is not configured', async () => {
    vi.resetModules()
    getStripeSecretKey.mockReturnValue(undefined)
    const fresh = await import('./pricingAdmin')
    const res = await fresh.adoptCatalogSku('pack', '12', null)
    expect(res.ok).toBe(false)
    expect(res.message).toMatch(/not configured/i)
  })
})

// =========================================================================
describe('updateCatalogPrice — Stripe adoption', () => {
  it('sets the new Price as the Product default so the site actually uses it', async () => {
    // Without this the new Price exists in Stripe but nothing points at it.
    await updateCatalogPrice({
      kind: 'pack',
      washValue: '12',
      unitAmountCents: 4500,
      actorEmail: null,
    })

    expect(productsUpdate).toHaveBeenCalledWith(
      'prod_12',
      expect.objectContaining({ default_price: 'price_new' }),
    )
  })
})

// =========================================================================
describe('saveSale', () => {
  it('provisions a coupon worth base + extra, expiring when the sale ends', async () => {
    // Stripe applies ONE coupon per session, so the sale coupon must carry the
    // bundle discount too. redeem_by stops an expired sale being redeemed from
    // a stale page.
    enqueue('sales', { data: [], error: null })
    enqueue('sales', { data: { id: 'sale-new' }, error: null })

    const res = await saveSale({ ...baseSaleInput })

    expect(res.ok).toBe(true)
    expect(couponsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        amount_off: 1000,
        currency: 'usd',
        duration: 'once',
        redeem_by: Math.floor(baseSaleInput.endMs / 1000),
      }),
    )
    const row = inserts.find((i) => i.table === 'sales')?.payload as Record<string, unknown>
    expect(row).toMatchObject({
      status: 'scheduled',
      stripe_coupon_id: 'coupon_new',
      stripe_amount_off_cents: 1000,
    })
  })

  it('saves a draft without creating anything in Stripe', async () => {
    enqueue('sales', { data: [], error: null })
    enqueue('sales', { data: { id: 'sale-new' }, error: null })

    const res = await saveSale({ ...baseSaleInput, publish: false })

    expect(res.ok).toBe(true)
    expect(couponsCreate).not.toHaveBeenCalled()
    const row = inserts.find((i) => i.table === 'sales')?.payload as Record<string, unknown>
    expect(row).toMatchObject({ status: 'draft', stripe_coupon_id: null })
  })

  it('refuses a window that overlaps another scheduled sale', async () => {
    enqueue('sales', { data: [saleRow({ id: 'other' })], error: null })
    const res = await saveSale({ ...baseSaleInput })
    expect(res.ok).toBe(false)
    expect(res.message).toContain('Labor Day')
    expect(couponsCreate).not.toHaveBeenCalled()
  })

  it('reuses the existing coupon when nothing material changed', async () => {
    enqueue('sales', { data: [saleRow()], error: null })
    enqueue('sales', { data: { id: 'sale-1' }, error: null })

    const res = await saveSale({ ...baseSaleInput, id: 'sale-1', label: 'Labor Day Sale' })

    expect(res.ok).toBe(true)
    expect(couponsCreate).not.toHaveBeenCalled()
    expect(couponsDel).not.toHaveBeenCalled()
  })

  it('issues a new coupon when the end date moves', async () => {
    // Regression: Stripe's redeem_by is immutable, so extending a sale while
    // reusing its coupon would advertise a discount Stripe then refuses.
    enqueue('sales', { data: [saleRow()], error: null })
    enqueue('sales', { data: { id: 'sale-1' }, error: null })

    const extendedEnd = NOW + 72 * HOUR
    const res = await saveSale({ ...baseSaleInput, id: 'sale-1', endMs: extendedEnd })

    expect(res.ok).toBe(true)
    expect(couponsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ redeem_by: Math.floor(extendedEnd / 1000) }),
    )
    expect(couponsDel).toHaveBeenCalledWith('coupon_labor')
  })

  it('issues a new coupon when the discount changes', async () => {
    enqueue('sales', { data: [saleRow()], error: null })
    enqueue('sales', { data: { id: 'sale-1' }, error: null })

    const res = await saveSale({ ...baseSaleInput, id: 'sale-1', extraDiscountCents: 900 })

    expect(res.ok).toBe(true)
    expect(couponsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ amount_off: 1400 }),
    )
  })

  it('deletes the superseded coupon only after the row points at the new one', async () => {
    enqueue('sales', { data: [saleRow()], error: null })
    enqueue('sales', { data: null, error: { message: 'write failed' } })

    const res = await saveSale({ ...baseSaleInput, id: 'sale-1', extraDiscountCents: 900 })

    expect(res.ok).toBe(false)
    // The old coupon must survive a failed write — the row still references it.
    expect(couponsDel).not.toHaveBeenCalled()
  })

  it('explains a duplicate slug in plain language', async () => {
    enqueue('sales', { data: [], error: null })
    enqueue('sales', { data: null, error: { code: '23505', message: 'duplicate key' } })

    const res = await saveSale({ ...baseSaleInput })
    expect(res.ok).toBe(false)
    expect(res.message).toMatch(/already exists/i)
  })

  it.each([
    { patch: { label: '' }, why: 'a missing label' },
    { patch: { badge: '' }, why: 'missing badge text' },
    { patch: { endMs: baseSaleInput.startMs }, why: 'an end not after the start' },
    { patch: { extraDiscountCents: 0 }, why: 'a zero discount' },
    { patch: { extraDiscountCents: 3_001 }, why: 'a discount larger than a pack' },
  ])('rejects $why', async ({ patch }) => {
    const res = await saveSale({ ...baseSaleInput, ...patch })
    expect(res.ok).toBe(false)
    expect(couponsCreate).not.toHaveBeenCalled()
  })
})

// =========================================================================
describe('publishSale', () => {
  it('provisions the coupon for an existing draft', async () => {
    enqueue('sales', { data: saleRow({ status: 'draft', stripe_coupon_id: null, stripe_amount_off_cents: null }), error: null })
    enqueue('sales', { data: [], error: null })
    enqueue('sales', { data: { id: 'sale-1' }, error: null })

    const res = await publishSale('sale-1', 'will@example.com')

    expect(res.ok).toBe(true)
    expect(couponsCreate).toHaveBeenCalledWith(expect.objectContaining({ amount_off: 1000 }))
  })

  it('reports a sale that no longer exists', async () => {
    enqueue('sales', { data: null, error: null })
    const res = await publishSale('missing', null)
    expect(res).toMatchObject({ ok: false })
  })
})

// =========================================================================
describe('cancelSale', () => {
  it('marks the row canceled and deletes the coupon', async () => {
    enqueue('sales', { data: saleRow(), error: null })
    const res = await cancelSale('sale-1', 'will@example.com')

    expect(res.ok).toBe(true)
    expect(updates.find((u) => u.table === 'sales')?.payload).toMatchObject({
      status: 'canceled',
    })
    expect(couponsDel).toHaveBeenCalledWith('coupon_labor')
    expect(invalidatePricingCache).toHaveBeenCalled()
  })

  it('tells the admin the discount stops immediately for a live sale', async () => {
    enqueue('sales', { data: saleRow(), error: null })
    const res = await cancelSale('sale-1', null)
    expect(res.message).toMatch(/immediately/i)
  })

  it('still cancels when deleting the Stripe coupon fails', async () => {
    // The row is already canceled, so the storefront has stopped offering the
    // sale regardless of what Stripe says.
    enqueue('sales', { data: saleRow(), error: null })
    couponsDel.mockRejectedValue(new Error('no such coupon'))
    const res = await cancelSale('sale-1', null)
    expect(res.ok).toBe(true)
  })
})

// =========================================================================
describe('reprovisionSale', () => {
  it('re-issues the coupon at the current base discount and drops the stale one', async () => {
    enqueue('sales', { data: saleRow(), error: null })
    getPricingSnapshot.mockResolvedValue({
      ...SNAPSHOT,
      settings: { baseDiscountCents: 600, baseCouponId: 'coupon_base' },
    })

    const res = await reprovisionSale('sale-1', 'will@example.com')

    expect(res.ok).toBe(true)
    expect(couponsCreate).toHaveBeenCalledWith(expect.objectContaining({ amount_off: 1100 }))
    expect(couponsDel).toHaveBeenCalledWith('coupon_labor')
  })

  it('refuses to re-issue a coupon for a sale that already ended', async () => {
    enqueue('sales', {
      data: saleRow({
        starts_at: new Date(NOW - 72 * HOUR).toISOString(),
        ends_at: new Date(NOW - 48 * HOUR).toISOString(),
      }),
      error: null,
    })
    const res = await reprovisionSale('sale-1', null)
    expect(res.ok).toBe(false)
    expect(couponsCreate).not.toHaveBeenCalled()
  })
})

// =========================================================================
describe('updateBaseDiscount', () => {
  it('creates an always-on coupon with no expiry and saves it', async () => {
    const res = await updateBaseDiscount(600, 'will@example.com')

    expect(res.ok).toBe(true)
    const args = couponsCreate.mock.calls[0][0] as Record<string, unknown>
    expect(args).toMatchObject({ amount_off: 600, duration: 'once' })
    expect(args).not.toHaveProperty('redeem_by')
    expect(updates.find((u) => u.table === 'pricing_settings')?.payload).toMatchObject({
      base_discount_cents: 600,
      base_coupon_id: 'coupon_new',
    })
  })

  it('warns that scheduled sales still carry their old coupon', async () => {
    const res = await updateBaseDiscount(600, null)
    expect(res.message).toMatch(/re-issue/i)
  })

  it.each([
    [0, 'zero'],
    [-1, 'negative'],
    [2_001, 'above the cap'],
    [500, 'unchanged'],
  ])('rejects %s (%s)', async (cents) => {
    const res = await updateBaseDiscount(cents, null)
    expect(res.ok).toBe(false)
    expect(couponsCreate).not.toHaveBeenCalled()
  })
})
