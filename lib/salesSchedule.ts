// Father's Day 2026 sale ends end-of-day 2026-06-21 America/Chicago
// = 2026-06-22 04:59:59 UTC.
export const FATHERS_DAY_SALE_END_MS = Date.UTC(2026, 5, 22, 4, 59, 59)

export function isFathersDaySaleActive(now = Date.now()): boolean {
  return now <= FATHERS_DAY_SALE_END_MS
}
