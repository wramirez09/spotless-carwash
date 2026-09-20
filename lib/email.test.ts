// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Owner notifications fire from the Stripe webhook. Two contracts matter:
//
//  1. They are BEST EFFORT. A missing key or a Resend outage must never throw,
//     because the webhook would then 500 and Stripe would retry the whole
//     fulfillment — double-shipping tokens.
//  2. Customer-supplied values land in an HTML email, so they must be escaped.

const { send } = vi.hoisted(() => ({ send: vi.fn() }))

vi.mock('resend', () => ({
  Resend: class {
    emails = { send }
  },
}))

import { sendOwnerSaleNotification, sendOwnerSubscriptionNotification } from './email'

function sale(overrides: Record<string, unknown> = {}) {
  return {
    customerName: 'Ada Lovelace',
    customerEmail: 'ada@example.com',
    customerPhone: '(708) 555-0111',
    address: {
      line1: '123 Madison St',
      line2: null,
      city: 'Forest Park',
      state: 'IL',
      postalCode: '60130',
      country: 'US',
    },
    mode: 'pack',
    washValue: '12',
    quantity: 2,
    totalTokens: 8,
    amountTotal: 9600,
    currency: 'usd',
    codes: ['ABC123', 'DEF456'],
    sessionId: 'cs_test_1',
    ...overrides,
  }
}

function subscription(overrides: Record<string, unknown> = {}) {
  return {
    kind: 'new' as const,
    customerEmail: 'ada@example.com',
    customerName: 'Ada Lovelace',
    plan: 'frequent',
    tokensCount: 8,
    amountTotal: 7600,
    currency: 'usd',
    reference: 'cs_sub_1',
    address: null,
    ...overrides,
  }
}

/** The payload handed to Resend by the last call. */
const sent = () => send.mock.calls[0][0]

beforeEach(() => {
  vi.clearAllMocks()
  send.mockResolvedValue({ error: null })
  vi.stubEnv('RESEND_API_KEY', 'rs_test')
  vi.stubEnv('EMAIL_FROM', 'Spotless <hi@spotlessautowash.com>')
  vi.stubEnv('OWNER_NOTIFICATION_EMAIL', 'joe@spotlessautowash.com')
  vi.stubEnv('VERCEL_ENV', 'production')
  vi.stubEnv('DEV_OWNER_NOTIFICATION_EMAIL', '')
})

afterEach(() => vi.unstubAllEnvs())

describe('sendOwnerSaleNotification', () => {
  it('sends to the owner from the configured sender', async () => {
    await sendOwnerSaleNotification(sale())
    expect(sent()).toMatchObject({
      to: 'joe@spotlessautowash.com',
      from: 'Spotless <hi@spotlessautowash.com>',
      replyTo: 'ada@example.com',
    })
  })

  it('puts the amount and customer in the subject', async () => {
    await sendOwnerSaleNotification(sale())
    expect(sent().subject).toContain('$96.00')
    expect(sent().subject).toContain('Ada Lovelace')
  })

  it('describes a 4-pack and a single differently', async () => {
    await sendOwnerSaleNotification(sale())
    expect(sent().html).toContain('4-pack')

    send.mockClear()
    await sendOwnerSaleNotification(sale({ mode: 'single' }))
    expect(sent().html).toContain('single wash token')
  })

  it('includes the token codes to mail', async () => {
    await sendOwnerSaleNotification(sale())
    expect(sent().html).toContain('ABC123')
    expect(sent().html).toContain('DEF456')
  })

  it('renders the shipping address', async () => {
    await sendOwnerSaleNotification(sale())
    expect(sent().html).toContain('123 Madison St')
    expect(sent().html).toContain('Forest Park, IL 60130')
  })

  it('shows a dash rather than a blank block with no address', async () => {
    await sendOwnerSaleNotification(sale({ address: null }))
    expect(sent().html).toContain('—')
  })

  it('escapes HTML in customer-supplied values', async () => {
    // The name comes from Stripe Checkout, i.e. from the customer.
    await sendOwnerSaleNotification(
      sale({ customerName: '<script>alert(1)</script>' }),
    )
    expect(sent().html).not.toContain('<script>')
    expect(sent().html).toContain('&lt;script&gt;')
  })

  it('escapes an address that contains markup', async () => {
    await sendOwnerSaleNotification(
      sale({ address: { line1: '<b>123</b> Madison', city: 'Forest Park' } }),
    )
    expect(sent().html).toContain('&lt;b&gt;123&lt;/b&gt;')
  })

  it('strips punctuation from the phone number in the tel: link', async () => {
    await sendOwnerSaleNotification(sale())
    expect(sent().html).toContain('tel:7085550111')
  })

  it('falls back to a dash when the amount is unknown', async () => {
    await sendOwnerSaleNotification(sale({ amountTotal: null }))
    expect(sent().subject).toContain('—')
  })

  it('honours a non-USD currency', async () => {
    await sendOwnerSaleNotification(sale({ currency: 'eur' }))
    expect(sent().subject).toMatch(/€/)
  })

  it('attaches the logo inline so the email is self-contained', async () => {
    await sendOwnerSaleNotification(sale())
    expect(sent().attachments[0]).toMatchObject({
      filename: 'spotless-logo.png',
      contentType: 'image/png',
      contentId: 'spotless-logo',
    })
  })

  it('sends a plain-text part alongside the HTML', async () => {
    await sendOwnerSaleNotification(sale())
    expect(typeof sent().text).toBe('string')
    expect(sent().text.length).toBeGreaterThan(0)
  })

  it('does nothing when Resend is not configured', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    await expect(sendOwnerSaleNotification(sale())).resolves.toBeUndefined()
    expect(send).not.toHaveBeenCalled()
  })

  it('swallows a Resend error so the webhook still returns 200', async () => {
    // Throwing here would make Stripe retry and ship the tokens twice.
    send.mockResolvedValue({ error: { message: 'rate limited' } })
    await expect(sendOwnerSaleNotification(sale())).resolves.toBeUndefined()
  })

  it('omits replyTo when the customer email is missing', async () => {
    await sendOwnerSaleNotification(sale({ customerEmail: '' }))
    expect(sent().replyTo).toBeUndefined()
  })
})

