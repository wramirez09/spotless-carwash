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
  productsList,
  productsCreate,
  productsUpdate,
  pricesList,
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
  productsList: vi.fn(),
  pricesList: vi.fn(),
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
    prices = {
      retrieve: pricesRetrieve,
      create: pricesCreate,
      update: pricesUpdate,
      list: pricesList,
    }
    coupons = { create: couponsCreate, del: couponsDel }
    products = {
      list: productsList,
      create: productsCreate,
      update: productsUpdate,
    }
  } as unknown as { new (): unknown; errors: { StripeError: typeof StripeError } }
  FakeStripe.errors = { StripeError }
  return { default: FakeStripe }
})

vi.mock('./supabase', () => ({ getSupabaseAdmin }))
vi.mock('./stripeEnv', () => ({ getStripeSecretKey }))
// Wash packages (CMS). Default: no CMS answer, so nothing is restricted.
type Lineup = { source: string; tiers: { name: string; washValue: string; priceCents: number }[]; packages: never[] }
const washLineup = vi.hoisted(() => ({
  value: { source: 'fallback', tiers: [], packages: [] } as Lineup,
  /** What a stale (cached) read returns, when a test needs it to differ. */
  cached: null as Lineup | null,
}))
vi.mock('./washPackages', () => ({
  getWashLineup: async (opts?: { fresh?: boolean }) =>
    opts?.fresh ? washLineup.value : (washLineup.cached ?? washLineup.value),
}))

vi.mock('./pricingStore', async () => {
  const { mapSaleRow } = await vi.importActual<typeof import('./pricingStore')>(
    './pricingStore',
  )
  return { getPricingSnapshot, invalidatePricingCache, mapSaleRow }
})

