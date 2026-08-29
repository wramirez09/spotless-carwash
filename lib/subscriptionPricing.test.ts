import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  SUBSCRIPTION_PLAN_IDS,
  SUBSCRIPTION_WASH_VALUE,
  fallbackSubscriptionPricing,
  getSubscriptionPlan,
  isSubscriptionPlanId,
} from './subscriptionPricing'

// The prices below are the contract with the client proposal (Section 3.1).
// If one of these assertions fails, either the proposal changed or someone
// edited pricing by accident — both need a human decision, not a test update.
const PROPOSAL = {
  weekly: { tokens: 4, monthly: 4000 },
  frequent: { tokens: 8, monthly: 7600 },
  family: { tokens: 12, monthly: 10800 },
} as const

describe('SUBSCRIPTION_PLAN_IDS', () => {
  it('is exactly the three plans in the proposal', () => {
    expect([...SUBSCRIPTION_PLAN_IDS]).toEqual(['weekly', 'frequent', 'family'])
  })
})

describe('getSubscriptionPlan', () => {
  for (const id of SUBSCRIPTION_PLAN_IDS) {
    it(`prices "${id}" at the proposal's monthly rate and token count`, () => {
      const plan = getSubscriptionPlan(id)
      expect(plan.price).toBe(PROPOSAL[id].monthly)
      expect(plan.tokensPerCycle).toBe(PROPOSAL[id].tokens)
    })
  }

  it('derives perToken from price / tokens', () => {
    expect(getSubscriptionPlan('weekly').perToken).toBe(1000) // $40 / 4
    expect(getSubscriptionPlan('frequent').perToken).toBe(950) // $76 / 8
    expect(getSubscriptionPlan('family').perToken).toBe(900) // $108 / 12
  })

  it('ships the $12 Lustre token on every plan', () => {
    for (const id of SUBSCRIPTION_PLAN_IDS) {
      expect(getSubscriptionPlan(id).washValue).toBe(SUBSCRIPTION_WASH_VALUE)
      expect(getSubscriptionPlan(id).washValue).toBe('12')
    }
  })

  it('features exactly one plan, the middle tier', () => {
    const featured = SUBSCRIPTION_PLAN_IDS.filter((id) => getSubscriptionPlan(id).featured)
    expect(featured).toEqual(['frequent'])
  })
})

describe('isSubscriptionPlanId', () => {
  it('accepts the real plan ids', () => {
    expect(isSubscriptionPlanId('weekly')).toBe(true)
    expect(isSubscriptionPlanId('family')).toBe(true)
  })

  it('rejects anything else, including non-strings', () => {
    expect(isSubscriptionPlanId('gold')).toBe(false)
    expect(isSubscriptionPlanId('')).toBe(false)
    expect(isSubscriptionPlanId(undefined)).toBe(false)
    expect(isSubscriptionPlanId(4)).toBe(false)
    expect(isSubscriptionPlanId({ id: 'weekly' })).toBe(false)
  })
})

describe('fallbackSubscriptionPricing', () => {
  it('returns all three plans when Stripe is unreachable', () => {
    const { plans } = fallbackSubscriptionPricing()
    expect(plans.map((p) => p.id)).toEqual(['weekly', 'frequent', 'family'])
    expect(plans.map((p) => p.price)).toEqual([4000, 7600, 10800])
  })
})

describe('getSubscriptionPricing', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it('falls back to proposal pricing when Stripe has no secret key', async () => {
    // No DEV_STRIPE_SECRET_KEY → getStripe() returns null → fallback path.
    vi.stubEnv('DEV_STRIPE_SECRET_KEY', '')
    vi.stubEnv('PROD_STRIPE_SECRET_KEY', '')
    const mod = await import('./subscriptionPricing')
    const pricing = await mod.getSubscriptionPricing()
    expect(pricing.plans.map((p) => p.price)).toEqual([4000, 7600, 10800])
  })
})
