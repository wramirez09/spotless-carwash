import { describe, expect, it } from 'vitest'
import {
  FATHERS_DAY_SALE_END_MS,
  FATHERS_DAY_SALE_START_MS,
  LABOR_DAY_SALE_END_MS,
  LABOR_DAY_SALE_START_MS,
  SEASONAL_SALES,
  getActiveSeasonalSale,
  isFathersDaySaleActive,
  isLaborDaySaleActive,
  isSeasonalSaleActive,
} from './salesSchedule'

// All boundary timestamps are expressed in America/Chicago wall time and
// converted to UTC ms via Date.UTC (CDT = UTC-5 in June, August, September).

describe('FATHERS_DAY_SALE_START_MS', () => {
  it('represents 2026-06-07 00:00:00 America/Chicago (= 05:00:00 UTC, CDT)', () => {
    expect(FATHERS_DAY_SALE_START_MS).toBe(Date.UTC(2026, 5, 7, 5, 0, 0))
    expect(new Date(FATHERS_DAY_SALE_START_MS).toISOString()).toBe(
      '2026-06-07T05:00:00.000Z',
    )
  })
})

describe('FATHERS_DAY_SALE_END_MS', () => {
  it('represents 2026-06-21 23:59:59 America/Chicago (= 2026-06-22 04:59:59 UTC, CDT)', () => {
    expect(FATHERS_DAY_SALE_END_MS).toBe(Date.UTC(2026, 5, 22, 4, 59, 59))
    expect(new Date(FATHERS_DAY_SALE_END_MS).toISOString()).toBe(
      '2026-06-22T04:59:59.000Z',
    )
  })
})

describe('LABOR_DAY_SALE_START_MS', () => {
  it('represents 2026-08-19 00:00:00 America/Chicago (= 05:00:00 UTC, CDT)', () => {
    expect(LABOR_DAY_SALE_START_MS).toBe(Date.UTC(2026, 7, 19, 5, 0, 0))
    expect(new Date(LABOR_DAY_SALE_START_MS).toISOString()).toBe(
      '2026-08-19T05:00:00.000Z',
    )
  })
})

describe('LABOR_DAY_SALE_END_MS', () => {
  it('represents 2026-09-07 23:59:59 America/Chicago (= 2026-09-08 04:59:59 UTC, CDT)', () => {
    expect(LABOR_DAY_SALE_END_MS).toBe(Date.UTC(2026, 8, 8, 4, 59, 59))
    expect(new Date(LABOR_DAY_SALE_END_MS).toISOString()).toBe(
      '2026-09-08T04:59:59.000Z',
    )
  })
})

describe('isFathersDaySaleActive', () => {
  it('is INACTIVE one millisecond before the start', () => {
    expect(isFathersDaySaleActive(FATHERS_DAY_SALE_START_MS - 1)).toBe(false)
  })

  it('is ACTIVE at the exact start (2026-06-07 00:00:00 Chicago)', () => {
    expect(isFathersDaySaleActive(FATHERS_DAY_SALE_START_MS)).toBe(true)
  })

  it('is ACTIVE mid-window (2026-06-14 noon Chicago, Father\'s Day-1 week)', () => {
    const midWindow = Date.UTC(2026, 5, 14, 17, 0, 0) // 12:00 CDT
    expect(isFathersDaySaleActive(midWindow)).toBe(true)
  })

  it('is ACTIVE on Father\'s Day itself (2026-06-21 noon Chicago)', () => {
    const fathersDayNoon = Date.UTC(2026, 5, 21, 17, 0, 0) // 12:00 CDT
    expect(isFathersDaySaleActive(fathersDayNoon)).toBe(true)
  })

  it('is ACTIVE at the exact end (2026-06-21 23:59:59 Chicago)', () => {
    expect(isFathersDaySaleActive(FATHERS_DAY_SALE_END_MS)).toBe(true)
  })

  it('is INACTIVE one millisecond after the end', () => {
    expect(isFathersDaySaleActive(FATHERS_DAY_SALE_END_MS + 1)).toBe(false)
  })

  it('is INACTIVE well before the start (May 29 2026)', () => {
    const beforeStart = Date.UTC(2026, 4, 29, 12, 0, 0)
    expect(isFathersDaySaleActive(beforeStart)).toBe(false)
  })

  it('is INACTIVE well after the end (July 1, 2026)', () => {
    const afterEnd = Date.UTC(2026, 6, 1, 12, 0, 0)
    expect(isFathersDaySaleActive(afterEnd)).toBe(false)
  })

  it('is INACTIVE during the Labor Day window', () => {
    expect(isFathersDaySaleActive(LABOR_DAY_SALE_START_MS)).toBe(false)
  })

  it('is INACTIVE in 2025 (sale not yet announced)', () => {
    const lastYear = Date.UTC(2025, 5, 15, 12, 0, 0)
    expect(isFathersDaySaleActive(lastYear)).toBe(false)
  })

  it('is INACTIVE in 2027 (sale has long since ended)', () => {
    const nextYear = Date.UTC(2027, 5, 15, 12, 0, 0)
    expect(isFathersDaySaleActive(nextYear)).toBe(false)
  })

  it('handles being called with no argument by reading Date.now() (smoke test)', () => {
    // We can't assert the boolean value (depends on real wall clock), but it
    // should never throw and should return a boolean.
    expect(typeof isFathersDaySaleActive()).toBe('boolean')
  })
})

