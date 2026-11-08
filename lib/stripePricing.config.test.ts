// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

// resolveCheckoutConfig is the seam that removed the deploy: it decides which
// Price IDs and which coupon a checkout uses. The fallback path below is what
// runs when Stripe itself is unreachable — it must still quote a sane price
// rather than showing £0 or crashing the pack cards.

const { getPricingSnapshot, secret, pricesRetrieve, couponsRetrieve } = vi.hoisted(() => ({
  getPricingSnapshot: vi.fn(),
  secret: vi.fn<() => string | undefined>(() => undefined),
  pricesRetrieve: vi.fn(),
  couponsRetrieve: vi.fn(),
}))

vi.mock('./pricingStore', () => ({ getPricingSnapshot }))
// The wash packages decide which token values are sold and what an unknown
// amount is estimated at. Default: a lineup covering this file's $8–$12
// fixture catalog, so the tests below are about pricing, not filtering.
const FIXTURE_TIERS = ['8', '9', '10', '12'].map((v) => ({
  name: v + ' wash',
  washValue: v,
  priceCents: Number(v) * 100,
}))
const washLineup = vi.hoisted(() => ({
  value: { source: 'fallback', tiers: [] as { name: string; washValue: string; priceCents: number }[], packages: [] },
}))
vi.mock('./washPackages', () => ({ getWashLineup: async () => washLineup.value }))
vi.mock('./stripeEnv', () => ({
  getStripeSecretKey: () => secret(),
  getPackPriceId: (v: string) => `env_pack_${v}`,
  getSinglePriceId: (v: string) => `env_single_${v}`,
  getPackDiscountCouponId: () => 'env_coupon_base',
  getSeasonalCouponId: () => 'env_coupon_sale',
}))
vi.mock('stripe', () => ({
  default: class FakeStripe {
    prices = { retrieve: pricesRetrieve }
    coupons = { retrieve: couponsRetrieve }
  },
}))

import { getCheckoutPricing, resolveCheckoutConfig } from './stripePricing'

const NOW = Date.UTC(2026, 7, 25, 12)
const HOUR = 3_600_000

function snapshot(overrides: Record<string, unknown> = {}) {
  const entry = (kind: 'pack' | 'single', v: string, id: string) => ({
    sku: `spotless_${kind}_${v}`,
    kind,
    washValue: v,
    tokens: kind === 'pack' ? 4 : 1,
    stripePriceId: id,
    stripeProductId: null,
    cents: null,
    featured: kind === 'pack' && v === '12',
    sortOrder: 100,
    source: 'env',
  })
  return {
    catalog: [
      entry('pack', '8', 'p8'), entry('pack', '9', 'p9'),
      entry('pack', '10', 'p10'), entry('pack', '12', 'p12'),
      entry('single', '8', 's8'), entry('single', '9', 's9'),
      entry('single', '10', 's10'), entry('single', '12', 's12'),
    ],
    sales: [],
    settings: { baseDiscountCents: 500, baseCouponId: 'coupon_base' },
    source: 'db',
    ...overrides,
  }
}

function sale(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sale-1',
    slug: 'labor-day-2026',
    label: 'Labor Day',
    badge: 'LABOR DAY',
    emoji: '🛠️',
    endLabel: null,
    startMs: NOW - HOUR,
    endMs: NOW + HOUR,
    extraDiscountCents: 500,
    stripeCouponId: 'coupon_sale',
    stripeAmountOffCents: 1000,
    status: 'scheduled',
    ...overrides,
  }
}

beforeEach(() => {
  washLineup.value = { source: 'cms', tiers: FIXTURE_TIERS, packages: [] }
  vi.clearAllMocks()
  secret.mockReturnValue(undefined)
  getPricingSnapshot.mockResolvedValue(snapshot())
})