describe('owner recipient routing', () => {
  it('uses the dev recipient outside Vercel Production', async () => {
    // Test purchases must not email the real owner.
    vi.stubEnv('VERCEL_ENV', 'preview')
    vi.stubEnv('DEV_OWNER_NOTIFICATION_EMAIL', 'will@example.com')
    await sendOwnerSaleNotification(sale())
    expect(sent().to).toBe('will@example.com')
  })

  it('uses the real owner on Vercel Production even if a dev address is set', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('DEV_OWNER_NOTIFICATION_EMAIL', 'will@example.com')
    await sendOwnerSaleNotification(sale())
    expect(sent().to).toBe('joe@spotlessautowash.com')
  })

  it('falls back to the default owner address when none is configured', async () => {
    vi.stubEnv('OWNER_NOTIFICATION_EMAIL', '')
    await sendOwnerSaleNotification(sale())
    expect(sent().to).toBe('joe@spotlessautowash.com')
  })
})

describe('sendOwnerSubscriptionNotification', () => {
  it('distinguishes a new signup from a renewal', async () => {
    await sendOwnerSubscriptionNotification(subscription({ kind: 'new' }))
    const newSubject = sent().subject

    send.mockClear()
    await sendOwnerSubscriptionNotification(subscription({ kind: 'renewal' }))
    expect(sent().subject).not.toBe(newSubject)
  })

  it('states how many tokens to mail', async () => {
    await sendOwnerSubscriptionNotification(subscription({ tokensCount: 8 }))
    expect(sent().html).toContain('8')
  })

  it('escapes customer-supplied values', async () => {
    await sendOwnerSubscriptionNotification(
      subscription({ customerName: '<img onerror=x>' }),
    )
    expect(sent().html).not.toContain('<img onerror')
  })

  it('renders the shipping address when present', async () => {
    await sendOwnerSubscriptionNotification(
      subscription({ address: { line1: '9 Roosevelt Rd', city: 'Forest Park', state: 'IL' } }),
    )
    expect(sent().html).toContain('9 Roosevelt Rd')
  })

  it('does nothing when Resend is not configured', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    await expect(
      sendOwnerSubscriptionNotification(subscription()),
    ).resolves.toBeUndefined()
    expect(send).not.toHaveBeenCalled()
  })

  it('swallows a Resend error so the webhook still returns 200', async () => {
    send.mockResolvedValue({ error: { message: 'down' } })
    await expect(
      sendOwnerSubscriptionNotification(subscription()),
    ).resolves.toBeUndefined()
  })

  it('handles a missing amount without rendering NaN', async () => {
    await sendOwnerSubscriptionNotification(subscription({ amountTotal: null }))
    expect(sent().html).not.toContain('NaN')
  })
})
