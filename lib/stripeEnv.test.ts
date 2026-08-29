// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// A present-but-empty env var used to defeat every `?? fallback` downstream:
// '' is not nullish, so it flowed straight through as a Stripe price or coupon
// id. That broke checkout (empty coupon id) and collided as a React key on the
// pack cards. pickEnv now treats blank as unset.

describe('stripeEnv — blank values are treated as unset', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
    vi.stubEnv('VERCEL_ENV', 'development')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns undefined for an empty coupon id so the caller can fall back', async () => {
    vi.stubEnv('DEV_STRIPE_COUPON_PACK_DISCOUNT', '')
    const { getPackDiscountCouponId } = await import('./stripeEnv')
    expect(getPackDiscountCouponId()).toBeUndefined()
  })

  it('returns undefined for a whitespace-only value', async () => {
    vi.stubEnv('DEV_STRIPE_COUPON_PACK_DISCOUNT', '   ')
    const { getPackDiscountCouponId } = await import('./stripeEnv')
    expect(getPackDiscountCouponId()).toBeUndefined()
  })

  it('trims a real value rather than passing stray whitespace to Stripe', async () => {
    vi.stubEnv('DEV_STRIPE_COUPON_PACK_DISCOUNT', '  coupon_abc  ')
    const { getPackDiscountCouponId } = await import('./stripeEnv')
    expect(getPackDiscountCouponId()).toBe('coupon_abc')
  })

  it('applies the same rule to seasonal coupons and price ids', async () => {
    vi.stubEnv('DEV_STRIPE_COUPON_LABOR_DAY_2026', '')
    vi.stubEnv('DEV_STRIPE_PRICE_PACK_12', '')
    vi.stubEnv('DEV_STRIPE_PRICE_SUB_WEEKLY_12', '')
    const mod = await import('./stripeEnv')
    expect(mod.getSeasonalCouponId('LABOR_DAY_2026')).toBeUndefined()
    expect(mod.getPackPriceId('12')).toBeUndefined()
    expect(mod.getSubscriptionPriceId('WEEKLY', '12')).toBeUndefined()
  })

  it('still throws on Vercel Production when a required id is blank', async () => {
    // Blank must not read as "configured" in production — the throw is what
    // stops a sandbox fallback reaching real customers.
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('PROD_STRIPE_PRICE_SUB_WEEKLY_12', '')
    const { getSubscriptionPriceId } = await import('./stripeEnv')
    expect(() => getSubscriptionPriceId('WEEKLY', '12')).toThrow(/required on Vercel Production/)
  })

  it('leaves secrets soft — unset returns undefined, not a throw', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('PROD_STRIPE_SECRET_KEY', '')
    const { getStripeSecretKey } = await import('./stripeEnv')
    expect(getStripeSecretKey()).toBeUndefined()
  })
})
