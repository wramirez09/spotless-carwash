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
export function skuLookupKey(
  kind: PriceKind,
  washValue: string,
  tokens: number = kind === 'pack' ? PACK_TOKEN_COUNT : 1,
): string {
  // The original eight SKUs (4-packs and singles) keep their historical key so
  // the Products already in both Stripe accounts are still found. Any other
  // pack size gets an `_x<tokens>` suffix, which is what lets a $12 4-pack and
  // a $12 10-pack exist side by side.
  if (kind === 'single' || tokens === PACK_TOKEN_COUNT) {
    return `spotless_${kind}_${washValue}`
  }
  return `spotless_${kind}_${washValue}_x${tokens}`
}

const SKU_KEY_RE = /^spotless_(pack|single)_(\d{1,3})(?:_x(\d{1,3}))?$/

/**
 * The inverse of `skuLookupKey`. Returns null for anything that isn't a
 * one-time token SKU — subscription keys, hand-made Products, typos — so the
 * catalog loader can never mistake an unrelated Product for something sellable.
 */
export function parseSkuLookupKey(
  key: string | null | undefined,
): { kind: PriceKind; washValue: string; tokens: number } | null {
  if (!key) return null
  const m = SKU_KEY_RE.exec(key)
  if (!m) return null
  const kind = m[1] as PriceKind
  const washValue = String(Number(m[2]))
  if (washValue !== m[2]) return null // leading zeros: not a key we ever write
  if (kind === 'single') {
    if (m[3]) return null
    return { kind, washValue, tokens: 1 }
  }
  const tokens = m[3] ? Number(m[3]) : PACK_TOKEN_COUNT
  if (m[3] && (tokens === PACK_TOKEN_COUNT || String(tokens) !== m[3])) return null
  return { kind, washValue, tokens }
}

// ---------------------------------------------------------------------------
// Catalog (one-time token SKUs)
// ---------------------------------------------------------------------------

/** Where a SKU's price came from, highest precedence first. */
export type PriceSource = 'stripe' | 'db' | 'env'

/**
 * One sellable one-time product: a pack of N tokens, or a single token, at a
 * wash denomination. `sku` is the Stripe Product's lookup key and is the id
 * the storefront and checkout pass around.
 */
export type CatalogSku = {
  sku: string
  kind: PriceKind
  /** Whole-dollar wash denomination as a string, e.g. '12'. */
  washValue: string
  tokens: number
  /** List price in cents, or null when only a Price ID is known. */
  cents: number | null
  stripePriceId: string
  stripeProductId: string | null
  featured: boolean
  /** Lower sorts first. Ties fall back to denomination then size. */
  sortOrder: number
  source: PriceSource
}

/** The SKU that is "Most Popular" when nobody has said otherwise. */
export function defaultFeatured(kind: PriceKind, washValue: string, tokens: number): boolean {
  return kind === 'pack' && washValue === '12' && tokens === PACK_TOKEN_COUNT
}

/** Default sort weight — everything ties, so denomination then size decides. */
export const DEFAULT_SORT_ORDER = 100

export function sortCatalog<
  T extends Pick<CatalogSku, 'kind' | 'washValue' | 'tokens' | 'sortOrder'>,
>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'pack' ? -1 : 1
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
    const dv = Number(a.washValue) - Number(b.washValue)
    if (dv !== 0) return dv
    return a.tokens - b.tokens
  })
}

/** Customer-facing label, e.g. "$12 wash · 4-pack" or "$9 wash · single". */
export function skuLabel(kind: PriceKind, washValue: string, tokens: number): string {
  return kind === 'single'
    ? `$${washValue} wash · single`
    : `$${washValue} wash · ${tokens}-pack`
}

/** The Stripe Product name for a SKU. */
export function skuProductName(kind: PriceKind, washValue: string, tokens: number): string {
  return kind === 'single'
    ? `$${washValue} Wash Token`
    : `$${washValue} Wash Token — ${tokens}-Pack`
}

/** Highest list price the admin may publish, in cents. Typo guard. */
export const MAX_PRICE_CENTS = 50_000

export function validatePriceCents(cents: number | null): string | null {
  if (cents == null || !Number.isInteger(cents) || cents <= 0) {
    return 'Enter a price greater than $0.00.'
  }
  // A fat-fingered "3200" in a dollars field becomes $3,200. Nothing in this
  // catalog is anywhere near $500, so refuse rather than publish it.
  if (cents > MAX_PRICE_CENTS) {
    return `${formatCents(cents)} looks like a typo — prices above $500 are blocked.`
  }
  return null
}

/**
 * Validate what an admin typed when creating a SKU. Returns a message for the
 * first problem, or null. Kept pure so the exact rules are unit-tested.
 */
