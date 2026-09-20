// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Pins the CUSTOMER-FACING PRICES for the Labor Day sale end to end:
// Stripe list price + coupon amount -> what the pack card actually renders.
//
// This is the gap that let a $5 Labor Day coupon reach live Stripe. A
// mis-sized seasonal coupon fails silently — the banner still advertises the
// sale, chips still render, the window logic is still correct — the customer
// just pays the normal price. Boundary and coupon-selection tests all pass.
// The only thing that catches it is asserting the final dollar amounts.

const { pricesRetrieve, couponsRetrieve, getSeasonalCouponId } = vi.hoisted(() => ({
  pricesRetrieve: vi.fn(),
  couponsRetrieve: vi.fn(),
  getSeasonalCouponId: vi.fn<(suffix: string) => string | undefined>(
    () => 'coupon_labor_day',
  ),
}))

vi.mock('stripe', () => ({
  default: class FakeStripe {
    prices = { retrieve: pricesRetrieve }
    coupons = { retrieve: couponsRetrieve }
  },
}))

vi.mock('./stripeEnv', () => ({
  getStripeSecretKey: () => 'sk_test_fake',
  getPackPriceId: (v: string) => `price_pack_${v}`,
  getSinglePriceId: (v: string) => `price_single_${v}`,
  getPackDiscountCouponId: () => 'coupon_base',
  getSeasonalCouponId,
}))

import { getCheckoutPricing } from './stripePricing'
import { LABOR_DAY_SALE_END_MS, LABOR_DAY_SALE_START_MS } from './salesSchedule'

// Live Stripe list prices for the 4-packs, in cents.
const LIST = { '8': 3200, '9': 3600, '10': 4000, '12': 4800 } as const
const SINGLE = { '8': 800, '9': 900, '10': 1000, '12': 1200 } as const

// Joe's published Labor Day prices, in cents. $10 off every pack.
const SALE_PRICE = { '8': 2200, '9': 2600, '10': 3000, '12': 3800 } as const
// Everyday prices with only the always-on $5 pack coupon.
const NORMAL_PRICE = { '8': 2700, '9': 3100, '10': 3500, '12': 4300 } as const

const OUTSIDE_WINDOW = LABOR_DAY_SALE_START_MS - 1
const INSIDE_WINDOW = Date.UTC(2026, 7, 31, 17, 0, 0) // Mon Aug 31 noon Chicago

/** Amount the coupon takes off, keyed by coupon id. */
function stubCoupons({ labourDay = 1000, base = 500 } = {}) {
  couponsRetrieve.mockImplementation(async (id: string) => {
    if (id === 'coupon_labor_day') return { id, amount_off: labourDay, currency: 'usd' }
    if (id === 'coupon_base') return { id, amount_off: base, currency: 'usd' }
    throw new Error(`unexpected coupon ${id}`)
  })
}

beforeEach(() => {
  pricesRetrieve.mockImplementation(async (id: string) => {
    const packMatch = /^price_pack_(\d+)$/.exec(id)
    if (packMatch) return { unit_amount: LIST[packMatch[1] as keyof typeof LIST] }
    const singleMatch = /^price_single_(\d+)$/.exec(id)
    if (singleMatch) return { unit_amount: SINGLE[singleMatch[1] as keyof typeof SINGLE] }
    throw new Error(`unexpected price ${id}`)
  })
  stubCoupons()
})

afterEach(() => {
  vi.clearAllMocks()
})

/** Final price the pack card renders: list minus the discount applied. */
const finalCents = (pack: { price: number; save: number }) =>
  Math.max(0, pack.price - pack.save)

