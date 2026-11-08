import 'server-only'
import {
  getActiveSeasonalSale,
  isSeasonalSaleActive,
  type SeasonalSale,
} from './salesSchedule'
import {
  getPackDiscountCouponId,
  getSeasonalCouponId,
  getStripeSecretKey,
} from './stripeEnv'
import Stripe from 'stripe'
import * as React from 'react'
import { getPricingSnapshot } from './pricingStore'
import { getWashLineup } from './washPackages'
import { expectedListCents, type WashTier } from './washPricing'
import {
  discountMetadata,
  pickActiveSale,
  saleEndLabel,
  skuLabel,
  type CatalogSku,
  type SaleRecord,
} from './pricing/model'

export { getActiveSeasonalSale, isSeasonalSaleActive }
export type { SeasonalSale }

// Stripe Checkout only allows one coupon per session, so the seasonal-sale
// coupon stands in for the combined sale price at checkout; the FE renders
// both chips because conceptually the customer "sees" them stacked. Each
// seasonal coupon in Stripe is configured as the COMBINED amount
// (base + sale) — see notes in lib/salesSchedule.ts.
export const PACK_DISCOUNT_COUPON_ID =
  getPackDiscountCouponId() ?? 'L033ynGl'

// Hardcoded sandbox fallbacks, used only when the DEV_* env var is unset.
// On Vercel Production `getSeasonalCouponId` throws before the `??` applies.
const SEASONAL_COUPON_FALLBACKS: Record<string, string> = {
  FATHERS_DAY_2026: 'KQ9oorQm',
}

/**
 * Coupon ID for a seasonal sale. Resolved lazily (not at module load) so a
 * missing env var for a sale that isn't running yet can't take the site down;
 * if resolution fails we degrade to the always-on $5 pack coupon rather than
 * failing checkout outright.
 */
export function seasonalCouponId(sale: SeasonalSale): string {
  try {
    return (
      getSeasonalCouponId(sale.couponEnvSuffix) ??
      SEASONAL_COUPON_FALLBACKS[sale.couponEnvSuffix] ??
      PACK_DISCOUNT_COUPON_ID
    )
  } catch (err) {
    console.error(
      `[stripePricing] seasonal coupon for "${sale.id}" is not configured; ` +
        'falling back to the always-on 4-pack coupon.',
      err,
    )
    return PACK_DISCOUNT_COUPON_ID
  }
}

// Fallback for the "base" 4-pack bundle discount a sale's coupon stacks on
// top of, in cents. The live value now comes from `pricing_settings` via the
// store; this is what's used when Supabase is unreachable, and it matches the
// $5 the site shipped with. Used purely to split the displayed savings into
// two chips on the FE — Stripe still applies exactly one coupon per session.
const BUNDLE_BASE_DISCOUNT_FALLBACK_CENTS = 500

export type { CatalogSku }

export type CouponBreakdownItem = {
  id: string
  label: string
  amountOffCents: number
}

export type PackPricing = {
  /** The SKU id (Stripe Product lookup key) — what checkout is sent. */
  id: string
  /** Whole-dollar wash denomination, e.g. '12'. */
  washValue: string
  tokens: number
  price: number // list price cents
  save: number // total discount actually applied at checkout, cents
  perToken: number // list/tokens
  label: string
  featured?: boolean
  /** Presentation-only split. Sum of amountOffCents === `save`. */
  coupons: CouponBreakdownItem[]
}

export type SinglePricing = {
  /** The SKU id (Stripe Product lookup key). */
  id: string
  washValue: string
  price: number // cents
  label: string
  featured?: boolean
}

/** Serializable slice of the active sale, safe to pass to client components. */
export type ActiveSaleInfo = {
  id: string
  label: string
  badge: string
  emoji: string
  endLabel: string
}

export type CheckoutPricing = {
  packs: PackPricing[]
  singles: SinglePricing[]
  packCouponAmountOff: number // cents — total auto-applied discount per pack
  /** null outside every sale window. */
  activeSale: ActiveSaleInfo | null
  /** The wash packages the token values and prices come from. */
  tiers?: WashTier[]
}

