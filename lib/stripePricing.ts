import 'server-only'
import Stripe from 'stripe'
import { FATHERS_DAY_SALE_END_MS, isFathersDaySaleActive } from './salesSchedule'

export { FATHERS_DAY_SALE_END_MS, isFathersDaySaleActive }

// ---------- Sandbox IDs (override via env) ----------

export const PACK_PRICES: Record<'8' | '9' | '10' | '12', string> = {
  '8': process.env.STRIPE_PRICE_PACK_8 ?? 'price_1TYbXTGhjWB5e4mpkuHG1Ckd',
  '9': process.env.STRIPE_PRICE_PACK_9 ?? 'price_1TYbXcGhjWB5e4mpodKcrTAG',
  '10': process.env.STRIPE_PRICE_PACK_10 ?? 'price_1TYbXkGhjWB5e4mpZnBQM9PI',
  '12': process.env.STRIPE_PRICE_PACK_12 ?? 'price_1TYbXwGhjWB5e4mpjvVl1Oqf',
}

export const SINGLE_PRICES: Record<'8' | '9' | '10' | '12', string> = {
  '8': process.env.STRIPE_PRICE_SINGLE_8 ?? 'price_1TYEItGhjWB5e4mpWsLAcRMJ',
  '9': process.env.STRIPE_PRICE_SINGLE_9 ?? 'price_1TYEJ3GhjWB5e4mpfgqpzfql',
  '10': process.env.STRIPE_PRICE_SINGLE_10 ?? 'price_1TYEJBGhjWB5e4mpEIEfFyrT',
  '12': process.env.STRIPE_PRICE_SINGLE_12 ?? 'price_1TYEJKGhjWB5e4mpdpMew8qJ',
}

export const PACK_DISCOUNT_COUPON_ID =
  process.env.STRIPE_COUPON_PACK_DISCOUNT ?? 'thoUh0Kr'

export const FATHERS_DAY_COUPON_ID =
  process.env.STRIPE_COUPON_FATHERS_DAY_2026 ?? 'sGKM8l9M'

export const WASH_VALUES = ['8', '9', '10', '12'] as const
export type WashValue = (typeof WASH_VALUES)[number]

export type PackPricing = {
  id: WashValue
  tokens: number
  price: number // list price cents
  save: number // discount cents (0 if no coupon applies)
  perToken: number // list/tokens
  label: string
  featured?: boolean
}

export type SinglePricing = {
  id: WashValue
  price: number // cents
}

export type CheckoutPricing = {
  packs: PackPricing[]
  singles: SinglePricing[]
  packCouponAmountOff: number // cents — what gets auto-applied to pack checkouts right now
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

export function activePackCouponId(now = Date.now()): string {
  return isFathersDaySaleActive(now) ? FATHERS_DAY_COUPON_ID : PACK_DISCOUNT_COUPON_ID
}

let stripeSingleton: Stripe | null = null
function getStripe(): Stripe | null {
  if (stripeSingleton) return stripeSingleton
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  stripeSingleton = new Stripe(key)
  return stripeSingleton
}

export async function getCheckoutPricing(): Promise<CheckoutPricing> {
  const fathersDayActive = isFathersDaySaleActive()
  const couponId = activePackCouponId()
  const stripe = getStripe()

  if (!stripe) {
    return fallbackPricing(fathersDayActive, /* couponAmountOff */ fathersDayActive ? 1000 : 500)
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

    const packCouponAmountOff = coupon?.amount_off ?? 0

    const packs: PackPricing[] = packIds.map((p, i) => {
      const stripePrice = packPrices[i]
      const cents = stripePrice.unit_amount ?? PACK_FALLBACK_CENTS[p.id]
      const tokens = 4
      return {
        id: p.id,
        tokens,
        price: cents,
        save: packCouponAmountOff,
        perToken: Math.round(cents / tokens),
        label: `$${p.id} wash · 4-pack`,
        featured: p.id === '12',
      }
    })

    const singles: SinglePricing[] = singleIds.map((p, i) => {
      const stripePrice = singlePrices[i]
      return {
        id: p.id,
        price: stripePrice.unit_amount ?? SINGLE_FALLBACK_CENTS[p.id],
      }
    })

    return { packs, singles, packCouponAmountOff, fathersDayActive }
  } catch {
    return fallbackPricing(fathersDayActive, fathersDayActive ? 1000 : 500)
  }
}

function fallbackPricing(
  fathersDayActive: boolean,
  packCouponAmountOff: number,
): CheckoutPricing {
  const packs: PackPricing[] = (Object.keys(PACK_FALLBACK_CENTS) as WashValue[]).map(
    (id) => {
      const cents = PACK_FALLBACK_CENTS[id]
      const tokens = 4
      return {
        id,
        tokens,
        price: cents,
        save: packCouponAmountOff,
        perToken: Math.round(cents / tokens),
        label: `$${id} wash · 4-pack`,
        featured: id === '12',
      }
    },
  )
  const singles: SinglePricing[] = (Object.keys(SINGLE_FALLBACK_CENTS) as WashValue[]).map(
    (id) => ({ id, price: SINGLE_FALLBACK_CENTS[id] }),
  )
  return { packs, singles, packCouponAmountOff, fathersDayActive }
}
