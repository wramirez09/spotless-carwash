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

// The "base" 4-pack bundle discount that a seasonal coupon stacks on top of,
// in cents. Stripe Checkout only applies one coupon per session, so the
// seasonal coupon in Stripe is configured as the COMBINED amount
// (base + sale). This constant is used purely to split the displayed savings
// into two chips on the FE.
const BUNDLE_BASE_DISCOUNT_CENTS = 500

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

function toSaleInfo(sale: SeasonalSale | null): ActiveSaleInfo | null {
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

const FALLBACK_SAVE_CENTS = {
  base: 500, // always-on 4-pack bundle
  seasonal: 1000, // combined base + sale
} as const

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
  sale: SeasonalSale | null,
): CouponBreakdownItem[] {
  if (totalSave <= 0) return []
  if (!sale) {
    return [
      { id: PACK_DISCOUNT_COUPON_ID, label: '4-Pack bundle', amountOffCents: totalSave },
    ]
  }
  const saleCouponId = seasonalCouponId(sale)
  if (totalSave <= BUNDLE_BASE_DISCOUNT_CENTS) {
    return [{ id: saleCouponId, label: sale.label, amountOffCents: totalSave }]
  }
  return [
    {
      id: PACK_DISCOUNT_COUPON_ID,
      label: '4-Pack bundle',
      amountOffCents: BUNDLE_BASE_DISCOUNT_CENTS,
    },
    {
      id: saleCouponId,
      label: sale.label,
      amountOffCents: totalSave - BUNDLE_BASE_DISCOUNT_CENTS,
    },
  ]
}

export async function getCheckoutPricing(
  nowOverrideMs?: number,
): Promise<CheckoutPricing> {
  const now = nowOverrideMs ?? Date.now()
  const sale = getActiveSeasonalSale(now)
  const couponId = activePackCouponId(now)
  const stripe = getStripe()

  if (!stripe) {
    return fallbackPricing(sale)
  }

  try {
    const packIds = (Object.keys(PACK_PRICES) as WashValue[]).map((id) => ({
      id,
      priceId: PACK_PRICES[id],
    }))
    const singleIds = (Object.keys(SINGLE_PRICES) as WashValue[]).map((id) => ({
      id,
      priceId: SINGLE_PRICES[id],
    }))

    const [packPrices, singlePrices, coupon] = await Promise.all([
      Promise.all(packIds.map((p) => stripe.prices.retrieve(p.priceId))),
      Promise.all(singleIds.map((p) => stripe.prices.retrieve(p.priceId))),
      stripe.coupons.retrieve(couponId).catch(() => null),
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
        coupons: splitCouponBreakdown(save, sale),
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
    return fallbackPricing(sale)
  }
}

function fallbackPricing(sale: SeasonalSale | null): CheckoutPricing {
  const saveCents = sale ? FALLBACK_SAVE_CENTS.seasonal : FALLBACK_SAVE_CENTS.base
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
        coupons: splitCouponBreakdown(save, sale),
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