describe('resolveCheckoutConfig', () => {
  it('uses the base coupon outside a sale window', async () => {
    const config = await resolveCheckoutConfig(NOW)
    expect(config.packCouponId).toBe('coupon_base')
    expect(config.sale).toBeNull()
    expect(config.baseDiscountCents).toBe(500)
  })

  it('uses the sale coupon inside the window', async () => {
    getPricingSnapshot.mockResolvedValue(snapshot({ sales: [sale()] }))
    const config = await resolveCheckoutConfig(NOW)
    expect(config.packCouponId).toBe('coupon_sale')
    expect(config.sale?.id).toBe('labor-day-2026')
  })

  it('degrades to the base coupon for a sale that was never provisioned', async () => {
    // A row with no Stripe coupon must not fail checkout — the customer still
    // gets the everyday bundle discount.
    getPricingSnapshot.mockResolvedValue(
      snapshot({ sales: [sale({ stripeCouponId: null })] }),
    )
    const config = await resolveCheckoutConfig(NOW)
    expect(config.packCouponId).toBe('coupon_base')
  })

  it('falls back to the env coupon when settings carry none', async () => {
    getPricingSnapshot.mockResolvedValue(
      snapshot({ settings: { baseDiscountCents: 500, baseCouponId: null } }),
    )
    expect((await resolveCheckoutConfig(NOW)).packCouponId).toBe('env_coupon_base')
  })

  it('exposes every SKU in the catalog with its price id', async () => {
    const config = await resolveCheckoutConfig(NOW)
    expect(config.catalog.map((s) => s.sku)).toContain('spotless_pack_12')
    expect(config.catalog.map((s) => s.sku)).toContain('spotless_single_8')
    for (const s of config.catalog) expect(s.stripePriceId).toBeTruthy()
  })

  it('leaves out a SKU with no Stripe price — checkout could not charge it', async () => {
    const snap = snapshot()
    snap.catalog[3] = { ...snap.catalog[3], stripePriceId: '' }
    getPricingSnapshot.mockResolvedValue(snap)
    const skus = (await resolveCheckoutConfig(NOW)).catalog.map((s) => s.sku)
    expect(skus).not.toContain('spotless_pack_12')
  })

  it('builds the pack_discount metadata from the combined amount', async () => {
    // Reporting reads this value, so the shape is load-bearing.
    getPricingSnapshot.mockResolvedValue(snapshot({ sales: [sale()] }))
    const config = await resolveCheckoutConfig(NOW)
    expect(config.sale?.discountMetadata).toBe('10_off_labor_day_2026')
  })

  it('reflects a changed base discount in the metadata', async () => {
    getPricingSnapshot.mockResolvedValue(
      snapshot({
        sales: [sale()],
        settings: { baseDiscountCents: 1000, baseCouponId: 'coupon_base' },
      }),
    )
    expect((await resolveCheckoutConfig(NOW)).sale?.discountMetadata).toBe(
      '15_off_labor_day_2026',
    )
  })
})

describe('getCheckoutPricing with Stripe unavailable', () => {
  it('still quotes list prices and the bundle saving', async () => {
    const pricing = await getCheckoutPricing(NOW)
    const twelve = pricing.packs.find((p) => p.washValue === '12')!
    expect(twelve.price).toBe(4800)
    expect(twelve.save).toBe(500)
    expect(pricing.activeSale).toBeNull()
  })

  it('adds the sale discount on top during a window', async () => {
    getPricingSnapshot.mockResolvedValue(snapshot({ sales: [sale()] }))
    const pricing = await getCheckoutPricing(NOW)
    expect(pricing.packCouponAmountOff).toBe(1000)
    expect(pricing.activeSale?.label).toBe('Labor Day')
  })

  it('splits the saving into a bundle chip and a sale chip', async () => {
    getPricingSnapshot.mockResolvedValue(snapshot({ sales: [sale()] }))
    const pricing = await getCheckoutPricing(NOW)
    const chips = pricing.packs[0].coupons
    expect(chips).toHaveLength(2)
    expect(chips.reduce((n, c) => n + c.amountOffCents, 0)).toBe(pricing.packs[0].save)
  })

  it('shows one chip outside a sale', async () => {
    const pricing = await getCheckoutPricing(NOW)
    expect(pricing.packs[0].coupons).toHaveLength(1)
    expect(pricing.packs[0].coupons[0].label).toBe('4-Pack bundle')
  })

  it('never lets a discount exceed the pack price', async () => {
    getPricingSnapshot.mockResolvedValue(
      snapshot({
        sales: [sale({ extraDiscountCents: 999_999 })],
        settings: { baseDiscountCents: 500, baseCouponId: 'coupon_base' },
      }),
    )
    const pricing = await getCheckoutPricing(NOW)
    for (const pack of pricing.packs) {
      expect(pack.save).toBeLessThanOrEqual(pack.price)
    }
  })

  it('quotes every single-token denomination', async () => {
    const pricing = await getCheckoutPricing(NOW)
    expect(pricing.singles.map((s) => s.price)).toEqual([800, 900, 1000, 1200])
  })

  it('marks the $12 pack as featured', async () => {
    const pricing = await getCheckoutPricing(NOW)
    expect(pricing.packs.find((p) => p.featured)?.id).toBe('spotless_pack_12')
  })

  it('advertises an admin-created pack size with its own per-token price', async () => {
    getPricingSnapshot.mockResolvedValue(
      snapshot({
        catalog: [
          {
            sku: 'spotless_pack_12_x10',
            kind: 'pack',
            washValue: '12',
            tokens: 10,
            stripePriceId: 'price_x10',
            stripeProductId: 'prod_x10',
            cents: 10000,
            featured: false,
            sortOrder: 100,
            source: 'stripe',
          },
        ],
      }),
    )
    const pricing = await getCheckoutPricing(NOW)
    expect(pricing.packs).toEqual([
      expect.objectContaining({
        id: 'spotless_pack_12_x10',
        tokens: 10,
        price: 10000,
        perToken: 1000,
        label: '$12 wash · 10-pack',
        save: 500,
      }),
    ])
    // The discount chip names the pack it is on, not a 4-pack.
    expect(pricing.packs[0].coupons.map((c) => c.label)).toEqual(['10-Pack bundle'])
    expect(pricing.singles).toEqual([])
  })

  it('stays empty when everything was removed, rather than reviving defaults', async () => {
    getPricingSnapshot.mockResolvedValue(snapshot({ catalog: [] }))
    const pricing = await getCheckoutPricing(NOW)
    expect(pricing.packs).toEqual([])
    expect(pricing.singles).toEqual([])
  })

  it('lists nothing an admin removed', async () => {
    const snap = snapshot()
    snap.catalog = snap.catalog.filter((s) => s.kind === 'pack')
    getPricingSnapshot.mockResolvedValue(snap)
    expect((await getCheckoutPricing(NOW)).singles).toEqual([])
  })

  it('falls back when a Stripe price lookup throws', async () => {
    // Configured but unreachable — the cards must still render.
    secret.mockReturnValue('sk_test')
    vi.resetModules()
    // Reject only the first lookup: Promise.all rejects either way, and the
    // remaining calls resolving keeps the run free of stray rejections that
    // vitest would report as unhandled.
    let call = 0
    pricesRetrieve.mockImplementation(async () => {
      if (call++ === 0) throw new Error('stripe down')
      return { unit_amount: 4800 }
    })
    couponsRetrieve.mockResolvedValue({ amount_off: 500, currency: 'usd' })
    const fresh = await import('./stripePricing')

    const pricing = await fresh.getCheckoutPricing(NOW)
    expect(pricing.packs).toHaveLength(4)
    expect(pricing.packs[0].price).toBeGreaterThan(0)
  })
})