describe('Labor Day sale — customer-facing prices', () => {
  it('charges Joe\'s published sale prices inside the window', async () => {
    const pricing = await getCheckoutPricing(INSIDE_WINDOW)
    const actual = Object.fromEntries(
      pricing.packs.map((p) => [p.id, finalCents(p)]),
    )
    expect(actual).toEqual(SALE_PRICE)
  })

  it('charges the everyday prices outside the window', async () => {
    const pricing = await getCheckoutPricing(OUTSIDE_WINDOW)
    const actual = Object.fromEntries(
      pricing.packs.map((p) => [p.id, finalCents(p)]),
    )
    expect(actual).toEqual(NORMAL_PRICE)
  })

  it('takes exactly $10 off every pack during the sale', async () => {
    const pricing = await getCheckoutPricing(INSIDE_WINDOW)
    for (const pack of pricing.packs) {
      expect(pack.save).toBe(1000)
      expect(pack.price).toBe(LIST[pack.id])
    }
  })

  it('reports the sale as active with the right label and end date', async () => {
    const pricing = await getCheckoutPricing(INSIDE_WINDOW)
    expect(pricing.activeSale).toMatchObject({
      id: 'labor-day-2026',
      label: 'Labor Day',
      badge: 'LABOR DAY',
      endLabel: 'Mon, Sep 7',
    })
    expect(pricing.packCouponAmountOff).toBe(1000)
  })

  it('has no active sale outside the window', async () => {
    const pricing = await getCheckoutPricing(OUTSIDE_WINDOW)
    expect(pricing.activeSale).toBeNull()
    expect(pricing.packCouponAmountOff).toBe(500)
  })

  it('holds the sale price at the last second of the window', async () => {
    const pricing = await getCheckoutPricing(LABOR_DAY_SALE_END_MS)
    expect(finalCents(pricing.packs.find((p) => p.id === '12')!)).toBe(3800)
  })

  it('drops back to the everyday price one millisecond later', async () => {
    const pricing = await getCheckoutPricing(LABOR_DAY_SALE_END_MS + 1)
    expect(finalCents(pricing.packs.find((p) => p.id === '12')!)).toBe(4300)
  })

  it('leaves single-token prices untouched by the sale', async () => {
    const pricing = await getCheckoutPricing(INSIDE_WINDOW)
    const actual = Object.fromEntries(pricing.singles.map((s) => [s.id, s.price]))
    expect(actual).toEqual(SINGLE)
  })
})

describe('Labor Day sale — coupon chip breakdown', () => {
  it('splits the $10 into a $5 bundle chip and a $5 Labor Day chip', async () => {
    const pricing = await getCheckoutPricing(INSIDE_WINDOW)
    for (const pack of pricing.packs) {
      expect(pack.coupons.map((c) => [c.label, c.amountOffCents])).toEqual([
        ['4-Pack bundle', 500],
        ['Labor Day', 500],
      ])
    }
  })

  it('shows a single bundle chip outside the window', async () => {
    const pricing = await getCheckoutPricing(OUTSIDE_WINDOW)
    for (const pack of pricing.packs) {
      expect(pack.coupons.map((c) => [c.label, c.amountOffCents])).toEqual([
        ['4-Pack bundle', 500],
      ])
    }
  })

  it('keeps the chip amounts summing to the discount actually charged', async () => {
    for (const now of [INSIDE_WINDOW, OUTSIDE_WINDOW]) {
      const pricing = await getCheckoutPricing(now)
      for (const pack of pricing.packs) {
        const chipTotal = pack.coupons.reduce((n, c) => n + c.amountOffCents, 0)
        expect(chipTotal).toBe(pack.save)
      }
    }
  })
})

