import { describe, expect, it } from 'vitest'
import {
  FATHERS_DAY_SALE_END_MS,
  FATHERS_DAY_SALE_START_MS,
} from './salesSchedule'
import {
  FATHERS_DAY_COUPON_ID,
  PACK_DISCOUNT_COUPON_ID,
  activePackCouponId,
} from './stripePricing'

describe('activePackCouponId', () => {
  it('returns the always-on pack discount BEFORE the sale window', () => {
    const beforeStart = FATHERS_DAY_SALE_START_MS - 1
    expect(activePackCouponId(beforeStart)).toBe(PACK_DISCOUNT_COUPON_ID)
  })

  it('returns the Father\'s Day coupon AT the start of the sale window', () => {
    expect(activePackCouponId(FATHERS_DAY_SALE_START_MS)).toBe(FATHERS_DAY_COUPON_ID)
  })

  it('returns the Father\'s Day coupon mid-window', () => {
    const midWindow = Date.UTC(2026, 5, 14, 17, 0, 0)
    expect(activePackCouponId(midWindow)).toBe(FATHERS_DAY_COUPON_ID)
  })

  it('returns the Father\'s Day coupon AT the end of the sale window', () => {
    expect(activePackCouponId(FATHERS_DAY_SALE_END_MS)).toBe(FATHERS_DAY_COUPON_ID)
  })

  it('returns the always-on pack discount AFTER the sale window', () => {
    const afterEnd = FATHERS_DAY_SALE_END_MS + 1
    expect(activePackCouponId(afterEnd)).toBe(PACK_DISCOUNT_COUPON_ID)
  })

  it('returns a string (not undefined / null) at all tested moments', () => {
    for (const t of [
      FATHERS_DAY_SALE_START_MS - 1,
      FATHERS_DAY_SALE_START_MS,
      FATHERS_DAY_SALE_END_MS,
      FATHERS_DAY_SALE_END_MS + 1,
    ]) {
      expect(typeof activePackCouponId(t)).toBe('string')
      expect(activePackCouponId(t).length).toBeGreaterThan(0)
    }
  })

  it('returns DIFFERENT coupon IDs inside vs outside the window', () => {
    // Sanity check that the two coupons are not accidentally equal in test env.
    expect(FATHERS_DAY_COUPON_ID).not.toBe(PACK_DISCOUNT_COUPON_ID)
  })
})
