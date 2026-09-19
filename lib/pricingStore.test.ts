// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The READ layer. Its job is to be correct when the database answers and
// HARMLESS when it doesn't: an unconfigured, unreachable or paused Supabase
// must degrade to the env-var + hardcoded config the site ran on before
// /admin/pricing existed, never take checkout down.

const { getSupabaseAdmin, envs } = vi.hoisted(() => ({
  getSupabaseAdmin: vi.fn(),
  envs: {
    pack: (v: string) => `env_price_pack_${v}`,
    single: (v: string) => `env_price_single_${v}`,
    packCoupon: (): string | undefined => 'env_coupon_base',
    seasonal: (s: string): string | undefined => `env_coupon_${s.toLowerCase()}`,
  },
}))

vi.mock('./supabase', () => ({ getSupabaseAdmin }))
vi.mock('./stripeEnv', () => ({
  getPackPriceId: (v: string) => envs.pack(v),
  getSinglePriceId: (v: string) => envs.single(v),
  getPackDiscountCouponId: () => envs.packCoupon(),
  getSeasonalCouponId: (s: string) => envs.seasonal(s),
}))

import {
  getPricingSnapshot,
  invalidatePricingCache,
  listAllSales,
  listCatalogPrices,
  resolveActiveSale,
} from './pricingStore'
import { LABOR_DAY_SALE_START_MS } from './salesSchedule'

const HOUR = 3_600_000
const NOW = Date.UTC(2026, 7, 25, 12, 0, 0)

function saleRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sale-1',
    slug: 'summer-2026',
    label: 'Summer',
    badge: 'SUMMER',
    emoji: '☀️',
    end_label: null,
    starts_at: new Date(NOW - HOUR).toISOString(),
    ends_at: new Date(NOW + HOUR).toISOString(),
    extra_discount_cents: 700,
    stripe_coupon_id: 'coupon_summer',
    stripe_amount_off_cents: 1200,
    status: 'scheduled',
    ...overrides,
  }
}

function priceRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    kind: 'pack',
    wash_value: '12',
    unit_amount_cents: 4500,
    stripe_price_id: 'price_db_pack_12',
    stripe_product_id: 'prod_12',
    active: true,
    created_at: new Date(NOW).toISOString(),
    created_by: 'will@example.com',
    ...overrides,
  }
}

/** Fake matching the exact call shapes loadSnapshot uses. */
function makeSupabase({
  prices = [] as unknown[],
  sales = [] as unknown[],
  settings = { base_discount_cents: 500, base_coupon_id: 'db_coupon_base' } as unknown,
  error = null as unknown,
} = {}) {
  const calls = { count: 0 }
  const client = {
    calls,
    from(table: string) {
      calls.count += 1
      const builder: Record<string, unknown> = {}
      const chain = () => builder
      builder.select = chain
      builder.order = chain
      builder.eq = (_col: string, _val: unknown) => {
        if (table === 'pricing_settings') {
          return {
            maybeSingle: async () => ({ data: error ? null : settings, error }),
            ...builder,
          }
        }
        return builder
      }
      builder.maybeSingle = async () => ({ data: error ? null : settings, error })
      builder.then = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) => {
        const data = table === 'catalog_prices' ? prices : table === 'sales' ? sales : settings
        return Promise.resolve({ data: error ? null : data, error }).then(res, rej)
      }
      return builder
    },
  }
  return client
}

beforeEach(() => {
  vi.clearAllMocks()
  invalidatePricingCache()
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
  invalidatePricingCache()
})

describe('fallback when Supabase is unavailable', () => {
  beforeEach(() => getSupabaseAdmin.mockReturnValue(null))

  it('reports the fallback source rather than pretending to have data', async () => {
    // The admin page keys its "database isn't reachable" warning off this.
    const snap = await getPricingSnapshot()
    expect(snap.source).toBe('fallback')
  })

  it('serves the env-var Price IDs so checkout keeps working', async () => {
    const snap = await getPricingSnapshot()
    expect(snap.prices.pack['12'].stripePriceId).toBe('env_price_pack_12')
    expect(snap.prices.single['8'].stripePriceId).toBe('env_price_single_8')
  })

  it('keeps the legacy hardcoded sales running', async () => {
    // A database outage during a live sale must not silently drop the
    // discount customers were promised.
    const sale = await resolveActiveSale(LABOR_DAY_SALE_START_MS + HOUR)
    expect(sale?.slug).toBe('labor-day-2026')
    expect(sale?.stripeCouponId).toBe('env_coupon_labor_day_2026')
    expect(sale?.extraDiscountCents).toBe(500)
  })

  it('is NOT cached, so a recovered database is picked up immediately', async () => {
    // Caching the fallback would keep serving stale config for the rest of
    // the TTL even after Supabase came back.
    await getPricingSnapshot()
    getSupabaseAdmin.mockReturnValue(makeSupabase({ sales: [saleRow()] }))
    const second = await getPricingSnapshot()
    expect(second.source).toBe('db')
  })

  it('survives env getters that throw on production', async () => {
    // getPackDiscountCouponId throws when a PROD_ var is unset. A render
    // asking what the discount is worth must not blow up over it.
    envs.packCoupon = () => {
      throw new Error('PROD_STRIPE_COUPON_PACK_DISCOUNT is required')
    }
    const snap = await getPricingSnapshot()
    expect(snap.settings.baseCouponId).toBeNull()
    expect(snap.settings.baseDiscountCents).toBe(500)
    envs.packCoupon = () => 'env_coupon_base'
  })
})