describe('Labor Day sale — misconfigured coupon regressions', () => {
  // The exact mistake that reached live Stripe: a $5 seasonal coupon, created
  // on the assumption that it stacks on top of the always-on $5. It does not —
  // Stripe allows one coupon per session, so the seasonal coupon REPLACES the
  // base one and has to carry the full $10.
  it('a $5 seasonal coupon does not produce the advertised sale price', async () => {
    stubCoupons({ labourDay: 500 })
    const pricing = await getCheckoutPricing(INSIDE_WINDOW)
    const twelve = pricing.packs.find((p) => p.id === '12')!
    expect(finalCents(twelve)).toBe(NORMAL_PRICE['12'])
    expect(finalCents(twelve)).not.toBe(SALE_PRICE['12'])
  })

  it('never renders a bundle chip that overstates a too-small sale coupon', async () => {
    // With only $5 of total discount there is no room for both chips; showing
    // "4-Pack bundle -$5" AND "Labor Day -$5" would claim $10 the customer
    // is not getting.
    stubCoupons({ labourDay: 500 })
    const pricing = await getCheckoutPricing(INSIDE_WINDOW)
    for (const pack of pricing.packs) {
      const chipTotal = pack.coupons.reduce((n, c) => n + c.amountOffCents, 0)
      expect(chipTotal).toBe(pack.save)
      expect(pack.coupons).toHaveLength(1)
      expect(pack.coupons[0].label).toBe('Labor Day')
    }
  })

  it('falls back to the everyday $5 when the seasonal coupon is unconfigured', async () => {
    // Env var missing -> seasonalCouponId degrades to the base pack coupon.
    // Checkout must keep working at $5 rather than erroring out.
    getSeasonalCouponId.mockReturnValue(undefined)
    const pricing = await getCheckoutPricing(INSIDE_WINDOW)
    const twelve = pricing.packs.find((p) => p.id === '12')!
    expect(finalCents(twelve)).toBe(NORMAL_PRICE['12'])
    expect(pricing.activeSale?.id).toBe('labor-day-2026')
  })

  it('never lets a pack price go negative on an oversized coupon', async () => {
    stubCoupons({ labourDay: 999_999 })
    const pricing = await getCheckoutPricing(INSIDE_WINDOW)
    for (const pack of pricing.packs) {
      expect(finalCents(pack)).toBeGreaterThanOrEqual(0)
      expect(pack.save).toBeLessThanOrEqual(pack.price)
    }
  })
})

// --- Coupon-chip identity -------------------------------------------------
// Regression guard for a duplicate-React-key crash on the pack cards
// (src/components/Tokens.tsx).
//
// The two-chip split is PRESENTATIONAL and intentional: Stripe allows one
// coupon per Checkout session, so each seasonal coupon is configured as the
// combined (base + sale) amount and the FE shows it as two chips. That means
// both chips legitimately describe one coupon — and when the seasonal coupon
// can't be resolved, both carry the same id. Chips must therefore stay
// distinguishable by LABEL, which is what the render sites key on.

describe('coupon chip identity during a sale', () => {
  it('keeps both chips when the seasonal coupon resolves distinctly', async () => {
    getSeasonalCouponId.mockReturnValue('coupon_labor_day')

    const { packs } = await getCheckoutPricing(INSIDE_WINDOW)

    expect(packs[0].coupons).toHaveLength(2)
    const ids = packs[0].coupons.map((c) => c.id)
    expect(new Set(ids).size).toBe(2)
  })

  it('still shows both chips when the seasonal coupon degrades to the base one', async () => {
    // The customer-facing split must not silently disappear just because the
    // sale's coupon env var is unset — the discount is still being applied.
    getSeasonalCouponId.mockReturnValue(undefined)
    stubCoupons({ base: 1000 })

    const { packs } = await getCheckoutPricing(INSIDE_WINDOW)

    expect(packs[0].coupons).toHaveLength(2)
    expect(packs[0].coupons.map((c) => c.label)).toEqual(['4-Pack bundle', 'Labor Day'])
  })

  it('gives every chip a unique id+label key, even when ids collide', async () => {
    // This is the exact invariant the render sites depend on. Duplicate keys
    // are what produced "Encountered two children with the same key".
    getSeasonalCouponId.mockReturnValue(undefined)
    stubCoupons({ base: 1000 })

    const { packs } = await getCheckoutPricing(INSIDE_WINDOW)

    for (const pack of packs) {
      const keys = pack.coupons.map((c) => `${c.id}-${c.label}`)
      expect(new Set(keys).size).toBe(keys.length)
    }
  })

  it('never double-counts: chip amounts sum to the discount actually applied', async () => {
    getSeasonalCouponId.mockReturnValue(undefined)
    stubCoupons({ base: 1000 })

    const { packs } = await getCheckoutPricing(INSIDE_WINDOW)

    for (const pack of packs) {
      const summed = pack.coupons.reduce((n, c) => n + c.amountOffCents, 0)
      expect(summed).toBe(pack.save)
    }
  })
})