describe('isLaborDaySaleActive', () => {
  it('is INACTIVE one millisecond before the start', () => {
    expect(isLaborDaySaleActive(LABOR_DAY_SALE_START_MS - 1)).toBe(false)
  })

  it('is ACTIVE at the exact start (2026-08-19 00:00:00 Chicago)', () => {
    expect(isLaborDaySaleActive(LABOR_DAY_SALE_START_MS)).toBe(true)
  })

  it('is ACTIVE mid-window (2026-08-31 noon Chicago)', () => {
    const midWindow = Date.UTC(2026, 7, 31, 17, 0, 0) // 12:00 CDT
    expect(isLaborDaySaleActive(midWindow)).toBe(true)
  })

  it('is ACTIVE on Labor Day itself (2026-09-07 noon Chicago)', () => {
    const laborDayNoon = Date.UTC(2026, 8, 7, 17, 0, 0) // 12:00 CDT
    expect(isLaborDaySaleActive(laborDayNoon)).toBe(true)
  })

  it('is ACTIVE at the exact end (2026-09-07 23:59:59 Chicago)', () => {
    expect(isLaborDaySaleActive(LABOR_DAY_SALE_END_MS)).toBe(true)
  })

  it('is INACTIVE one millisecond after the end', () => {
    expect(isLaborDaySaleActive(LABOR_DAY_SALE_END_MS + 1)).toBe(false)
  })

  it('is INACTIVE the day before the sale opens (Aug 18 noon Chicago)', () => {
    const dayBefore = Date.UTC(2026, 7, 18, 17, 0, 0)
    expect(isLaborDaySaleActive(dayBefore)).toBe(false)
  })

  it('is INACTIVE the day after Labor Day (Sep 8 noon Chicago)', () => {
    const dayAfter = Date.UTC(2026, 8, 8, 17, 0, 0)
    expect(isLaborDaySaleActive(dayAfter)).toBe(false)
  })

  it('is INACTIVE during the Father\'s Day window', () => {
    expect(isLaborDaySaleActive(FATHERS_DAY_SALE_START_MS)).toBe(false)
  })

  it('is INACTIVE in 2027 (window is year-specific)', () => {
    expect(isLaborDaySaleActive(Date.UTC(2027, 8, 1, 17, 0, 0))).toBe(false)
  })
})

describe('getActiveSeasonalSale', () => {
  it('returns the Father\'s Day sale inside its window', () => {
    expect(getActiveSeasonalSale(FATHERS_DAY_SALE_START_MS)?.id).toBe(
      'fathers-day-2026',
    )
  })

  it('returns the Labor Day sale inside its window', () => {
    expect(getActiveSeasonalSale(LABOR_DAY_SALE_START_MS)?.id).toBe('labor-day-2026')
  })

  it('returns null between the two windows (July 4 2026)', () => {
    expect(getActiveSeasonalSale(Date.UTC(2026, 6, 4, 17, 0, 0))).toBeNull()
  })

  it('exposes display copy for the Labor Day sale', () => {
    const sale = getActiveSeasonalSale(LABOR_DAY_SALE_END_MS)!
    expect(sale.label).toBe('Labor Day')
    expect(sale.badge).toBe('LABOR DAY')
    expect(sale.endLabel).toBe('Mon, Sep 7')
    expect(sale.couponEnvSuffix).toBe('LABOR_DAY_2026')
    expect(sale.discountMetadata).toBe('10_off_labor_day_2026')
  })
})

describe('isSeasonalSaleActive', () => {
  it('is true inside either window', () => {
    expect(isSeasonalSaleActive(FATHERS_DAY_SALE_END_MS)).toBe(true)
    expect(isSeasonalSaleActive(LABOR_DAY_SALE_END_MS)).toBe(true)
  })

  it('is false outside every window', () => {
    expect(isSeasonalSaleActive(Date.UTC(2026, 6, 4, 17, 0, 0))).toBe(false)
  })
})

describe('SEASONAL_SALES', () => {
  it('has no overlapping windows and each starts before it ends', () => {
    const sorted = [...SEASONAL_SALES].sort((a, b) => a.startMs - b.startMs)
    for (const sale of sorted) {
      expect(sale.startMs).toBeLessThan(sale.endMs)
    }
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].startMs).toBeGreaterThan(sorted[i - 1].endMs)
    }
  })

  it('gives every sale a distinct id and coupon env suffix', () => {
    expect(new Set(SEASONAL_SALES.map((s) => s.id)).size).toBe(SEASONAL_SALES.length)
    expect(new Set(SEASONAL_SALES.map((s) => s.couponEnvSuffix)).size).toBe(
      SEASONAL_SALES.length,
    )
  })
})
