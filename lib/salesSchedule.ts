// Seasonal sale windows, expressed in America/Chicago wall time and converted
// to UTC ms via Date.UTC. Chicago is CDT (UTC-5) from March to November, which
// covers every window defined here.
//
// A seasonal sale stacks an extra discount on top of the always-on 4-pack
// bundle coupon. Stripe Checkout only allows ONE coupon per session, so each
// sale's Stripe coupon is configured as the COMBINED amount (base + sale) and
// the FE splits it into two chips for display — see lib/stripePricing.ts.

export type SeasonalSaleId = 'fathers-day-2026' | 'labor-day-2026'

export type SeasonalSale = {
  id: SeasonalSaleId
  /** Coupon chip label on pack cards + order summary. */
  label: string
  /** Short badge text in the site-wide SalesBanner. */
  badge: string
  emoji: string
  /** Human-readable last day, used in banner copy. */
  endLabel: string
  startMs: number
  endMs: number
  /** Suffix of the PROD_/DEV_STRIPE_COUPON_* env var holding the coupon ID. */
  couponEnvSuffix: string
  /** Value written to the Stripe session's `pack_discount` metadata. */
  discountMetadata: string
}

// Father's Day 2026: 2026-06-07 00:00 → 2026-06-21 23:59:59 Chicago.
export const FATHERS_DAY_SALE_START_MS = Date.UTC(2026, 5, 7, 5, 0, 0)
export const FATHERS_DAY_SALE_END_MS = Date.UTC(2026, 5, 22, 4, 59, 59)

// Labor Day 2026: 2026-08-19 00:00 → 2026-09-07 23:59:59 Chicago.
// Labor Day itself is Mon Sep 7, 2026 — the sale runs through end of that day.
export const LABOR_DAY_SALE_START_MS = Date.UTC(2026, 7, 19, 5, 0, 0)
export const LABOR_DAY_SALE_END_MS = Date.UTC(2026, 8, 8, 4, 59, 59)

export const SEASONAL_SALES: readonly SeasonalSale[] = [
  {
    id: 'fathers-day-2026',
    label: "Father's Day",
    badge: "FATHER'S DAY",
    emoji: '👔',
    endLabel: 'Sun, Jun 21',
    startMs: FATHERS_DAY_SALE_START_MS,
    endMs: FATHERS_DAY_SALE_END_MS,
    couponEnvSuffix: 'FATHERS_DAY_2026',
    discountMetadata: '10_off_fathers_day_2026',
  },
  {
    id: 'labor-day-2026',
    label: 'Labor Day',
    badge: 'LABOR DAY',
    emoji: '🛠️',
    endLabel: 'Mon, Sep 7',
    startMs: LABOR_DAY_SALE_START_MS,
    endMs: LABOR_DAY_SALE_END_MS,
    couponEnvSuffix: 'LABOR_DAY_2026',
    discountMetadata: '10_off_labor_day_2026',
  },
] as const

/**
 * The sale in effect at `now`, or null outside every window. Windows are
 * authored to not overlap; if they ever did, the first match wins.
 */
export function getActiveSeasonalSale(now = Date.now()): SeasonalSale | null {
  return SEASONAL_SALES.find((s) => now >= s.startMs && now <= s.endMs) ?? null
}

export function isSeasonalSaleActive(now = Date.now()): boolean {
  return getActiveSeasonalSale(now) !== null
}

export function isFathersDaySaleActive(now = Date.now()): boolean {
  return getActiveSeasonalSale(now)?.id === 'fathers-day-2026'
}

export function isLaborDaySaleActive(now = Date.now()): boolean {
  return getActiveSeasonalSale(now)?.id === 'labor-day-2026'
}
