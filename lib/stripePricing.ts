import 'server-only'
import {
  getActiveSeasonalSale,
  isSeasonalSaleActive,
  type SeasonalSale,
} from './salesSchedule'
import {
  getPackDiscountCouponId,
  getPackPriceId,
  getSeasonalCouponId,
  getStripeSecretKey,
  getSinglePriceId,
} from './stripeEnv'
import Stripe from 'stripe'
import { getPricingSnapshot } from './pricingStore'
import {
  discountMetadata,
  pickActiveSale,
  saleEndLabel,
  type SaleRecord,
} from './pricing/model'

export { getActiveSeasonalSale, isSeasonalSaleActive }
export type { SeasonalSale }

// ---------- Stripe IDs (resolved via lib/stripeEnv.ts at module load).
// Picks PROD_* on Vercel Production, DEV_* otherwise. The hardcoded sandbox
// IDs below are only ever used as last-resort fallbacks for DEV_* misses —
// on Vercel Production the getters throw before the `??` fallback applies.

export const PACK_PRICES: Record<'8' | '9' | '10' | '12', string> = {
  '8': getPackPriceId('8') ?? 'price_1TYbXTGhjWB5e4mpkuHG1Ckd',
  '9': getPackPriceId('9') ?? 'price_1TYbXcGhjWB5e4mpodKcrTAG',
  '10': getPackPriceId('10') ?? 'price_1TYbXkGhjWB5e4mpZnBQM9PI',
  '12': getPackPriceId('12') ?? 'price_1TYbXwGhjWB5e4mpjvVl1Oqf',
}

export const SINGLE_PRICES: Record<'8' | '9' | '10' | '12', string> = {
  '8': getSinglePriceId('8') ?? 'price_1TYEItGhjWB5e4mpWsLAcRMJ',
  '9': getSinglePriceId('9') ?? 'price_1TYEJ3GhjWB5e4mpfgqpzfql',
  '10': getSinglePriceId('10') ?? 'price_1TYEJBGhjWB5e4mpEIEfFyrT',
  '12': getSinglePriceId('12') ?? 'price_1TYEJKGhjWB5e4mpdpMew8qJ',
}

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

export const WASH_VALUES = ['8', '9', '10', '12'] as const
export type WashValue = (typeof WASH_VALUES)[number]

export type CouponBreakdownItem = {
  id: string
  label: string
  amountOffCents: number
}

export type PackPricing = {
  id: WashValue
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
  id: WashValue
  price: number // cents
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
}

function toSaleInfo(sale: ResolvedSale | null): ActiveSaleInfo | null {
  if (!sale) return null
  const { id, label, badge, emoji, endLabel } = sale
  return { id, label, badge, emoji, endLabel }
}

// Hardcoded list fallbacks used only if Stripe is unreachable. Match the
// sandbox configuration created on 2026-05-18.
const PACK_FALLBACK_CENTS: Record<WashValue, number> = {
  '8': 3200,
  '9': 3600,
  '10': 4000,
  '12': 4800,
}
const SINGLE_FALLBACK_CENTS: Record<WashValue, number> = {
  '8': 800,
  '9': 900,
  '10': 1000,
  '12': 1200,
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
  packPriceIds: Record<WashValue, string>
  singlePriceIds: Record<WashValue, string>
  /** The one coupon Stripe Checkout will actually apply to a pack. */
  packCouponId: string
  sale: ResolvedSale | null
  baseDiscountCents: number
  baseCouponId: string
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
  const snapshot = await getPricingSnapshot({ fresh })
  const baseCouponId = snapshot.settings.baseCouponId ?? PACK_DISCOUNT_COUPON_ID
  const record = pickActiveSale(snapshot.sales, now)
  const sale = record
    ? toResolvedSale(record, baseCouponId, snapshot.settings.baseDiscountCents)
    : null

  const idsFor = (kind: 'pack' | 'single'): Record<WashValue, string> =>
    Object.fromEntries(
      WASH_VALUES.map((v) => [
        v,
        snapshot.prices[kind][v].stripePriceId ||
          (kind === 'pack' ? PACK_PRICES[v] : SINGLE_PRICES[v]),
      ]),
    ) as Record<WashValue, string>

  return {
    packPriceIds: idsFor('pack'),
    singlePriceIds: idsFor('single'),
    packCouponId: sale ? sale.couponId : baseCouponId,
    sale,
    baseDiscountCents: snapshot.settings.baseDiscountCents,
    baseCouponId,
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
): CouponBreakdownItem[] {
  if (totalSave <= 0) return []
  if (!sale) {
    return [{ id: baseCouponId, label: '4-Pack bundle', amountOffCents: totalSave }]
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
      label: '4-Pack bundle',
      amountOffCents: baseDiscountCents,
    },
    {
      id: saleCouponId,
      label: sale.label,
      amountOffCents: totalSave - baseDiscountCents,
    },
  ]
}

