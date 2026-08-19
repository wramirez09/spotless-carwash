import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  FATHERS_DAY_SALE_END_MS,
  FATHERS_DAY_SALE_START_MS,
  LABOR_DAY_SALE_END_MS,
  LABOR_DAY_SALE_START_MS,
  getActiveSeasonalSale,
} from './salesSchedule'
import {
  PACK_DISCOUNT_COUPON_ID,
  activePackCouponId,
  seasonalCouponId,
} from './stripePricing'

const FATHERS_DAY_SALE = getActiveSeasonalSale(FATHERS_DAY_SALE_START_MS)!
const LABOR_DAY_SALE = getActiveSeasonalSale(LABOR_DAY_SALE_START_MS)!

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('activePackCouponId', () => {
  it('returns the always-on pack discount BEFORE the sale window', () => {
    expect(activePackCouponId(FATHERS_DAY_SALE_START_MS - 1)).toBe(
      PACK_DISCOUNT_COUPON_ID,
    )
  })

  it('returns the Father\'s Day coupon AT the start of the sale window', () => {
    expect(activePackCouponId(FATHERS_DAY_SALE_START_MS)).toBe(
      seasonalCouponId(FATHERS_DAY_SALE),
    )
  })

  it('returns the Father\'s Day coupon mid-window', () => {
    const midWindow = Date.UTC(2026, 5, 14, 17, 0, 0)
    expect(activePackCouponId(midWindow)).toBe(seasonalCouponId(FATHERS_DAY_SALE))
  })

  it('returns the Father\'s Day coupon AT the end of the sale window', () => {
    expect(activePackCouponId(FATHERS_DAY_SALE_END_MS)).toBe(
      seasonalCouponId(FATHERS_DAY_SALE),
    )
  })

  it('returns the always-on pack discount BETWEEN the two sale windows', () => {
    expect(activePackCouponId(FATHERS_DAY_SALE_END_MS + 1)).toBe(
      PACK_DISCOUNT_COUPON_ID,
    )
    expect(activePackCouponId(LABOR_DAY_SALE_START_MS - 1)).toBe(
      PACK_DISCOUNT_COUPON_ID,
    )
  })

  it('returns the Labor Day coupon throughout its window', () => {
    vi.stubEnv('DEV_STRIPE_COUPON_LABOR_DAY_2026', 'coupon_labor_day')
    for (const t of [
      LABOR_DAY_SALE_START_MS,
      Date.UTC(2026, 7, 31, 17, 0, 0),
      LABOR_DAY_SALE_END_MS,
    ]) {
      expect(activePackCouponId(t)).toBe('coupon_labor_day')
    }
  })

  it('returns the always-on pack discount AFTER the Labor Day window', () => {
    vi.stubEnv('DEV_STRIPE_COUPON_LABOR_DAY_2026', 'coupon_labor_day')
    expect(activePackCouponId(LABOR_DAY_SALE_END_MS + 1)).toBe(PACK_DISCOUNT_COUPON_ID)
  })

  it('returns a non-empty string at every window boundary', () => {
    for (const t of [
      FATHERS_DAY_SALE_START_MS - 1,
      FATHERS_DAY_SALE_START_MS,
      FATHERS_DAY_SALE_END_MS,
      FATHERS_DAY_SALE_END_MS + 1,
      LABOR_DAY_SALE_START_MS - 1,
      LABOR_DAY_SALE_START_MS,
      LABOR_DAY_SALE_END_MS,
      LABOR_DAY_SALE_END_MS + 1,
    ]) {
      expect(typeof activePackCouponId(t)).toBe('string')
      expect(activePackCouponId(t).length).toBeGreaterThan(0)
    }
  })
})

describe('seasonalCouponId', () => {
  it('prefers the DEV_ env var for the sale', () => {
    vi.stubEnv('DEV_STRIPE_COUPON_LABOR_DAY_2026', 'coupon_from_env')
    expect(seasonalCouponId(LABOR_DAY_SALE)).toBe('coupon_from_env')
  })

  it('uses the hardcoded sandbox fallback when the env var is unset', () => {
    // Father's Day has a sandbox fallback baked in, so it must not degrade to
    // the always-on coupon just because DEV_* is missing locally.
    expect(seasonalCouponId(FATHERS_DAY_SALE)).not.toBe(PACK_DISCOUNT_COUPON_ID)
  })

  it('degrades to the always-on pack coupon when nothing is configured', () => {
    // No env var and no sandbox fallback for Labor Day — checkout must still
    // work at $5 off rather than failing outright.
    expect(seasonalCouponId(LABOR_DAY_SALE)).toBe(PACK_DISCOUNT_COUPON_ID)
  })
})
