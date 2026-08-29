// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'

// --- Mocks ----------------------------------------------------------------
// The webhook's own routing is what's under test: which handler each event
// reaches. Stripe, Supabase, email and the subscription persistence layer are
// all stubbed so the assertions are purely about dispatch.

const {
  constructEvent,
  sessionsRetrieve,
  getStripeSecretKey,
  getStripeWebhookSecret,
  getSupabaseAdmin,
  sendOwnerSaleNotification,
  sendOwnerSubscriptionNotification,
  persistSubscriptionFromSession,
  recordFulfillmentForInvoice,
  markSubscriptionStatus,
  syncSubscription,
  syncShippingAddress,
} = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  sessionsRetrieve: vi.fn(),
  getStripeSecretKey: vi.fn<() => string | undefined>(() => 'sk_test_fake'),
  getStripeWebhookSecret: vi.fn<() => string | undefined>(() => 'whsec_fake'),
  getSupabaseAdmin: vi.fn(() => null),
  // Typed with their argument so assertions can read mock.calls[0][0].
  sendOwnerSaleNotification: vi.fn<(sale: { totalTokens: number }) => Promise<void>>(
    async () => {},
  ),
  sendOwnerSubscriptionNotification: vi.fn<
    (sub: { tokensCount: number }) => Promise<void>
  >(async () => {}),
  persistSubscriptionFromSession: vi.fn(async () => {}),
  recordFulfillmentForInvoice: vi.fn(async () => null as unknown),
  markSubscriptionStatus: vi.fn(async () => {}),
  syncSubscription: vi.fn(async () => {}),
  syncShippingAddress: vi.fn(async () => {}),
}))

vi.mock('stripe', () => ({
  default: class FakeStripe {
    webhooks = { constructEvent }
    checkout = { sessions: { retrieve: sessionsRetrieve } }
  },
}))

vi.mock('@/lib/stripeEnv', () => ({ getStripeSecretKey, getStripeWebhookSecret }))
vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin }))
vi.mock('@/lib/promotions', () => ({ subscribeToPromotions: vi.fn(async () => ({ ok: true })) }))
vi.mock('@/lib/email', () => ({
  sendOwnerSaleNotification,
  sendOwnerSubscriptionNotification,
}))
vi.mock('@/lib/subscriptions', () => ({
  persistSubscriptionFromSession,
  recordFulfillmentForInvoice,
  markSubscriptionStatus,
  syncSubscription,
  syncShippingAddress,
}))

import { POST } from './route'

function makeReq(body = '{}') {
  return new Request('https://spotless.test/api/stripe-webhook', {
    method: 'POST',
    headers: { 'stripe-signature': 't=1,v1=fake' },
    body,
  })
}

/** A one-time token purchase session, as the existing pack/single flow builds it. */
const PAYMENT_SESSION = {
  id: 'cs_payment_1',
  mode: 'payment',
  customer_email: 'pat@example.com',
  customer_details: { email: 'pat@example.com', phone: '', address: null },
  metadata: {
    package_size: '4',
    quantity: '1',
    mode: 'pack',
    wash_value: '12',
    customer_name: 'Pat Driver',
  },
  line_items: { data: [{ quantity: 1 }] },
  amount_total: 4300,
  currency: 'usd',
}

const SUBSCRIPTION_SESSION = {
  id: 'cs_sub_1',
  mode: 'subscription',
  customer_email: 'pat@example.com',
  customer_details: { email: 'pat@example.com', phone: '', address: null },
  metadata: { plan: 'weekly', tokens_per_cycle: '4', wash_value: '12', customer_name: 'Pat' },
  collected_information: { shipping_details: { address: { line1: '1 Main St' } } },
  amount_total: 4000,
  currency: 'usd',
}

afterEach(() => {
  vi.clearAllMocks()
  getStripeSecretKey.mockReturnValue('sk_test_fake')
  getStripeWebhookSecret.mockReturnValue('whsec_fake')
})