describe('wash packages decide which tokens are sold', () => {
  const LIVE = [
    { name: 'Deluxe', washValue: '10', priceCents: 1000 },
    { name: 'Ultimate', washValue: '12', priceCents: 1200 },
    { name: 'Lustre', washValue: '14', priceCents: 1400 },
  ]

  it('offers only token values that are a wash package', async () => {
    washLineup.value = { source: 'cms', tiers: LIVE, packages: [] }
    const config = await resolveCheckoutConfig(NOW)
    expect([...new Set(config.catalog.map((s) => s.washValue))].sort()).toEqual(['10', '12'])
    expect(config.tiers).toEqual(LIVE)
  })

  it('so checkout refuses a $8 or $9 token once those washes are gone', async () => {
    washLineup.value = { source: 'cms', tiers: LIVE, packages: [] }
    const skus = (await resolveCheckoutConfig(NOW)).catalog.map((s) => s.sku)
    expect(skus).not.toContain('spotless_pack_8')
    expect(skus).not.toContain('spotless_single_9')
  })

  it('holds to the built-in lineup ($10/$12/$14) while the CMS is unreachable', async () => {
    washLineup.value = { source: 'fallback', tiers: LIVE, packages: [] }
    const values = [...new Set((await resolveCheckoutConfig(NOW)).catalog.map((s) => s.washValue))]
    expect(values.sort()).toEqual(['10', '12'])
  })

  it('quotes a token whose amount is unknown from its wash price', async () => {
    // Stripe unreachable + a SKU with no stored amount: tokens × wash price is
    // the best estimate, not the old hardcoded table.
    washLineup.value = { source: 'cms', tiers: [{ name: 'Lustre', washValue: '14', priceCents: 1400 }], packages: [] }
    getPricingSnapshot.mockResolvedValue(
      snapshot({
        catalog: [
          { ...snapshot().catalog[0], sku: 'spotless_pack_14', washValue: '14', stripePriceId: 'p14' },
        ],
      }),
    )
    const pricing = await getCheckoutPricing(NOW)
    expect(pricing.packs[0]).toMatchObject({ washValue: '14', price: 5600 })
    expect(pricing.tiers).toEqual([{ name: 'Lustre', washValue: '14', priceCents: 1400 }])
  })
})