import {
  adoptAllCatalogSkus,
  adoptCatalogSku,
  createCatalogSku,
  deleteCatalogSku,
  setSkuFeatured,
  syncCatalogToWashPackages,
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

function catalogEntry(kind: 'pack' | 'single', v: string, cents: number) {
  return {
    sku: `spotless_${kind}_${v}`,
    kind,
    washValue: v,
    tokens: kind === 'pack' ? 4 : 1,
    cents,
    stripePriceId: `price_${kind}_${v}`,
    stripeProductId: null,
    featured: false,
    sortOrder: 100,
    source: 'stripe' as const,
  }
}

const SNAPSHOT = {
  catalog: [
    catalogEntry('pack', '8', 3200),
    catalogEntry('pack', '9', 3600),
    catalogEntry('pack', '10', 4000),
    catalogEntry('pack', '12', 4800),
    catalogEntry('single', '8', 800),
    catalogEntry('single', '9', 900),
    catalogEntry('single', '10', 1000),
    catalogEntry('single', '12', 1200),
  ],
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
  washLineup.value = { source: 'fallback', tiers: [], packages: [] }
  washLineup.cached = null
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
  productsList.mockResolvedValue({ data: [], has_more: false })
  pricesList.mockResolvedValue({ data: [] })
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

// =========================================================================
// =========================================================================
// Catalog
// =========================================================================

/** A Stripe Product as products.list returns it (default_price expanded). */
function stripeProduct(
  sku: string,
  over: { id?: string; active?: boolean; priceId?: string | null; cents?: number } = {},
) {
  const priceId = over.priceId === undefined ? `price_${sku}` : over.priceId
  return {
    id: over.id ?? `prod_${sku}`,
    active: over.active ?? true,
    metadata: { lookup_key: sku },
    default_price: priceId
      ? { id: priceId, active: true, unit_amount: over.cents ?? 4800 }
      : null,
  }
}

function listing(...products: unknown[]) {
  productsList.mockResolvedValue({ data: products, has_more: false })
}

describe('createCatalogSku', () => {
  const input = {
    kind: 'pack' as const,
    washValue: '12',
    tokens: 10,
    unitAmountCents: 11000,
    actorEmail: 'will@example.com',
  }

  it('creates a keyed Product + Price, so the store lists it with no deploy', async () => {
    listing()
    productsCreate.mockResolvedValue({ id: 'prod_new' })

    const result = await createCatalogSku(input)

    expect(result.ok).toBe(true)
    expect(productsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '$12 Wash Token — 10-Pack',
        metadata: expect.objectContaining({
          lookup_key: 'spotless_pack_12_x10',
          token_count: '10',
        }),
      }),
    )
    expect(pricesCreate).toHaveBeenCalledWith(
      expect.objectContaining({ product: 'prod_new', unit_amount: 11000, currency: 'usd' }),
    )
    // default_price is what puts it on sale.
    expect(productsUpdate).toHaveBeenCalledWith(
      'prod_new',
      expect.objectContaining({ active: true, default_price: 'price_new' }),
    )
    expect(invalidatePricingCache).toHaveBeenCalled()
  })

  it('revives an archived Product instead of creating a duplicate', async () => {
    listing(stripeProduct('spotless_pack_12_x10', { id: 'prod_old', active: false }))

    const result = await createCatalogSku(input)

    expect(result.ok).toBe(true)
    expect(productsCreate).not.toHaveBeenCalled()
    expect(pricesCreate).toHaveBeenCalledWith(expect.objectContaining({ product: 'prod_old' }))
    expect(productsUpdate).toHaveBeenCalledWith(
      'prod_old',
      expect.objectContaining({ active: true, default_price: 'price_new' }),
    )
  })

  it('refuses a SKU that is already on sale', async () => {
    listing(stripeProduct('spotless_pack_12_x10'))
    const result = await createCatalogSku(input)
    expect(result.ok).toBe(false)
    expect(result.message).toMatch(/already exists/)
    expect(pricesCreate).not.toHaveBeenCalled()
  })

  it('refuses a legacy SKU still on sale from the deploy config', async () => {
    listing() // nothing keyed in Stripe yet
    const result = await createCatalogSku({ ...input, tokens: 4, washValue: '12' })
    expect(result.ok).toBe(false)
    expect(result.message).toMatch(/already exists/)
  })

  it('forces a single token to one token, whatever the form said', async () => {
    listing()
    productsCreate.mockResolvedValue({ id: 'prod_s15' })
    await createCatalogSku({ ...input, kind: 'single', washValue: '15', tokens: 7, unitAmountCents: 1500 })
    expect(productsCreate.mock.calls[0][0].metadata.lookup_key).toBe('spotless_single_15')
  })

  it('records the Most Popular flag when asked', async () => {
    listing()
    productsCreate.mockResolvedValue({ id: 'prod_new' })
    await createCatalogSku({ ...input, featured: true })
    expect(productsUpdate).toHaveBeenCalledWith('prod_new', {
      metadata: { featured: 'true' },
    })
  })

  it('validates before touching Stripe', async () => {
    for (const bad of [
      { washValue: '0' },
      { washValue: '12.5' },
      { tokens: 1 },
      { tokens: 51 },
      { unitAmountCents: 0 },
      { unitAmountCents: 60_000 },
    ]) {
      const result = await createCatalogSku({ ...input, ...bad })
      expect(result.ok).toBe(false)
    }
    expect(productsList).not.toHaveBeenCalled()
  })

  it('creates nothing when Stripe cannot be listed', async () => {
    // Without the listing we can't tell "new" from "already exists".
    productsList.mockRejectedValue(new Error('down'))
    const result = await createCatalogSku(input)
    expect(result.ok).toBe(false)
    expect(productsCreate).not.toHaveBeenCalled()
  })

  it('writes no price history for a pack size the table cannot hold', async () => {
    listing()
    productsCreate.mockResolvedValue({ id: 'prod_new' })
    await createCatalogSku(input)
    expect(inserts.filter((i) => i.table === 'catalog_prices')).toHaveLength(0)
  })

  it('reports a Stripe rejection and audits it', async () => {
    listing()
    productsCreate.mockRejectedValue(new StripeError('Invalid name'))
    const result = await createCatalogSku(input)
    expect(result.ok).toBe(false)
    expect(result.message).toContain('Invalid name')
    expect(inserts).toContainEqual(
      expect.objectContaining({
        table: 'pricing_audit_log',
        payload: expect.objectContaining({ action: 'sku.create', succeeded: false }),
      }),
    )
  })
})

