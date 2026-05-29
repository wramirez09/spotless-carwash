import { describe, expect, it } from 'vitest'
import {
  FATHERS_DAY_SALE_END_MS,
  FATHERS_DAY_SALE_START_MS,
  isFathersDaySaleActive,
} from './salesSchedule'

// All boundary timestamps are expressed in America/Chicago wall time and
// converted to UTC ms via Date.UTC (CDT = UTC-5 in June).

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

  it('is INACTIVE well before the start (today, May 29 2026)', () => {
    const today = Date.UTC(2026, 4, 29, 12, 0, 0)
    expect(isFathersDaySaleActive(today)).toBe(false)
  })

  it('is INACTIVE well after the end (July 1, 2026)', () => {
    const afterEnd = Date.UTC(2026, 6, 1, 12, 0, 0)
    expect(isFathersDaySaleActive(afterEnd)).toBe(false)
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
    // We can\'t assert the boolean value (depends on real wall clock), but it
    // should never throw and should return a boolean.
    expect(typeof isFathersDaySaleActive()).toBe('boolean')
  })
})
