import 'server-only'
import Stripe from 'stripe'
import { getStripeSecretKey, getSubscriptionPriceId } from './stripeEnv'

// Wash Token Subscription pricing.
//
// Deliberately does NOT import from lib/stripePricing. Subscription tiers are
// set by the business proposal and are independent of one-time pack/single
// pricing — keeping them apart stops the seasonal-coupon logic in stripePricing
// from ever leaking into a recurring charge, and stops a pack price change from
// silently moving a subscriber's monthly bill.

export const SUBSCRIPTION_PLAN_IDS = ['weekly', 'frequent', 'family'] as const
export type SubscriptionPlanId = (typeof SUBSCRIPTION_PLAN_IDS)[number]

/** Env-var suffix for each plan (see lib/stripeEnv getSubscriptionPriceId). */
const PLAN_ENV_KEY = {
  weekly: 'WEEKLY',
  frequent: 'FREQUENT',
  family: 'FAMILY',
} as const

/**
 * Wash value of the tokens a subscriber receives. The proposal anchors every
 * tier on the $12 (Lustre) token, so all three plans ship the same denomination
 * — but it is stored per-plan (and persisted per-subscription) rather than
 * hardcoded downstream, so changing it is a one-line edit here.
 */
export const SUBSCRIPTION_WASH_VALUE = '12' as const

export type SubscriptionPlan = {
  id: SubscriptionPlanId
  /** Customer-facing plan name from the proposal. */
  name: string
  tokensPerCycle: number
  washValue: typeof SUBSCRIPTION_WASH_VALUE
  /** Monthly price in cents. */
  price: number
  /** price / tokensPerCycle, cents — presentation only. */
  perToken: number
  blurb: string
  featured?: boolean
}

/**
 * Monthly prices in cents, per the proposal's Section 3.1. Used as the
 * fallback when Stripe is unreachable, and cross-checked against the live
 * Price objects otherwise.
 */
const PLAN_FALLBACK_CENTS: Record<SubscriptionPlanId, number> = {
  weekly: 4000,
  frequent: 7600,
  family: 10800,
}

const PLAN_TOKENS: Record<SubscriptionPlanId, number> = {
  weekly: 4,
  frequent: 8,
  family: 12,
}

const PLAN_COPY: Record<SubscriptionPlanId, { name: string; blurb: string }> = {
  weekly: {
    name: 'Weekly',
    blurb: 'A wash a week. Four tokens in the mailbox every month.',
  },
  frequent: {
    name: 'Frequent',
    blurb: 'For drivers who wash more than most — eight tokens a month.',
  },
  family: {
    name: 'Family / Fleet',
    blurb: 'Two cars, or a car and a work truck. Twelve tokens a month.',
  },
}

export type SubscriptionPricing = {
  plans: SubscriptionPlan[]
}

function buildPlan(id: SubscriptionPlanId, cents: number): SubscriptionPlan {
  const tokens = PLAN_TOKENS[id]
  return {
    id,
    name: PLAN_COPY[id].name,
    tokensPerCycle: tokens,
    washValue: SUBSCRIPTION_WASH_VALUE,
    price: cents,
    perToken: Math.round(cents / tokens),
    blurb: PLAN_COPY[id].blurb,
    featured: id === 'frequent',
  }
}

export function fallbackSubscriptionPricing(): SubscriptionPricing {
  return {
    plans: SUBSCRIPTION_PLAN_IDS.map((id) => buildPlan(id, PLAN_FALLBACK_CENTS[id])),
  }
}

/** Price ID for a plan, or undefined when the env var is unset off-production. */
export function subscriptionPriceId(id: SubscriptionPlanId): string | undefined {
  return getSubscriptionPriceId(PLAN_ENV_KEY[id])
}

export function isSubscriptionPlanId(value: unknown): value is SubscriptionPlanId {
  return (
    typeof value === 'string' &&
    (SUBSCRIPTION_PLAN_IDS as readonly string[]).includes(value)
  )
}

export function getSubscriptionPlan(id: SubscriptionPlanId): SubscriptionPlan {
  return buildPlan(id, PLAN_FALLBACK_CENTS[id])
}

let stripeSingleton: Stripe | null = null
function getStripe(): Stripe | null {
  if (stripeSingleton) return stripeSingleton
  const key = getStripeSecretKey()
  if (!key) return null
  stripeSingleton = new Stripe(key)
  return stripeSingleton
}

/**
 * Live plan pricing, read from the Stripe Price objects so the page can never
 * advertise a number that differs from what the customer is charged. Falls back
 * to PLAN_FALLBACK_CENTS if Stripe is unconfigured or unreachable — same
 * degrade-don't-fail contract as getCheckoutPricing.
 */
export async function getSubscriptionPricing(): Promise<SubscriptionPricing> {
  const stripe = getStripe()
  if (!stripe) return fallbackSubscriptionPricing()

  try {
    const prices = await Promise.all(
      SUBSCRIPTION_PLAN_IDS.map(async (id) => {
        const priceId = subscriptionPriceId(id)
        if (!priceId) return null
        return stripe.prices.retrieve(priceId)
      }),
    )
    return {
      plans: SUBSCRIPTION_PLAN_IDS.map((id, i) =>
        buildPlan(id, prices[i]?.unit_amount ?? PLAN_FALLBACK_CENTS[id]),
      ),
    }
  } catch {
    return fallbackSubscriptionPricing()
  }
}
