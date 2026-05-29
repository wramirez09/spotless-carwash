import 'server-only'
import {
  FATHERS_DAY_SALE_END_MS,
  FATHERS_DAY_SALE_START_MS,
  isFathersDaySaleActive,
} from './salesSchedule'
import {
  getFathersDayCouponId,
  getPackDiscountCouponId,
  getPackPriceId,
  getSinglePriceId,
  getStripeSecretKey,
} from './stripeEnv'
import Stripe from 'stripe'

export {
  FATHERS_DAY_SALE_END_MS,
  FATHERS_DAY_SALE_START_MS,
  isFathersDaySaleActive,
}

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

// Stripe Checkout only allows one coupon per session, so the Father's Day
// coupon stands in for the combined sale price at checkout; the FE renders
// both chips because conceptually the customer "sees" them stacked. If you
// want the customer charged the full $10 off during the sale, the Father's
// Day coupon in Stripe is already configured as the COMBINED amount
// (base + sale) — see notes in lib/salesSchedule.ts.
export const PACK_DISCOUNT_COUPON_ID =
  getPackDiscountCouponId() ?? 'L033ynGl'

export const FATHERS_DAY_COUPON_ID =
  getFathersDayCouponId() ?? 'KQ9oorQm'

// The "base" 4-pack bundle discount that the Father's Day coupon stacks on top
// of, in cents. Stripe Checkout only applies one coupon per session, so the
// Father's Day coupon in Stripe is configured as the COMBINED amount
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

export type CheckoutPricing = {
  packs: PackPricing[]
  singles: SinglePricing[]
  packCouponAmountOff: number // cents — total auto-applied discount per pack
  fathersDayActive: boolean
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
  fathersDay: 1000, // combined base + sale
} as const

/** Single coupon ID actually applied at Stripe checkout. */
export function activePackCouponId(now = Date.now()): string {
  return isFathersDaySaleActive(now) ? FATHERS_DAY_COUPON_ID : PACK_DISCOUNT_COUPON_ID
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
 * - Outside the sale: one chip "4-Pack bundle".
 * - During the sale: "4-Pack bundle" ($5 base) + "Father's Day" (remainder).
 *   If the active coupon ends up less than the base, just show "Father's Day".
 */
function splitCouponBreakdown(
  totalSave: number,
  fathersDayActive: boolean,
): CouponBreakdownItem[] {


  if (totalSave <= 0) return []
  if (!fathersDayActive) {
    return [
      { id: PACK_DISCOUNT_COUPON_ID, label: '4-Pack bundle', amountOffCents: totalSave },
    ]
  }
  if (totalSave <= BUNDLE_BASE_DISCOUNT_CENTS) {
    return [
      { id: FATHERS_DAY_COUPON_ID, label: "Father's Day", amountOffCents: totalSave },
    ]
  }
  return [
    {
      id: PACK_DISCOUNT_COUPON_ID,
      label: '4-Pack bundle',
      amountOffCents: BUNDLE_BASE_DISCOUNT_CENTS,
    },
    {
      id: FATHERS_DAY_COUPON_ID,
      label: "Father's Day",
      amountOffCents: totalSave - BUNDLE_BASE_DISCOUNT_CENTS,
    },
  ]
}

export async function getCheckoutPricing(
  nowOverrideMs?: number,
): Promise<CheckoutPricing> {
  const now = nowOverrideMs ?? Date.now()
  const fathersDayActive = isFathersDaySaleActive(now)
  const couponId = activePackCouponId(now)
  const stripe = getStripe()

  if (!stripe) {
    return fallbackPricing(fathersDayActive)
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
        coupons: splitCouponBreakdown(save, fathersDayActive),
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

    return { packs, singles, packCouponAmountOff, fathersDayActive }
  } catch {
    return fallbackPricing(fathersDayActive)
  }
}

function fallbackPricing(fathersDayActive: boolean): CheckoutPricing {
  const saveCents = fathersDayActive
    ? FALLBACK_SAVE_CENTS.fathersDay
    : FALLBACK_SAVE_CENTS.base
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
        coupons: splitCouponBreakdown(save, fathersDayActive),
      }
    },
  )
  const singles: SinglePricing[] = (Object.keys(SINGLE_FALLBACK_CENTS) as WashValue[]).map(
    (id) => ({ id, price: SINGLE_FALLBACK_CENTS[id] }),
  )
  return { packs, singles, packCouponAmountOff: saveCents, fathersDayActive }
}