function toSaleInfo(sale: ResolvedSale | null): ActiveSaleInfo | null {
  if (!sale) return null
  const { id, label, badge, emoji, endLabel } = sale
  return { id, label, badge, emoji, endLabel }
}

/**
 * A sale flattened to exactly what the storefront needs: copy, the single
 * coupon ID checkout will apply, and the extra discount it represents.
 * Deliberately not a `SaleRecord` — nothing downstream should care whether the
 * sale came from Supabase or from the legacy hardcoded schedule.
 */
export type ResolvedSale = {
  id: string
  label: string
  badge: string
  emoji: string
  endLabel: string
  couponId: string
  extraDiscountCents: number
  /** Value written to the Stripe session's `pack_discount` metadata. */
  discountMetadata: string
}

function toResolvedSale(
  sale: SaleRecord,
  baseCouponId: string,
  baseDiscountCents: number,
): ResolvedSale {
  return {
    id: sale.slug,
    label: sale.label,
    badge: sale.badge,
    emoji: sale.emoji,
    endLabel: saleEndLabel(sale),
    // Degrade to the always-on bundle coupon rather than failing checkout when
    // a sale row exists but was never provisioned in Stripe.
    couponId: sale.stripeCouponId ?? baseCouponId,
    extraDiscountCents: sale.extraDiscountCents,
    discountMetadata: discountMetadata(sale, baseDiscountCents),
  }
}

export type CheckoutConfig = {
  /** Every one-time SKU currently for sale, display order. */
  catalog: CatalogSku[]
  /** The one coupon Stripe Checkout will actually apply to a pack. */
  packCouponId: string
  sale: ResolvedSale | null
  baseDiscountCents: number
  baseCouponId: string
  /** The wash packages' tiers — what token values exist and cost. */
  tiers: WashTier[]
}

/**
 * Everything checkout and the pack cards need, resolved from admin-managed
 * config with the env vars as the fallback.
 *
 * This is the seam that removed the deploy: scheduling a sale or changing a
 * price writes a row, and the next call here picks it up.
 *
 * `fresh: true` skips the per-instance cache. Display paths leave it off — a
 * pack card up to 30s behind is harmless. The checkout route turns it on,
 * because that is the call that decides what a customer is actually charged,
 * and a stale Price ID there would bill last week's price. The store's own
 * fallback means an unconfigured or unreachable Supabase lands back on exactly
 * the env-var behavior the site had before.
 */
export async function resolveCheckoutConfig(
  now = Date.now(),
  { fresh = false }: { fresh?: boolean } = {},
): Promise<CheckoutConfig> {
  const [snapshot, washes] = await Promise.all([getPricingSnapshot({ fresh }), getWashLineup()])
  const baseCouponId = snapshot.settings.baseCouponId ?? PACK_DISCOUNT_COUPON_ID
  const record = pickActiveSale(snapshot.sales, now)
  const sale = record
    ? toResolvedSale(record, baseCouponId, snapshot.settings.baseDiscountCents)
    : null

  return {
    catalog: snapshot.catalog.filter(
      (s) =>
        Boolean(s.stripePriceId) &&
        // Only token values that are a wash package on the home page are
        // sold — a $9 token is meaningless once there is no $9 wash. The
        // built-in lineup (src/data/washes.ts) mirrors the CMS, so this holds
        // even while the CMS is unreachable.
        washes.tiers.some((t) => t.washValue === s.washValue),
    ),
    packCouponId: sale ? sale.couponId : baseCouponId,
    sale,
    baseDiscountCents: snapshot.settings.baseDiscountCents,
    baseCouponId,
    tiers: washes.tiers,
  }
}

/** Single coupon ID actually applied at Stripe checkout. */
export function activePackCouponId(now = Date.now()): string {
  const sale = getActiveSeasonalSale(now)
  return sale ? seasonalCouponId(sale) : PACK_DISCOUNT_COUPON_ID
}

