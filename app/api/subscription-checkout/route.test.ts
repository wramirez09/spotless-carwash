// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'

// --- Mocks ----------------------------------------------------------------
// Stripe and the env-resolved price IDs are stubbed so the tests assert on the
// Session arguments the route builds, with no network calls. Mirrors the setup
// in app/api/checkout/route.test.ts.

const { sessionsCreate, getStripeSecretKey, subscriptionPriceId } = vi.hoisted(() => ({
  sessionsCreate: vi.fn(),
  getStripeSecretKey: vi.fn<() => string | undefined>(() => 'sk_test_fake'),
  subscriptionPriceId: vi.fn<() => string | undefined>(() => 'price_sub_weekly'),
}))

vi.mock('stripe', () => ({
  default: class FakeStripe {
    checkout = { sessions: { create: sessionsCreate } }
  },
}))

vi.mock('@/lib/stripeEnv', () => ({ getStripeSecretKey }))

vi.mock('@/lib/subscriptionPricing', async () => {
  const actual = await vi.importActual<typeof import('@/lib/subscriptionPricing')>(
    '@/lib/subscriptionPricing',
  )
  return { ...actual, subscriptionPriceId }
})

import { POST } from './route'

const VALID_BODY = {
  plan: 'weekly',
  email: 'pat@example.com',
  name: 'Pat Driver',
  phone: '(708) 555-0100',
  mailingListSubscribed: false,
}

function makeReq(body: unknown, { origin = 'https://spotless.test' } = {}) {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (origin) headers.origin = origin
  return new Request('https://spotless.test/api/subscription-checkout', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

afterEach(() => {
  vi.clearAllMocks()
  getStripeSecretKey.mockReturnValue('sk_test_fake')
  subscriptionPriceId.mockReturnValue('price_sub_weekly')
})

describe('POST /api/subscription-checkout', () => {
  it('creates a subscription-mode session and returns the Stripe URL', async () => {
    sessionsCreate.mockResolvedValue({ url: 'https://checkout.stripe.test/s/1' })

    const res = await POST(makeReq(VALID_BODY))

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ url: 'https://checkout.stripe.test/s/1' })

    const args = sessionsCreate.mock.calls[0][0]
    expect(args.mode).toBe('subscription')
    expect(args.line_items).toEqual([{ price: 'price_sub_weekly', quantity: 1 }])
  })

  it('omits customer_creation, which Stripe rejects in subscription mode', async () => {
    sessionsCreate.mockResolvedValue({ url: 'https://checkout.stripe.test/s/1' })
    await POST(makeReq(VALID_BODY))
    expect(sessionsCreate.mock.calls[0][0]).not.toHaveProperty('customer_creation')
  })

  it('never applies a coupon — subscription discounts live in the recurring price', async () => {
    sessionsCreate.mockResolvedValue({ url: 'https://checkout.stripe.test/s/1' })
    await POST(makeReq(VALID_BODY))
    expect(sessionsCreate.mock.calls[0][0]).not.toHaveProperty('discounts')
  })

  it('has Stripe collect the US shipping address, since tokens are mailed', async () => {
    sessionsCreate.mockResolvedValue({ url: 'https://checkout.stripe.test/s/1' })
    await POST(makeReq(VALID_BODY))
    expect(sessionsCreate.mock.calls[0][0].shipping_address_collection).toEqual({
      allowed_countries: ['US'],
    })
  })

  it('mirrors plan metadata onto the subscription so renewal invoices carry it', async () => {
    sessionsCreate.mockResolvedValue({ url: 'https://checkout.stripe.test/s/1' })
    await POST(makeReq(VALID_BODY))

    const args = sessionsCreate.mock.calls[0][0]
    // Session metadata is NOT copied to the Subscription automatically, and the
    // webhook needs these on every invoice.paid, not just the first.
    expect(args.subscription_data.metadata).toMatchObject({
      plan: 'weekly',
      tokens_per_cycle: '4',
      wash_value: '12',
    })
    expect(args.metadata).toMatchObject({ plan: 'weekly', tokens_per_cycle: '4' })
  })

  it('sends the customer back to the subscribe success page', async () => {
    sessionsCreate.mockResolvedValue({ url: 'https://checkout.stripe.test/s/1' })
    await POST(makeReq(VALID_BODY))

    const args = sessionsCreate.mock.calls[0][0]
    expect(args.success_url).toBe(
      'https://spotless.test/buy-tokens/subscribe/success?session_id={CHECKOUT_SESSION_ID}',
    )
    expect(args.cancel_url).toBe('https://spotless.test/buy-tokens/subscribe')
  })

  it('rejects an unknown plan id', async () => {
    const res = await POST(makeReq({ ...VALID_BODY, plan: 'platinum' }))
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ error: 'Bad plan' })
    expect(sessionsCreate).not.toHaveBeenCalled()
  })

  it('rejects an invalid email before touching Stripe', async () => {
    const res = await POST(makeReq({ ...VALID_BODY, email: 'nope' }))
    expect(res.status).toBe(400)
    expect(sessionsCreate).not.toHaveBeenCalled()
  })

  it('returns 500 when the plan has no configured price', async () => {
    subscriptionPriceId.mockReturnValue(undefined)
    const res = await POST(makeReq(VALID_BODY))
    expect(res.status).toBe(500)
    await expect(res.json()).resolves.toEqual({ error: 'Subscriptions not configured' })
  })

  it('turns a throwing price resolver into a controlled 500, not a crash', async () => {
    // getSubscriptionPriceId throws on Vercel Production when PROD_* is unset.
    subscriptionPriceId.mockImplementation(() => {
      throw new Error('PROD_STRIPE_PRICE_SUB_WEEKLY is required')
    })
    const res = await POST(makeReq(VALID_BODY))
    expect(res.status).toBe(500)
    await expect(res.json()).resolves.toEqual({ error: 'Subscriptions not configured' })
  })

  it('returns 500 when Stripe is unconfigured', async () => {
    getStripeSecretKey.mockReturnValue(undefined)
    const res = await POST(makeReq(VALID_BODY))
    expect(res.status).toBe(500)
    await expect(res.json()).resolves.toEqual({ error: 'Stripe not configured' })
  })

  it('surfaces a Stripe failure as a 500 with its message', async () => {
    sessionsCreate.mockRejectedValue(new Error('boom'))
    const res = await POST(makeReq(VALID_BODY))
    expect(res.status).toBe(500)
    await expect(res.json()).resolves.toEqual({ error: 'boom' })
  })
})
