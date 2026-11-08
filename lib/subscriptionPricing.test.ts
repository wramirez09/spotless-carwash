import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_SUBSCRIPTION_WASH_VALUE,
  SUBSCRIPTION_PLAN_IDS,
  SUBSCRIPTION_WASH_VALUES,
  fallbackSubscriptionPricing,
  getSubscriptionPlan,
  getSubscriptionVariant,
  isSubscriptionPlanId,
  isSubscriptionWashValue,
  subscriptionMonthlyCents,
  type SubscriptionPlanId,
  type SubscriptionWashValue,
} from './subscriptionPricing'

// The $12 column is the contract with the client proposal (Section 3.1): the
// headline prices $40 / $76 / $108. If one of these fails, either the proposal
// changed or someone edited pricing by accident — both need a human decision,
// not a test update.
const PROPOSAL_AT_12 = { weekly: 4000, frequent: 7600, family: 10800 } as const

// Full variant matrix, in cents. Derived from a per-token discount off the list
// wash price ($2.00 / $2.50 / $3.00 by plan), which is what makes every cell a
// whole dollar while keeping the $12 column exactly on the proposal.
const MATRIX: Record<SubscriptionPlanId, Record<SubscriptionWashValue, number>> = {
  weekly: { '8': 2400, '9': 2800, '10': 3200, '12': 4000 },
  frequent: { '8': 4400, '9': 5200, '10': 6000, '12': 7600 },
  family: { '8': 6000, '9': 7200, '10': 8400, '12': 10800 },
}

describe('SUBSCRIPTION_PLAN_IDS / WASH_VALUES', () => {
  it('is exactly the three plans in the proposal', () => {
    expect([...SUBSCRIPTION_PLAN_IDS]).toEqual(['weekly', 'frequent', 'family'])
  })

  it('offers the same four denominations as the one-time store', () => {
    expect([...SUBSCRIPTION_WASH_VALUES]).toEqual(['8', '9', '10', '12'])
  })

  it('defaults to the $12 token the proposal is priced on', () => {
    expect(DEFAULT_SUBSCRIPTION_WASH_VALUE).toBe('12')
  })
})

describe('subscriptionMonthlyCents', () => {
  it('reproduces the proposal exactly at the $12 anchor', () => {
    for (const id of SUBSCRIPTION_PLAN_IDS) {
      expect(subscriptionMonthlyCents(id, '12')).toBe(PROPOSAL_AT_12[id])
    }
  })

  it('prices every plan/denomination cell as expected', () => {
    for (const id of SUBSCRIPTION_PLAN_IDS) {
      for (const w of SUBSCRIPTION_WASH_VALUES) {
        expect(subscriptionMonthlyCents(id, w)).toBe(MATRIX[id][w])
      }
    }
  })

  it('lands every cell on a whole dollar', () => {
    for (const id of SUBSCRIPTION_PLAN_IDS) {
      for (const w of SUBSCRIPTION_WASH_VALUES) {
        expect(subscriptionMonthlyCents(id, w) % 100).toBe(0)
      }
    }
  })

  it('gets cheaper per token as the plan gets bigger', () => {
    for (const w of SUBSCRIPTION_WASH_VALUES) {
      const weekly = getSubscriptionVariant('weekly', w).perToken
      const frequent = getSubscriptionVariant('frequent', w).perToken
      const family = getSubscriptionVariant('family', w).perToken
      expect(frequent).toBeLessThan(weekly)
      expect(family).toBeLessThan(frequent)
    }
  })

  it('always beats the equivalent one-time 4-pack (list less the $5 bundle)', () => {
    // A 4-pack lists at washValue x 4 and checks out $5 cheaper. A subscription
    // that does not beat that per token gives customers no reason to commit.
    for (const w of SUBSCRIPTION_WASH_VALUES) {
      const packPerToken = (Number(w) * 100 * 4 - 500) / 4
      for (const id of SUBSCRIPTION_PLAN_IDS) {
        expect(getSubscriptionVariant(id, w).perToken).toBeLessThan(packPerToken)
      }
    }
  })
})

describe('getSubscriptionVariant', () => {
  it('reports the list price and per-token saving', () => {
    const v = getSubscriptionVariant('weekly', '12')
    expect(v.price).toBe(4000)
    expect(v.perToken).toBe(1000)
    expect(v.listPerToken).toBe(1200)
    expect(v.savePerToken).toBe(200)
  })

  it('saves more per token on the bigger plans', () => {
    expect(getSubscriptionVariant('weekly', '12').savePerToken).toBe(200)
    expect(getSubscriptionVariant('frequent', '12').savePerToken).toBe(250)
    expect(getSubscriptionVariant('family', '12').savePerToken).toBe(300)
  })
})

describe('getSubscriptionPlan', () => {
  it('carries one variant per denomination', () => {
    for (const id of SUBSCRIPTION_PLAN_IDS) {
      const plan = getSubscriptionPlan(id)
      expect(plan.variants.map((v) => v.washValue)).toEqual(['8', '9', '10', '12'])
    }
  })

  it('keeps the token count fixed across denominations', () => {
    // Changing the wash tier changes the price, never how many tokens ship.
    const plan = getSubscriptionPlan('family')
    expect(plan.tokensPerCycle).toBe(12)
    for (const v of plan.variants) {
      expect(Math.round(v.price / v.perToken)).toBe(12)
    }
  })

  it('features exactly one plan, the middle tier', () => {
    const featured = SUBSCRIPTION_PLAN_IDS.filter((id) => getSubscriptionPlan(id).featured)
    expect(featured).toEqual(['frequent'])
  })
})

describe('validators', () => {
  it('accepts real plan ids and rejects anything else', () => {
    expect(isSubscriptionPlanId('weekly')).toBe(true)
    expect(isSubscriptionPlanId('gold')).toBe(false)
    expect(isSubscriptionPlanId(undefined)).toBe(false)
    expect(isSubscriptionPlanId(4)).toBe(false)
  })

  it('accepts real denominations and rejects anything else', () => {
    expect(isSubscriptionWashValue('12')).toBe(true)
    expect(isSubscriptionWashValue('8')).toBe(true)
    // Numbers must not slip through — metadata is stored as strings.
    expect(isSubscriptionWashValue(12)).toBe(false)
    expect(isSubscriptionWashValue('11')).toBe(false)
    expect(isSubscriptionWashValue('')).toBe(false)
  })
})

describe('fallbackSubscriptionPricing', () => {
  it('returns the full matrix when Stripe is unreachable', () => {
    const { plans } = fallbackSubscriptionPricing()
    expect(plans.map((p) => p.id)).toEqual(['weekly', 'frequent', 'family'])
    for (const plan of plans) {
      for (const v of plan.variants) {
        expect(v.price).toBe(MATRIX[plan.id][v.washValue])
      }
    }
  })
})

describe('getSubscriptionPricing', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it('falls back to computed pricing when Stripe has no secret key', async () => {
    vi.stubEnv('DEV_STRIPE_SECRET_KEY', '')
    vi.stubEnv('PROD_STRIPE_SECRET_KEY', '')
    const mod = await import('./subscriptionPricing')
    const pricing = await mod.getSubscriptionPricing()
    expect(pricing.plans[0].variants.map((v) => v.price)).toEqual([
      2400, 2800, 3200, 4000,
    ])
  })
})
