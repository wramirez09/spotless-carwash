// Pure domain types + rules for admin-managed pricing and sales.
//
// Deliberately free of `server-only`, Supabase and Stripe imports: every rule
// that decides what a customer pays lives here so it can be unit-tested
// without mocking a payment processor. The store (lib/pricingStore.ts) and the
// write services (lib/pricingAdmin.ts) depend on this file, never the reverse.

import { formatSaleEndLabel } from './time'

export const WASH_VALUES = ['8', '9', '10', '12'] as const
export type WashValue = (typeof WASH_VALUES)[number]

export const PRICE_KINDS = ['pack', 'single'] as const
export type PriceKind = (typeof PRICE_KINDS)[number]

/** Tokens included per purchased unit. A "pack" has always been 4 tokens. */
export const PACK_TOKEN_COUNT = 4

/**
 * Stable identifier for a SKU, stamped on the Stripe Product's metadata.
 *
 * This is what makes Stripe the source of truth: the app finds a SKU's Product
 * by this key and takes whatever that Product's `default_price` currently is,
 * rather than trusting an ID recorded in our own database. Change the price in
 * the Stripe dashboard and the site follows.
 *
 * Never change the format — it is matched against Products already created in
 * both the live and sandbox accounts.
 */
export function skuLookupKey(kind: PriceKind, washValue: WashValue): string {
  return `spotless_${kind}_${washValue}`
}

export type SaleStatus = 'draft' | 'scheduled' | 'canceled'

/** A row of `public.sales`, normalized to ms for comparison against Date.now(). */
export type SaleRecord = {
  id: string
  slug: string
  label: string
  badge: string
  emoji: string
  endLabel: string | null
  startMs: number
  endMs: number
  extraDiscountCents: number
  stripeCouponId: string | null
  stripeAmountOffCents: number | null
  status: SaleStatus
}

/** A row of `public.catalog_prices`. */
export type CatalogPriceRecord = {
  id: string
  kind: PriceKind
  washValue: WashValue
  unitAmountCents: number
  stripePriceId: string
  stripeProductId: string | null
  active: boolean
  createdAt: string
  createdBy: string | null
}

export type PricingSettings = {
  baseDiscountCents: number
  baseCouponId: string | null
}

/**
 * Where a sale sits relative to `now`. Only 'live' is customer-facing.
 *
 * Derived rather than stored: a stored "active" flag depends on a cron running
 * on time, and a missed run would leave a sale advertising itself after it
 * ended (or, worse, discounting after the Stripe coupon's redeem_by has
 * passed, so the banner promises a discount checkout refuses to apply).
 */
export type SaleState = 'draft' | 'canceled' | 'upcoming' | 'live' | 'ended'

export function saleState(sale: SaleRecord, now = Date.now()): SaleState {
  if (sale.status === 'canceled') return 'canceled'
  if (sale.status === 'draft') return 'draft'
  if (now < sale.startMs) return 'upcoming'
  if (now > sale.endMs) return 'ended'
  return 'live'
}

export function isSaleLive(sale: SaleRecord, now = Date.now()): boolean {
  return saleState(sale, now) === 'live'
}

/**
 * The one sale in effect at `now`, or null.
 *
 * Overlapping windows are rejected at write time (see `findWindowConflict`),
 * but this is the read path for data that may predate that check or have been
 * edited directly in Supabase — so it resolves a tie deterministically rather
 * than trusting the invariant: the sale that STARTED most recently wins, which
 * is the one an admin most likely just scheduled. Ties on start time fall back
 * to the larger discount, so a customer is never shown the worse of two
 * simultaneous offers.
 */
export function pickActiveSale(
  sales: readonly SaleRecord[],
  now = Date.now(),
): SaleRecord | null {
  const live = sales.filter((s) => isSaleLive(s, now))
  if (live.length === 0) return null
  return live.reduce((best, s) => {
    if (s.startMs !== best.startMs) return s.startMs > best.startMs ? s : best
    return s.extraDiscountCents > best.extraDiscountCents ? s : best
  })
}

/** Banner copy for a sale's final day, falling back to the stored override. */
export function saleEndLabel(sale: SaleRecord): string {
  return sale.endLabel?.trim() || formatSaleEndLabel(sale.endMs)
}

/**
 * What the Stripe coupon for a sale must be worth.
 *
 * Stripe Checkout applies ONE coupon per session, so a sale cannot stack its
 * coupon on top of the always-on bundle coupon — the sale's coupon has to
 * carry both. This is the single place that arithmetic happens; every caller
 * (provisioning, drift detection, the FE chip split) derives from it.
 */
export function combinedCouponAmountCents(
  baseDiscountCents: number,
  extraDiscountCents: number,
): number {
  return baseDiscountCents + extraDiscountCents
}

/**
 * True when a sale's provisioned Stripe coupon no longer matches what the
 * current base discount implies — e.g. the base was raised from $5 to $6 after
 * the sale's coupon was created. The admin UI surfaces this so a stale coupon
 * gets re-provisioned before the window opens instead of quietly under-
 * discounting.
 */
export function couponDrift(
  sale: SaleRecord,
  settings: PricingSettings,
): { expected: number; actual: number } | null {
  if (sale.stripeAmountOffCents == null) return null
  const expected = combinedCouponAmountCents(
    settings.baseDiscountCents,
    sale.extraDiscountCents,
  )
  if (expected === sale.stripeAmountOffCents) return null
  return { expected, actual: sale.stripeAmountOffCents }
}

/**
 * A sale is safe to publish only once its coupon exists in Stripe. Draft rows
 * with no coupon are the normal intermediate state while an admin is still
 * editing copy.
 */
export function isProvisioned(sale: SaleRecord): boolean {
  return Boolean(sale.stripeCouponId)
}

/**
 * Overlapping windows among SCHEDULED sales, which would make "the current
 * sale" ambiguous. Drafts and canceled sales are ignored: they never reach a
 * customer, so an admin can freely prepare next year's sale while this year's
 * is still on the books.
 */
export function findWindowConflict(
  candidate: { id?: string; startMs: number; endMs: number; status: SaleStatus },
  existing: readonly SaleRecord[],
): SaleRecord | null {
  if (candidate.status !== 'scheduled') return null
  return (
    existing.find(
      (s) =>
        s.id !== candidate.id &&
        s.status === 'scheduled' &&
        candidate.startMs <= s.endMs &&
        s.startMs <= candidate.endMs,
    ) ?? null
  )
}

/** 'Labor Day 2026' -> 'labor-day-2026'. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/**
 * The value written to Stripe session metadata as `pack_discount`, matching
 * the shape the existing rows use ('10_off_labor_day_2026'). The webhook and
 * any revenue reporting read this, so the format is load-bearing.
 */
export function discountMetadata(sale: SaleRecord, baseDiscountCents: number): string {
  const total = combinedCouponAmountCents(baseDiscountCents, sale.extraDiscountCents)
  return `${Math.round(total / 100)}_off_${sale.slug.replace(/-/g, '_')}`
}

/** `$32.00` from 3200. Shared by the admin UI and the audit log. */
export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

/**
 * Parse a dollar amount typed by an admin ("32", "32.50", "$32.50") into
 * cents. Returns null for anything that isn't a clean, non-negative amount —
 * including values with sub-cent precision, which would otherwise round
 * silently and make the stored price disagree with what was typed.
 */
export function parseDollarsToCents(input: string): number | null {
  const cleaned = input.trim().replace(/^\$/, '').replace(/,/g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null
  const cents = Math.round(Number(cleaned) * 100)
  return Number.isFinite(cents) ? cents : null
}
