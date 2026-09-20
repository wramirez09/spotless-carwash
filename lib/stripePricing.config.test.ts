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
  const entry = (id: string) => ({ stripePriceId: id, cents: null, source: 'env' })
  return {
    prices: {
      pack: {
        '8': entry('p8'), '9': entry('p9'), '10': entry('p10'), '12': entry('p12'),
      },
      single: {
        '8': entry('s8'), '9': entry('s9'), '10': entry('s10'), '12': entry('s12'),
      },
    },
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

  it('exposes a price id for every denomination in both modes', async () => {
    const config = await resolveCheckoutConfig(NOW)
    for (const v of ['8', '9', '10', '12'] as const) {
      expect(config.packPriceIds[v]).toBeTruthy()
      expect(config.singlePriceIds[v]).toBeTruthy()
    }
  })

  it('falls back to the env price id when a SKU has none', async () => {
    const snap = snapshot()
    snap.prices.pack['12'] = { stripePriceId: '', cents: null, source: 'env' }
    getPricingSnapshot.mockResolvedValue(snap)
    expect((await resolveCheckoutConfig(NOW)).packPriceIds['12']).toBe('env_pack_12')
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
    const twelve = pricing.packs.find((p) => p.id === '12')!
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
    expect(pricing.packs.find((p) => p.featured)?.id).toBe('12')
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