export function validateSkuInput(input: {
  kind: string
  washValue: string
  tokens: number
  cents: number | null
}): string | null {
  if (input.kind !== 'pack' && input.kind !== 'single') {
    return 'Choose a pack or a single token.'
  }
  if (!/^[1-9]\d{0,2}$/.test(input.washValue)) {
    return 'The wash value must be a whole-dollar amount, e.g. 12.'
  }
  const wash = Number(input.washValue)
  if (wash < 1 || wash > 100) return 'The wash value must be between $1 and $100.'
  if (input.kind === 'pack') {
    if (!Number.isInteger(input.tokens) || input.tokens < 2 || input.tokens > 50) {
      return 'A pack holds between 2 and 50 tokens.'
    }
  }
  return validatePriceCents(input.cents)
}

// ---------------------------------------------------------------------------
// Subscription prices
// ---------------------------------------------------------------------------

/**
 * Stripe Price `lookup_key` for a subscription plan at a denomination. Unlike
 * the one-time SKUs this lives on the Price, not the Product: every plan
 * shares one Product, and Stripe's `transfer_lookup_key` moves the key to a new
 * Price atomically when an admin changes the monthly amount.
 */
export function subscriptionLookupKey(plan: string, washValue: string): string {
  return `spotless_sub_${plan}_${washValue}`
}

/** Plan ids are lowercase slugs: letters, digits, single hyphens. */
export const PLAN_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const SUB_KEY_RE = /^spotless_sub_([a-z0-9]+(?:-[a-z0-9]+)*)_([1-9]\d{0,2})$/

/** Inverse of `subscriptionLookupKey`; null for anything we never write. */
export function parseSubscriptionLookupKey(
  key: string | null | undefined,
): { plan: string; washValue: string } | null {
  if (!key) return null
  const m = SUB_KEY_RE.exec(key)
  return m ? { plan: m[1], washValue: m[2] } : null
}

/** Validate a whole-dollar token denomination typed by an admin. */
export function validateWashValue(washValue: string): string | null {
  if (!/^[1-9]\d{0,2}$/.test(washValue)) {
    return 'The token value must be a whole-dollar amount, e.g. 12.'
  }
  const n = Number(washValue)
  if (n < 1 || n > 100) return 'The token value must be between $1 and $100.'
  return null
}

/** Validate a subscription plan's details. Returns the first problem, or null. */
export function validatePlanInput(input: {
  name: string
  tokensPerCycle: number
  blurb: string
}): string | null {
  const name = input.name.trim()
  if (!name) return 'A plan needs a name.'
  if (name.length > 40) return 'Keep the plan name to 40 characters or fewer.'
  if (
    !Number.isInteger(input.tokensPerCycle) ||
    input.tokensPerCycle < 1 ||
    input.tokensPerCycle > 50
  ) {
    return 'A plan ships between 1 and 50 tokens a month.'
  }
  if (input.blurb.trim().length > 200) return 'Keep the description to 200 characters or fewer.'
  return null
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

// ---------------------------------------------------------------------------
// Admin price-row state
// ---------------------------------------------------------------------------

/**
 * A save this browser has completed but the server data has not caught up to.
 *
 * `from` is what the row reported before the save, `to` is what was saved.
 * Keeping the "from" lets the row tell two situations apart: the server is
 * merely lagging (still reporting `from`, so trust `to`), versus the value
 * genuinely changed somewhere else (reporting neither, so trust the server).
 */
export type PendingSave = { from: number | null; to: number } | null

/**
 * The price the row should behave as if it holds.
 *
 * The pricing cache is per serverless instance, so the re-render after a save
 * can be served by an instance that still reports the old amount. Without
 * this the row shows the superseded price AND leaves Save enabled, because
 * the typed value still differs from what the server reported — which reads
 * as "the save did not work" and invites a duplicate save. Every save creates
 * a real Stripe Price, so a duplicate is not harmless.
 */
export function effectivePriceCents(
  rowCents: number | null,
  pending: PendingSave,
): number | null {
  if (!pending) return rowCents
  // Server still reporting the pre-save value — it is behind, so trust ours.
  if (rowCents === pending.from) return pending.to
  // Server agrees, or reports something else entirely (changed elsewhere).
  return rowCents
}

export type SaveState = { canSave: boolean; reason: string | null }

/**
 * Whether the Save button is enabled, and why not when it isn't.
 *
 * A button that greys out silently reads as a broken form, so every blocked
 * case carries a reason. Saving is blocked when there is nothing to save
 * because each save creates a Stripe Price object.
 */
export function priceSaveState(args: {
  rawValue: string
  typedCents: number | null
  effectiveCents: number | null
  pending: boolean
}): SaveState {
  const { rawValue, typedCents, effectiveCents, pending } = args
  if (pending) return { canSave: false, reason: null }
  if (typedCents == null) {
    return {
      canSave: false,
      reason: rawValue.trim() === '' ? 'Enter an amount' : 'Not a valid amount',
    }
  }
  if (typedCents === effectiveCents) {
    return { canSave: false, reason: 'Same as the current price' }
  }
  return { canSave: true, reason: null }
}