export async function getCheckoutPricing(
  nowOverrideMs?: number,
): Promise<CheckoutPricing> {
  const now = nowOverrideMs ?? Date.now()
  const config = await resolveCheckoutConfig(now)
  const { sale, baseDiscountCents, baseCouponId } = config
  const stripe = getStripe()

  if (!stripe) {
    return fallbackPricing(sale, baseDiscountCents, baseCouponId)
  }

  try {
    const packIds = WASH_VALUES.map((id) => ({ id, priceId: config.packPriceIds[id] }))
    const singleIds = WASH_VALUES.map((id) => ({ id, priceId: config.singlePriceIds[id] }))

    const [packPrices, singlePrices, coupon] = await Promise.all([
      Promise.all(packIds.map((p) => stripe.prices.retrieve(p.priceId))),
      Promise.all(singleIds.map((p) => stripe.prices.retrieve(p.priceId))),
      stripe.coupons.retrieve(config.packCouponId).catch(() => null),
    ])

    const packs: PackPricing[] = packIds.map((p, i) => {
      const stripePrice = packPrices[i]
      const cents = stripePrice.unit_amount ?? PACK_FALLBACK_CENTS[p.id]
      const tokens = 4
      const save = couponAmountOffFor(coupon, cents)
      return {
        id: p.id,
        tokens,
        price: cents,
        save,
        perToken: Math.round(cents / tokens),
        label: `$${p.id} wash · 4-pack`,
        featured: p.id === '12',
        coupons: splitCouponBreakdown(save, sale, baseDiscountCents, baseCouponId),
      }
    })

    const packCouponAmountOff = packs[0]?.save ?? 0

    const singles: SinglePricing[] = singleIds.map((p, i) => {
      const stripePrice = singlePrices[i]
      return {
        id: p.id,
        price: stripePrice.unit_amount ?? SINGLE_FALLBACK_CENTS[p.id],
      }
    })

    return { packs, singles, packCouponAmountOff, activeSale: toSaleInfo(sale) }
  } catch {
    return fallbackPricing(sale, baseDiscountCents, baseCouponId)
  }
}

function fallbackPricing(
  sale: ResolvedSale | null,
  baseDiscountCents = BUNDLE_BASE_DISCOUNT_FALLBACK_CENTS,
  baseCouponId = PACK_DISCOUNT_COUPON_ID,
): CheckoutPricing {
  // With Stripe unreachable the coupon's real amount is unknown, so the
  // displayed saving is reconstructed from config: base alone outside a sale,
  // base + the sale's extra during one.
  const saveCents = sale
    ? baseDiscountCents + sale.extraDiscountCents
    : baseDiscountCents
  const packs: PackPricing[] = (Object.keys(PACK_FALLBACK_CENTS) as WashValue[]).map(
    (id) => {
      const cents = PACK_FALLBACK_CENTS[id]
      const tokens = 4
      const save = Math.min(cents, saveCents)
      return {
        id,
        tokens,
        price: cents,
        save,
        perToken: Math.round(cents / tokens),
        label: `$${id} wash · 4-pack`,
        featured: id === '12',
        coupons: splitCouponBreakdown(save, sale, baseDiscountCents, baseCouponId),
      }
    },
  )
  const singles: SinglePricing[] = (Object.keys(SINGLE_FALLBACK_CENTS) as WashValue[]).map(
    (id) => ({ id, price: SINGLE_FALLBACK_CENTS[id] }),
  )
  return {
    packs,
    singles,
    packCouponAmountOff: saveCents,
    activeSale: toSaleInfo(sale),
  }
}
