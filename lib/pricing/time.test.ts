// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  chicagoWallToUtcMs,
  formatChicagoAdmin,
  formatSaleEndLabel,
  parseChicagoLocalInput,
  toChicagoLocalInput,
} from './time'
import {
  LABOR_DAY_SALE_END_MS,
  LABOR_DAY_SALE_START_MS,
} from '../salesSchedule'

describe('chicagoWallToUtcMs', () => {
  it('matches the hand-computed CDT windows the site shipped with', () => {
    // The legacy constants were written as Date.UTC(...) with a manual -5h
    // CDT offset. Reproducing them exactly is what proves the admin-scheduled
    // windows land on the same instants the hardcoded ones did.
    expect(chicagoWallToUtcMs(2026, 8, 20, 0, 0, 0)).toBe(LABOR_DAY_SALE_START_MS)
    expect(chicagoWallToUtcMs(2026, 9, 7, 23, 59, 59)).toBe(LABOR_DAY_SALE_END_MS)
  })

  it('uses CST (UTC-6) for a winter sale', () => {
    // The old code assumed UTC-5 year-round and documented that every window
    // happened to fall in CDT. An admin can now schedule a January sale, and
    // that assumption would put it an hour off.
    expect(chicagoWallToUtcMs(2027, 1, 15, 0, 0, 0)).toBe(Date.UTC(2027, 0, 15, 6, 0, 0))
  })

  it('resolves a nonexistent spring-forward time deterministically', () => {
    // 2026-03-08 02:30 Chicago does not exist — the clock jumps 2am -> 3am.
    // It resolves to 1:30am CST rather than throwing, which is all a sale
    // boundary needs: pinned here so the behavior can't drift silently.
    const gap = chicagoWallToUtcMs(2026, 3, 8, 2, 30, 0)
    expect(gap).toBe(Date.UTC(2026, 2, 8, 7, 30, 0))
  })

  it('resolves an ambiguous fall-back time to the daylight occurrence', () => {
    // 2026-11-01 01:30 Chicago happens twice. The first (CDT, UTC-5) wins.
    expect(chicagoWallToUtcMs(2026, 11, 1, 1, 30, 0)).toBe(
      Date.UTC(2026, 10, 1, 6, 30, 0),
    )
  })

  it('round-trips a wall time through the input format', () => {
    const ms = chicagoWallToUtcMs(2026, 6, 21, 23, 59)
    expect(toChicagoLocalInput(ms)).toBe('2026-06-21T23:59')
  })
})

describe('parseChicagoLocalInput', () => {
  it('parses a datetime-local value as Chicago wall time', () => {
    expect(parseChicagoLocalInput('2026-08-20T00:00')).toBe(LABOR_DAY_SALE_START_MS)
  })

  it('accepts an optional seconds component', () => {
    expect(parseChicagoLocalInput('2026-09-07T23:59:59')).toBe(LABOR_DAY_SALE_END_MS)
  })

  it.each([
    ['', 'empty'],
    ['not a date', 'garbage'],
    ['2026-13-01T00:00', 'month 13'],
    ['2026-02-31T00:00', 'a day that does not exist'],
    ['2026-08-20T25:00', 'hour 25'],
    ['2026-08-20', 'a date with no time'],
  ])('rejects %s (%s)', (input) => {
    expect(parseChicagoLocalInput(input)).toBeNull()
  })

  it('tolerates surrounding whitespace', () => {
    expect(parseChicagoLocalInput('  2026-08-20T00:00  ')).toBe(LABOR_DAY_SALE_START_MS)
  })
})

describe('formatSaleEndLabel', () => {
  it('names the final day of the window, not the day after', () => {
    // The window ends at 23:59:59 on Sep 7, so the banner must read Sep 7 —
    // an off-by-one here advertises a sale as ending a day late.
    expect(formatSaleEndLabel(LABOR_DAY_SALE_END_MS)).toBe('Mon, Sep 7')
  })
})

describe('formatChicagoAdmin', () => {
  it('renders the window in Forest Park time for the admin screen', () => {
    expect(formatChicagoAdmin(LABOR_DAY_SALE_START_MS)).toBe('Aug 20, 2026, 12:00 AM')
  })
})