/**
 * Optional `nowOverrideMs` lets the BuyTokensPage simulate a different
 * wall-clock time for e2e tests (gated to non-production there). Passing
 * `undefined` falls back to `Date.now()` everywhere downstream.
 */

let stripeSingleton: Stripe | null = null
function getStripe(): Stripe | null {
  if (stripeSingleton) return stripeSingleton
  const key = getStripeSecretKey()
  if (!key) return null
  stripeSingleton = new Stripe(key)
  return stripeSingleton
}

function couponAmountOffFor(
  coupon: Stripe.Coupon | null,
  packCents: number,
): number {
  if (!coupon) return 0
  if (coupon.amount_off && coupon.amount_off > 0) {
    return Math.min(packCents, coupon.amount_off)
  }
  if (coupon.percent_off && coupon.percent_off > 0) {
    return Math.round((packCents * coupon.percent_off) / 100)
  }
  return 0
}

/**
 * Split a total `save` into chip-sized coupons for display.
 * - Outside a sale: one chip "4-Pack bundle".
 * - During a sale: "4-Pack bundle" ($5 base) + the sale label (remainder).
 *   If the active coupon ends up at or below the base, show only the sale chip
 *   — that means the sale coupon isn't actually stacking, so claiming a $5
 *   bundle discount on top would overstate the savings.
 */
function splitCouponBreakdown(
  totalSave: number,
  sale: ResolvedSale | null,
  baseDiscountCents = BUNDLE_BASE_DISCOUNT_FALLBACK_CENTS,
  baseCouponId = PACK_DISCOUNT_COUPON_ID,
  tokens = 4,
): CouponBreakdownItem[] {
  // Named for the pack it's on: "4-Pack bundle", "10-Pack bundle".
  const bundleLabel = `${tokens}-Pack bundle`
  if (totalSave <= 0) return []
  if (!sale) {
    return [{ id: baseCouponId, label: bundleLabel, amountOffCents: totalSave }]
  }
  const saleCouponId = sale.couponId
  if (totalSave <= baseDiscountCents) {
    return [{ id: saleCouponId, label: sale.label, amountOffCents: totalSave }]
  }
  // NOTE: both chips can carry the SAME id — `seasonalCouponId` degrades to the
  // base pack coupon when the sale's coupon can't be resolved. That's fine for
  // display (the split is presentational; only one coupon is ever applied at
  // checkout), but it means `id` alone is not a unique React key. Render sites
  // key on id + label — see src/components/Tokens.tsx.
  return [
    {
      id: baseCouponId,
      label: bundleLabel,
      amountOffCents: baseDiscountCents,
    },
    {
      id: saleCouponId,
      label: sale.label,
      amountOffCents: totalSave - baseDiscountCents,
    },
  ]
}

async function loadCheckoutPricing(
  nowOverrideMs?: number,
): Promise<CheckoutPricing> {
  const now = nowOverrideMs ?? Date.now()
  const config = await resolveCheckoutConfig(now)
  const { sale, baseDiscountCents, baseCouponId } = config
  const stripe = getStripe()

  if (!stripe) {
    return fallbackPricing(sale, baseDiscountCents, baseCouponId, config.catalog, config.tiers)
  }

  try {
    // SKUs read from Stripe's catalog already carry their amount. Only the
    // legacy, never-adopted ones (priced from a bare env-var Price ID) need a
    // lookup — so a fully adopted catalog costs no extra round-trips here.
    const [amounts, coupon] = await Promise.all([
      Promise.all(
        config.catalog.map(async (s) =>
          s.cents != null && s.source === 'stripe'
            ? s.cents
            : ((await stripe.prices.retrieve(s.stripePriceId)).unit_amount ??
              legacyFallbackCents(s, config.tiers)),
        ),
      ),
      stripe.coupons.retrieve(config.packCouponId).catch(() => null),
    ])

    const priced = config.catalog.map((s, i) => ({ sku: s, cents: amounts[i] }))
    return {
      ...buildPricing(priced, sale, baseDiscountCents, baseCouponId, (cents) =>
        couponAmountOffFor(coupon, cents),
      ),
      tiers: config.tiers,
    }
  } catch {
    return fallbackPricing(sale, baseDiscountCents, baseCouponId, config.catalog, config.tiers)
  }
}