describe('updateCatalogPrice', () => {
  const input = { sku: 'spotless_pack_12', unitAmountCents: 4500, actorEmail: 'will@example.com' }

  it('creates a new Price on the same Product and makes it the default', async () => {
    listing(stripeProduct('spotless_pack_12', { id: 'prod_12', priceId: 'price_old' }))

    const result = await updateCatalogPrice(input)

    expect(result.ok).toBe(true)
    expect(pricesCreate).toHaveBeenCalledWith(
      expect.objectContaining({ product: 'prod_12', unit_amount: 4500 }),
    )
    expect(productsUpdate).toHaveBeenCalledWith(
      'prod_12',
      expect.objectContaining({
        default_price: 'price_new',
        metadata: expect.objectContaining({ lookup_key: 'spotless_pack_12' }),
      }),
    )
  })

  it('reprices an admin-created pack size', async () => {
    listing(stripeProduct('spotless_pack_15_x10', { id: 'prod_15', cents: 13500 }))
    const result = await updateCatalogPrice({ ...input, sku: 'spotless_pack_15_x10', unitAmountCents: 12000 })
    expect(result.ok).toBe(true)
    expect(productsUpdate.mock.calls[0][1].metadata).toMatchObject({
      lookup_key: 'spotless_pack_15_x10',
      token_count: '10',
    })
  })

  it('archives a superseded Price this tool created', async () => {
    listing(stripeProduct('spotless_pack_12', { priceId: 'price_old' }))
    pricesRetrieve.mockResolvedValue({ id: 'price_old', metadata: { source: 'admin_pricing' } })
    await updateCatalogPrice(input)
    expect(pricesUpdate).toHaveBeenCalledWith('price_old', { active: false })
  })

  it('leaves an env-configured Price active so the fallback keeps working', async () => {
    listing(stripeProduct('spotless_pack_12', { priceId: 'price_env' }))
    pricesRetrieve.mockResolvedValue({ id: 'price_env', metadata: {} })
    await updateCatalogPrice(input)
    expect(pricesUpdate).not.toHaveBeenCalled()
  })

  it('adopts a legacy SKU found only through its env-var Price', async () => {
    listing() // not keyed yet
    pricesRetrieve.mockResolvedValue({ id: 'price_pack_12', product: 'prod_handmade', unit_amount: 4800, metadata: {} })

    const result = await updateCatalogPrice(input)

    expect(result.ok).toBe(true)
    expect(pricesCreate).toHaveBeenCalledWith(expect.objectContaining({ product: 'prod_handmade' }))
  })

  it('records history for the original eight, after Stripe', async () => {
    listing(stripeProduct('spotless_pack_12'))
    await updateCatalogPrice(input)
    expect(updates[0]).toMatchObject({ table: 'catalog_prices', payload: { active: false } })
    expect(inserts).toContainEqual({
      table: 'catalog_prices',
      payload: expect.objectContaining({ stripe_price_id: 'price_new', unit_amount_cents: 4500 }),
    })
  })

  it('still succeeds when the history write fails — Stripe already took the change', async () => {
    listing(stripeProduct('spotless_pack_12'))
    enqueue('catalog_prices', { error: { message: 'db down' } })
    const result = await updateCatalogPrice(input)
    expect(result.ok).toBe(true)
  })

  it('rejects a no-op change', async () => {
    listing(stripeProduct('spotless_pack_12', { cents: 4500 }))
    const result = await updateCatalogPrice(input)
    expect(result.ok).toBe(false)
    expect(pricesCreate).not.toHaveBeenCalled()
  })

  it('refuses to reprice a removed SKU', async () => {
    listing(stripeProduct('spotless_pack_12', { active: false }))
    const result = await updateCatalogPrice(input)
    expect(result.ok).toBe(false)
    expect(result.message).toMatch(/isn't on sale/)
  })

  it('blocks typo-sized prices', async () => {
    const result = await updateCatalogPrice({ ...input, unitAmountCents: 320_000 })
    expect(result.ok).toBe(false)
    expect(result.message).toMatch(/typo/)
  })

  it('rejects an unknown SKU id', async () => {
    expect((await updateCatalogPrice({ ...input, sku: 'prod_whatever' })).ok).toBe(false)
  })

  it('writes nothing to the database when Stripe rejects the price', async () => {
    listing(stripeProduct('spotless_pack_12'))
    pricesCreate.mockRejectedValue(new StripeError('Amount too small'))
    const result = await updateCatalogPrice(input)
    expect(result.ok).toBe(false)
    expect(inserts.filter((i) => i.table === 'catalog_prices')).toHaveLength(0)
  })

  it('fails closed when Stripe is not configured', async () => {
    vi.resetModules()
    getStripeSecretKey.mockReturnValue(undefined)
    const fresh = await import('./pricingAdmin')
    const result = await fresh.updateCatalogPrice(input)
    expect(result.ok).toBe(false)
    expect(result.message).toMatch(/Stripe is not configured/)
  })
})

describe('deleteCatalogSku', () => {
  it('archives the Product but keeps its lookup key as a tombstone', async () => {
    listing(stripeProduct('spotless_pack_9', { id: 'prod_9' }))

    const result = await deleteCatalogSku('spotless_pack_9', 'will@example.com')

    expect(result.ok).toBe(true)
    expect(productsUpdate).toHaveBeenCalledWith('prod_9', {
      active: false,
      metadata: expect.objectContaining({ lookup_key: 'spotless_pack_9' }),
    })
    expect(invalidatePricingCache).toHaveBeenCalled()
  })

  it('keys and archives a legacy Product that was never adopted', async () => {
    listing()
    pricesRetrieve.mockResolvedValue({ id: 'price_single_8', product: 'prod_handmade', metadata: {} })
    const result = await deleteCatalogSku('spotless_single_8', null)
    expect(result.ok).toBe(true)
    expect(productsUpdate).toHaveBeenCalledWith(
      'prod_handmade',
      expect.objectContaining({ active: false }),
    )
  })

  it('retires the price-history row so a Stripe outage cannot bring it back', async () => {
    listing(stripeProduct('spotless_pack_9'))
    await deleteCatalogSku('spotless_pack_9', null)
    expect(updates).toContainEqual({ table: 'catalog_prices', payload: { active: false } })
  })

  it('says so when the SKU is already gone', async () => {
    listing(stripeProduct('spotless_pack_9', { active: false }))
    const result = await deleteCatalogSku('spotless_pack_9', null)
    expect(result.ok).toBe(false)
    expect(productsUpdate).not.toHaveBeenCalled()
  })

  it('reports a Stripe failure instead of claiming success', async () => {
    listing(stripeProduct('spotless_pack_9'))
    productsUpdate.mockRejectedValue(new StripeError('nope'))
    const result = await deleteCatalogSku('spotless_pack_9', null)
    expect(result.ok).toBe(false)
    expect(invalidatePricingCache).not.toHaveBeenCalled()
  })
})

describe('setSkuFeatured', () => {
  it('stamps the featured flag on the keyed Product', async () => {
    listing(stripeProduct('spotless_pack_10', { id: 'prod_10' }))
    const result = await setSkuFeatured('spotless_pack_10', true, null)
    expect(result.ok).toBe(true)
    expect(productsUpdate).toHaveBeenLastCalledWith('prod_10', { metadata: { featured: 'true' } })
  })

  it('takes Most Popular away from the SKU that had it, even by default', async () => {
    // The $12 4-pack is Most Popular with no flag set at all; featuring
    // another SKU must write an explicit false, or the store shows two.
    listing(
      stripeProduct('spotless_pack_10', { id: 'prod_10' }),
      stripeProduct('spotless_pack_12', { id: 'prod_12' }),
    )
    getPricingSnapshot.mockResolvedValue({
      ...SNAPSHOT,
      catalog: SNAPSHOT.catalog.map((s) =>
        s.sku === 'spotless_pack_12' ? { ...s, featured: true } : s,
      ),
    })

    await setSkuFeatured('spotless_pack_10', true, null)

    expect(productsUpdate).toHaveBeenCalledWith('prod_12', { metadata: { featured: 'false' } })
    expect(productsUpdate).not.toHaveBeenCalledWith('prod_10', { metadata: { featured: 'false' } })
  })

  it('leaves other SKUs alone when un-featuring', async () => {
    listing(stripeProduct('spotless_pack_10', { id: 'prod_10' }))
    await setSkuFeatured('spotless_pack_10', false, null)
    expect(productsUpdate).toHaveBeenLastCalledWith('prod_10', { metadata: { featured: 'false' } })
    expect(getPricingSnapshot).not.toHaveBeenCalled()
  })

  it('refuses a SKU that is not on sale', async () => {
    listing()
    getPricingSnapshot.mockResolvedValue({ ...SNAPSHOT, catalog: [] })
    expect((await setSkuFeatured('spotless_pack_15', true, null)).ok).toBe(false)
  })
})

describe('adoptCatalogSku', () => {
  it('points the Product at the current Price and stamps the lookup key', async () => {
    const result = await adoptCatalogSku('spotless_pack_12', 'will@example.com')
    expect(result.ok).toBe(true)
    expect(productsUpdate).toHaveBeenCalledWith(
      'prod_12',
      expect.objectContaining({
        default_price: 'price_pack_12',
        metadata: expect.objectContaining({ lookup_key: 'spotless_pack_12' }),
      }),
    )
  })

  it('never creates a new Price — the amount must not change', async () => {
    await adoptCatalogSku('spotless_pack_12', null)
    expect(pricesCreate).not.toHaveBeenCalled()
  })

  it('refuses when the SKU has no Stripe price to adopt', async () => {
    getPricingSnapshot.mockResolvedValue({ ...SNAPSHOT, catalog: [] })
    const result = await adoptCatalogSku('spotless_pack_12', null)
    expect(result.ok).toBe(false)
    expect(productsUpdate).not.toHaveBeenCalled()
  })

  it('reports a Stripe failure instead of claiming success', async () => {
    productsUpdate.mockRejectedValue(new StripeError('No such product'))
    const result = await adoptCatalogSku('spotless_pack_12', null)
    expect(result.ok).toBe(false)
    expect(result.message).toContain('No such product')
  })

  it('links every deploy-config SKU in one go', async () => {
    getPricingSnapshot.mockResolvedValue({
      ...SNAPSHOT,
      catalog: SNAPSHOT.catalog.map((s, i) => (i < 2 ? { ...s, source: 'env' } : s)),
    })
    const result = await adoptAllCatalogSkus(null)
    expect(result.ok).toBe(true)
    expect(productsUpdate).toHaveBeenCalledTimes(2)
  })
})

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

// =========================================================================
// Wash packages are the source of truth
// =========================================================================

const LIVE_TIERS = [
  { name: 'Deluxe', washValue: '10', priceCents: 1000 },
  { name: 'Ultimate', washValue: '12', priceCents: 1200 },
  { name: 'Lustre', washValue: '14', priceCents: 1400 },
]

describe('createCatalogSku — token values follow the wash packages', () => {
  it('refuses a token value with no wash package', async () => {
    washLineup.value = { source: 'cms', tiers: LIVE_TIERS, packages: [] }
    const result = await createCatalogSku({
      kind: 'pack',
      washValue: '9',
      tokens: 4,
      unitAmountCents: 3600,
      actorEmail: null,
    })
    expect(result.ok).toBe(false)
    expect(result.message).toMatch(/no \$9 wash package/)
    expect(productsList).not.toHaveBeenCalled()
  })

  it('does not block creation when the CMS is unreachable', async () => {
    listing()
    productsCreate.mockResolvedValue({ id: 'prod_new' })
    const result = await createCatalogSku({
      kind: 'pack',
      washValue: '9',
      tokens: 10,
      unitAmountCents: 9000,
      actorEmail: null,
    })
    expect(result.ok).toBe(true)
  })
})

describe('syncCatalogToWashPackages', () => {
  beforeEach(() => {
    washLineup.value = { source: 'cms', tiers: LIVE_TIERS, packages: [] }
  })

  it('adds, re-prices and removes until the catalog matches the packages', async () => {
    // Today: $8 and $12 4-packs (the $12 hand-edited to $45), no $10 or $14.
    listing(
      stripeProduct('spotless_pack_8', { id: 'prod_8', cents: 3200 }),
      stripeProduct('spotless_pack_12', { id: 'prod_12', cents: 4500 }),
    )
    getPricingSnapshot.mockResolvedValue({
      ...SNAPSHOT,
      catalog: [catalogEntry('pack', '8', 3200), catalogEntry('pack', '12', 4500)],
    })
    productsCreate.mockImplementation(async (p: { metadata: { lookup_key: string } }) => ({
      id: `prod_${p.metadata.lookup_key}`,
    }))

    const result = await syncCatalogToWashPackages('will@example.com')

    expect(result.ok).toBe(true)
    // $10 and $14 4-packs created at 4 × wash price.
    const created = productsCreate.mock.calls.map((c) => c[0].metadata.lookup_key)
    expect(created).toEqual(['spotless_pack_10', 'spotless_pack_14'])
    expect(pricesCreate).toHaveBeenCalledWith(expect.objectContaining({ unit_amount: 4000 }))
    expect(pricesCreate).toHaveBeenCalledWith(expect.objectContaining({ unit_amount: 5600 }))
    // $12 back to 4 × $12.
    expect(pricesCreate).toHaveBeenCalledWith(
      expect.objectContaining({ product: 'prod_12', unit_amount: 4800 }),
    )
    // $8 archived — there is no $8 wash.
    expect(productsUpdate).toHaveBeenCalledWith(
      'prod_8',
      expect.objectContaining({ active: false }),
    )
    expect(inserts).toContainEqual({
      table: 'pricing_audit_log',
      payload: expect.objectContaining({ action: 'catalog.sync', succeeded: true }),
    })
  })

  it('does nothing when already in line', async () => {
    listing()
    getPricingSnapshot.mockResolvedValue({
      ...SNAPSHOT,
      catalog: LIVE_TIERS.map((t) => catalogEntry('pack', t.washValue, t.priceCents * 4)),
    })
    const result = await syncCatalogToWashPackages(null)
    expect(result.ok).toBe(true)
    expect(result.message).toMatch(/nothing to change/)
    expect(pricesCreate).not.toHaveBeenCalled()
    expect(productsUpdate).not.toHaveBeenCalled()
  })

  it('refuses to act on the built-in lineup when the CMS is down', async () => {
    washLineup.value = { source: 'fallback', tiers: LIVE_TIERS, packages: [] }
    const result = await syncCatalogToWashPackages(null)
    expect(result.ok).toBe(false)
    expect(productsUpdate).not.toHaveBeenCalled()
    expect(productsCreate).not.toHaveBeenCalled()
  })

  it('refuses to act when Stripe cannot be listed', async () => {
    productsList.mockRejectedValue(new Error('down'))
    const result = await syncCatalogToWashPackages(null)
    expect(result.ok).toBe(false)
    expect(result.message).toMatch(/Stripe could not be reached/)
  })
})

// =========================================================================
// Code-review regressions
// =========================================================================

describe('sync after a wash price change (review #1)', () => {
  const ultimateAt13 = [
    { name: 'Deluxe', washValue: '10', priceCents: 1000 },
    { name: 'Ultimate', washValue: '13', priceCents: 1300 },
  ]

  it('creates the new value even while the cached lineup still has the old one', async () => {
    // Publish moved Ultimate $12 → $13. The 60s cache still says $12.
    washLineup.value = { source: 'cms', tiers: ultimateAt13, packages: [] }
    washLineup.cached = { source: 'cms', tiers: LIVE_TIERS, packages: [] }
    listing(
      stripeProduct('spotless_pack_10', { id: 'prod_10', cents: 4000 }),
      stripeProduct('spotless_pack_12', { id: 'prod_12', cents: 4800 }),
    )
    getPricingSnapshot.mockResolvedValue({
      ...SNAPSHOT,
      catalog: [catalogEntry('pack', '10', 4000), catalogEntry('pack', '12', 4800)],
    })
    productsCreate.mockResolvedValue({ id: 'prod_13' })

    const result = await syncCatalogToWashPackages('sanity-webhook')

    expect(result.ok).toBe(true)
    expect(productsCreate.mock.calls[0][0].metadata.lookup_key).toBe('spotless_pack_13')
    expect(productsUpdate).toHaveBeenCalledWith('prod_12', expect.objectContaining({ active: false }))
  })

  it('holds back removals if any addition failed, so a wash is never left unsold', async () => {
    washLineup.value = { source: 'cms', tiers: ultimateAt13, packages: [] }
    listing(
      stripeProduct('spotless_pack_10', { id: 'prod_10', cents: 4000 }),
      stripeProduct('spotless_pack_12', { id: 'prod_12', cents: 4800 }),
    )
    getPricingSnapshot.mockResolvedValue({
      ...SNAPSHOT,
      catalog: [catalogEntry('pack', '10', 4000), catalogEntry('pack', '12', 4800)],
    })
    productsCreate.mockRejectedValue(new StripeError('rate limited'))

    const result = await syncCatalogToWashPackages(null)

    expect(result.ok).toBe(false)
    expect(result.message).toMatch(/Held back 1 removal/)
    // The $12 pack is still on sale.
    expect(productsUpdate).not.toHaveBeenCalledWith('prod_12', expect.objectContaining({ active: false }))
  })

  it('lists the Stripe catalog once for the whole run, not once per change', async () => {
    washLineup.value = { source: 'cms', tiers: LIVE_TIERS, packages: [] }
    listing(stripeProduct('spotless_pack_8', { id: 'prod_8', cents: 3200 }))
    getPricingSnapshot.mockResolvedValue({ ...SNAPSHOT, catalog: [catalogEntry('pack', '8', 3200)] })
    productsCreate.mockImplementation(async (p: { metadata: { lookup_key: string } }) => ({
      id: `prod_${p.metadata.lookup_key}`,
    }))

    await syncCatalogToWashPackages(null)

    // 3 creates + 1 remove, one listing.
    expect(productsList).toHaveBeenCalledTimes(1)
  })
})

describe('removing a custom pack size (review #2)', () => {
  it('leaves the 4-pack’s price history alone', async () => {
    listing(stripeProduct('spotless_pack_12_x10', { id: 'prod_x10' }))
    await deleteCatalogSku('spotless_pack_12_x10', null)
    expect(updates.filter((u) => u.table === 'catalog_prices')).toEqual([])
  })
})

describe('Stripe listing down (review #6)', () => {
  it('refuses to re-price rather than act on the deploy-config Price', async () => {
    productsList.mockRejectedValue(new Error('down'))
    const result = await updateCatalogPrice({ sku: 'spotless_pack_12', unitAmountCents: 4500, actorEmail: null })
    expect(result.ok).toBe(false)
    expect(result.message).toMatch(/could not be reached/)
    expect(pricesCreate).not.toHaveBeenCalled()
  })

  it('refuses to remove', async () => {
    productsList.mockRejectedValue(new Error('down'))
    const result = await deleteCatalogSku('spotless_pack_12', null)
    expect(result.ok).toBe(false)
    expect(productsUpdate).not.toHaveBeenCalled()
  })
})
