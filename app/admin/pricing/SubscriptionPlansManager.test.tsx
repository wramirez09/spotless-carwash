// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

vi.mock('./actions', () => ({
  createPlan: vi.fn(),
  updatePlan: vi.fn(),
  deletePlan: vi.fn(),
  setPlanPrice: vi.fn(),
  removePlanPrice: vi.fn(),
}))

import SubscriptionPlansManager, { type PlanView } from './SubscriptionPlansManager'

function plan(over: Partial<PlanView> = {}): PlanView {
  return {
    id: 'commuter',
    name: 'Commuter',
    tokensPerCycle: 6,
    blurb: 'Six a month',
    featured: false,
    source: 'stripe',
    variants: [{ washValue: '10', cents: 5000, source: 'stripe' }],
    ...over,
  }
}

const html = (plans: PlanView[], opts: { live?: boolean; enabled?: boolean } = {}) =>
  renderToStaticMarkup(
    <SubscriptionPlansManager plans={plans} live={opts.live ?? true} enabled={opts.enabled ?? true} />,
  )

describe('SubscriptionPlansManager', () => {
  it('renders an editable form for each plan', () => {
    const markup = html([plan()])
    expect(markup).toContain('Edit the Commuter plan')
    expect(markup).toContain('value="Commuter"')
    expect(markup).toContain('value="6"')
    expect(markup).toContain('Save plan')
    expect(markup).toContain('Delete the Commuter plan')
  })

  it('lists each token value with its monthly price, per-token cost and Remove', () => {
    const markup = html([plan()])
    expect(markup).toContain('$10 tokens')
    expect(markup).toContain('value="50.00"')
    expect(markup).toContain('$8.33 / token')
    expect(markup).toContain('Remove Commuter with $10 tokens')
  })

  it('offers to add a token value and a whole new plan', () => {
    const markup = html([plan()])
    expect(markup).toContain('Add a token value to Commuter')
    expect(markup).toContain('Add a subscription plan')
  })

  it('flags an original plan that still lives in code', () => {
    expect(html([plan({ source: 'legacy' })])).toContain('saving moves it into Stripe')
  })

  it('says a computed value is not purchasable yet', () => {
    const markup = html([plan({ variants: [{ washValue: '8', cents: 2400, source: 'computed' }] })])
    expect(markup).toContain('Not in Stripe — save to make it purchasable')
  })

  it('warns that a plan with no values is hidden from the site', () => {
    expect(html([plan({ variants: [] })])).toContain('hidden from the site')
  })

  it('explains when Stripe is down or subscriptions are switched off', () => {
    const markup = html([plan()], { live: false, enabled: false })
    expect(markup).toContain('Stripe couldn&#x27;t be reached')
    expect(markup).toContain('SUBSCRIPTIONS_ENABLED')
  })
})