describe('POST /api/stripe-webhook — session.mode branching', () => {
  it('routes a subscription checkout to the subscription handler only', async () => {
    constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: SUBSCRIPTION_SESSION },
    })
    sessionsRetrieve.mockResolvedValue(SUBSCRIPTION_SESSION)

    const res = await POST(makeReq())

    expect(res.status).toBe(200)
    expect(persistSubscriptionFromSession).toHaveBeenCalledTimes(1)
    // The one-time token path must not run: a subscription session carries no
    // package_size, and issuing token codes here would be wrong.
    expect(sendOwnerSaleNotification).not.toHaveBeenCalled()
  })

  it('does NOT create a fulfillment on the session event', async () => {
    // Stripe fires BOTH checkout.session.completed and invoice.paid for the
    // first payment. Fulfilling here as well would ship cycle one twice.
    constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: SUBSCRIPTION_SESSION },
    })
    sessionsRetrieve.mockResolvedValue(SUBSCRIPTION_SESSION)

    await POST(makeReq())

    expect(recordFulfillmentForInvoice).not.toHaveBeenCalled()
  })

  it('still runs the one-time token flow for a payment-mode session', async () => {
    constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: PAYMENT_SESSION },
    })
    sessionsRetrieve.mockResolvedValue(PAYMENT_SESSION)

    const res = await POST(makeReq())

    expect(res.status).toBe(200)
    expect(persistSubscriptionFromSession).not.toHaveBeenCalled()
    expect(sendOwnerSaleNotification).toHaveBeenCalledTimes(1)
    // 4-pack × qty 1 = 4 token codes.
    expect(sendOwnerSaleNotification.mock.calls[0][0].totalTokens).toBe(4)
  })
})

describe('POST /api/stripe-webhook — subscription events', () => {
  it('fulfils on invoice.paid and notifies the owner once', async () => {
    recordFulfillmentForInvoice.mockResolvedValue({
      isNew: true,
      tokensCount: 4,
      email: 'pat@example.com',
    })
    constructEvent.mockReturnValue({
      type: 'invoice.paid',
      data: { object: { id: 'in_1', amount_paid: 4000, currency: 'usd' } },
    })

    const res = await POST(makeReq())

    expect(res.status).toBe(200)
    expect(recordFulfillmentForInvoice).toHaveBeenCalledTimes(1)
    expect(sendOwnerSubscriptionNotification).toHaveBeenCalledTimes(1)
  })

  it('stays silent when the invoice was already fulfilled', async () => {
    // Redelivery, or a dunning retry landing on the same invoice.
    recordFulfillmentForInvoice.mockResolvedValue({
      isNew: false,
      tokensCount: 4,
      email: 'pat@example.com',
    })
    constructEvent.mockReturnValue({
      type: 'invoice.paid',
      data: { object: { id: 'in_1', amount_paid: 4000, currency: 'usd' } },
    })

    await POST(makeReq())

    expect(sendOwnerSubscriptionNotification).not.toHaveBeenCalled()
  })

  it('marks past_due on a failed payment and ships nothing', async () => {
    constructEvent.mockReturnValue({
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: 'in_2',
          parent: { subscription_details: { subscription: 'sub_9' } },
        },
      },
    })

    await POST(makeReq())

    expect(markSubscriptionStatus).toHaveBeenCalledWith('sub_9', 'past_due')
    expect(recordFulfillmentForInvoice).not.toHaveBeenCalled()
  })

  it('cancels on customer.subscription.deleted', async () => {
    constructEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_9', status: 'canceled' } },
    })

    await POST(makeReq())

    expect(markSubscriptionStatus).toHaveBeenCalledWith('sub_9', 'canceled')
  })

  it('syncs plan and status on customer.subscription.updated', async () => {
    constructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: { object: { id: 'sub_9', status: 'active', metadata: {} } },
    })

    await POST(makeReq())

    expect(syncSubscription).toHaveBeenCalledTimes(1)
  })

  it('syncs the shipping address when the customer edits it in the portal', async () => {
    constructEvent.mockReturnValue({
      type: 'customer.updated',
      data: { object: { id: 'cus_9', shipping: { address: { line1: '2 New St' } } } },
    })

    await POST(makeReq())

    expect(syncShippingAddress).toHaveBeenCalledTimes(1)
  })
})

describe('POST /api/stripe-webhook — guards', () => {
  it('rejects a bad signature with 400', async () => {
    constructEvent.mockImplementation(() => {
      throw new Error('no match')
    })

    const res = await POST(makeReq())

    expect(res.status).toBe(400)
    expect(recordFulfillmentForInvoice).not.toHaveBeenCalled()
  })

  it('rejects a request with no signature header', async () => {
    const res = await POST(
      new Request('https://spotless.test/api/stripe-webhook', {
        method: 'POST',
        body: '{}',
      }),
    )
    expect(res.status).toBe(400)
  })

  it('returns 500 when the webhook secret is unset', async () => {
    getStripeWebhookSecret.mockReturnValue(undefined)
    const res = await POST(makeReq())
    expect(res.status).toBe(500)
  })

  it('200s an unrelated event without doing anything', async () => {
    constructEvent.mockReturnValue({
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_1' } },
    })

    const res = await POST(makeReq())

    expect(res.status).toBe(200)
    expect(recordFulfillmentForInvoice).not.toHaveBeenCalled()
    expect(persistSubscriptionFromSession).not.toHaveBeenCalled()
  })
})