describe('reading from the database', () => {
  it('maps rows into the domain shape', async () => {
    getSupabaseAdmin.mockReturnValue(
      makeSupabase({ prices: [priceRow()], sales: [saleRow()] }),
    )
    const snap = await getPricingSnapshot()

    expect(snap.source).toBe('db')
    expect(snap.prices.pack['12']).toEqual({
      stripePriceId: 'price_db_pack_12',
      cents: 4500,
    })
    expect(snap.settings).toEqual({
      baseDiscountCents: 500,
      baseCouponId: 'db_coupon_base',
    })
    expect(snap.sales[0]).toMatchObject({
      slug: 'summer-2026',
      extraDiscountCents: 700,
      startMs: NOW - HOUR,
      endMs: NOW + HOUR,
    })
  })

  it('falls back per-SKU for denominations with no row yet', async () => {
    // Adopting the table must not require backfilling all eight SKUs first.
    getSupabaseAdmin.mockReturnValue(makeSupabase({ prices: [priceRow()] }))
    const snap = await getPricingSnapshot()

    expect(snap.prices.pack['12'].stripePriceId).toBe('price_db_pack_12')
    expect(snap.prices.pack['8'].stripePriceId).toBe('env_price_pack_8')
    expect(snap.prices.pack['8'].cents).toBeNull()
  })

  it('resolves the live sale from the database', async () => {
    getSupabaseAdmin.mockReturnValue(makeSupabase({ sales: [saleRow()] }))
    const sale = await resolveActiveSale(NOW)
    expect(sale?.slug).toBe('summer-2026')
  })

  it('returns no sale outside the window', async () => {
    getSupabaseAdmin.mockReturnValue(makeSupabase({ sales: [saleRow()] }))
    expect(await resolveActiveSale(NOW + 5 * HOUR)).toBeNull()
  })

  it('degrades to the env fallback when the query errors', async () => {
    getSupabaseAdmin.mockReturnValue(makeSupabase({ error: { message: 'boom' } }))
    const snap = await getPricingSnapshot()
    expect(snap.source).toBe('fallback')
    expect(snap.prices.pack['12'].stripePriceId).toBe('env_price_pack_12')
  })
})

describe('caching', () => {
  it('serves a second read from cache instead of re-querying', async () => {
    // The banner renders in the root layout — an uncached read would add a
    // round-trip to every page.
    const client = makeSupabase({ sales: [saleRow()] })
    getSupabaseAdmin.mockReturnValue(client)

    await getPricingSnapshot()
    const after = client.calls.count
    await getPricingSnapshot()

    expect(client.calls.count).toBe(after)
  })

  it('re-reads after invalidation, so an admin write shows up at once', async () => {
    const client = makeSupabase({ sales: [saleRow()] })
    getSupabaseAdmin.mockReturnValue(client)

    await getPricingSnapshot()
    const after = client.calls.count
    invalidatePricingCache()
    await getPricingSnapshot()

    expect(client.calls.count).toBeGreaterThan(after)
  })

  it('expires so a sale window opens without an admin action', async () => {
    const client = makeSupabase({ sales: [saleRow()] })
    getSupabaseAdmin.mockReturnValue(client)

    await getPricingSnapshot()
    const after = client.calls.count
    vi.setSystemTime(NOW + 31_000)
    await getPricingSnapshot()

    expect(client.calls.count).toBeGreaterThan(after)
  })

  it('shares one in-flight read between concurrent callers', async () => {
    const client = makeSupabase({ sales: [saleRow()] })
    getSupabaseAdmin.mockReturnValue(client)

    const [a, b] = await Promise.all([getPricingSnapshot(), getPricingSnapshot()])

    expect(a).toBe(b)
  })
})

describe('admin listings', () => {
  it('lists every sale regardless of status', async () => {
    getSupabaseAdmin.mockReturnValue(
      makeSupabase({ sales: [saleRow(), saleRow({ id: 's2', status: 'draft' })] }),
    )
    const all = await listAllSales()
    expect(all).toHaveLength(2)
    expect(all.map((s) => s.status)).toContain('draft')
  })

  it('returns no catalog rows when the database is unavailable', async () => {
    // The admin page then shows the env-derived prices instead.
    getSupabaseAdmin.mockReturnValue(null)
    expect(await listCatalogPrices()).toEqual([])
  })
})