/**
 * Best estimate of a token's price when Stripe can't say: tokens × its wash
 * package's price. There is no other table — the wash packages are the only
 * place prices are written down.
 */
function legacyFallbackCents(s: CatalogSku, tiers: readonly WashTier[] = []): number | null {
  return expectedListCents(tiers, s.washValue, s.tokens)
}

function buildPricing(
  priced: { sku: CatalogSku; cents: number | null }[],
  sale: ResolvedSale | null,
  baseDiscountCents: number,
  baseCouponId: string,
  saveFor: (cents: number) => number,
): CheckoutPricing {
  const packs: PackPricing[] = []
  const singles: SinglePricing[] = []
  for (const { sku, cents } of priced) {
    // A SKU whose amount is unknowable can't be honestly advertised.
    if (cents == null) continue
    if (sku.kind === 'pack') {
      const save = saveFor(cents)
      packs.push({
        id: sku.sku,
        washValue: sku.washValue,
        tokens: sku.tokens,
        price: cents,
        save,
        perToken: Math.round(cents / sku.tokens),
        label: skuLabel('pack', sku.washValue, sku.tokens),
        featured: sku.featured,
        coupons: splitCouponBreakdown(save, sale, baseDiscountCents, baseCouponId, sku.tokens),
      })
    } else {
      singles.push({
        id: sku.sku,
        washValue: sku.washValue,
        price: cents,
        label: skuLabel('single', sku.washValue, 1),
        featured: sku.featured,
      })
    }
  }
  // The headline "save $X per pack". Every pack gets the same fixed-amount
  // coupon, so the largest saving is the coupon's face value unless every pack
  // is cheaper than it.
  const packCouponAmountOff = packs.reduce((m, p) => Math.max(m, p.save), 0)
  return { packs, singles, packCouponAmountOff, activeSale: toSaleInfo(sale) }
}

function fallbackPricing(
  sale: ResolvedSale | null,
  baseDiscountCents = BUNDLE_BASE_DISCOUNT_FALLBACK_CENTS,
  baseCouponId = PACK_DISCOUNT_COUPON_ID,
  catalog: CatalogSku[] = [],
  tiers: readonly WashTier[] = [],
): CheckoutPricing {
  // With Stripe unreachable the coupon's real amount is unknown, so the
  // displayed saving is reconstructed from config: base alone outside a sale,
  // base + the sale's extra during one.
  const saveCents = sale
    ? baseDiscountCents + sale.extraDiscountCents
    : baseDiscountCents

  // The catalog still says WHAT is for sale (the store degrades it to the
  // deploy-config SKUs when Stripe can't be listed); only the amounts are
  // reconstructed. An empty catalog stays empty — an admin who removed
  // everything must not see the old eight come back.
  const priced = catalog.map((s) => ({ sku: s, cents: s.cents ?? legacyFallbackCents(s, tiers) }))

  const pricing = buildPricing(priced, sale, baseDiscountCents, baseCouponId, (cents) =>
    Math.min(cents, saveCents),
  )
  return { ...pricing, packCouponAmountOff: saveCents, tiers: [...tiers] }
}

// React's per-request memo (server components only). The home page renders
// both <Washes /> and <Tokens />, and each needs the same pricing; without
// this every request resolves it — Stripe coupon and price lookups included —
// twice. Outside a React server render (tests, route handlers) `cache` is
// absent or a no-op, and every call simply runs.
const memoize: <T extends (...args: never[]) => unknown>(fn: T) => T =
  (React as unknown as { cache?: <T>(fn: T) => T }).cache ?? ((fn) => fn)

/** Everything the pack cards and summaries need, memoized per request. */
export const getCheckoutPricing = memoize(loadCheckoutPricing)
