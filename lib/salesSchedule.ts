// Father's Day 2026 sale window — America/Chicago.
// Starts at start-of-day 2026-06-07 (= 2026-06-07 05:00:00 UTC; CDT = UTC-5).
// Ends at end-of-day 2026-06-21 (= 2026-06-22 04:59:59 UTC).
export const FATHERS_DAY_SALE_START_MS = Date.UTC(2026, 5, 7, 5, 0, 0)
export const FATHERS_DAY_SALE_END_MS = Date.UTC(2026, 5, 22, 4, 59, 59)

export function isFathersDaySaleActive(now = Date.now()): boolean {
  return now >= FATHERS_DAY_SALE_START_MS && now <= FATHERS_DAY_SALE_END_MS
}
