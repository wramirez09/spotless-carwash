// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// --- Mocks ----------------------------------------------------------------
// The route talks to Stripe and reads env-resolved IDs. We stub both so the
// tests assert on the *arguments* the route builds (the part 091d5fa changed)
// without any network calls.

const {
  sessionsCreate,
  customersCreate,
  couponsRetrieve,
  couponsCreate,
  getStripeSecretKey,
  getActiveSeasonalSale,
} = vi.hoisted(() => ({
  sessionsCreate: vi.fn(),
  customersCreate: vi.fn(),
  couponsRetrieve: vi.fn(),
  couponsCreate: vi.fn(),
  getStripeSecretKey: vi.fn<() => string | undefined>(() => 'sk_test_fake'),
  getActiveSeasonalSale: vi.fn<
    () => { id: string; discountMetadata: string } | null
  >(() => null),
}))

vi.mock('stripe', () => ({
  default: class FakeStripe {
    checkout = { sessions: { create: sessionsCreate } }
    customers = { create: customersCreate }
    coupons = { retrieve: couponsRetrieve, create: couponsCreate }
  },
}))

vi.mock('@/lib/stripeEnv', () => ({ getStripeSecretKey }))

vi.mock('@/lib/stripePricing', () => ({
  PACK_PRICES: { '8': 'price_pack_8', '9': 'price_pack_9', '10': 'price_pack_10', '12': 'price_pack_12' },
  SINGLE_PRICES: {
    '8': 'price_single_8',
    '9': 'price_single_9',
    '10': 'price_single_10',
    '12': 'price_single_12',
  },
  activePackCouponId: () => 'coupon_test',
  getActiveSeasonalSale,
}))

import { POST } from './route'

// --- Helpers --------------------------------------------------------------

function makeReq(body: unknown, { origin = 'https://spotless.test', raw }: { origin?: string | null; raw?: string } = {}) {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (origin) headers.origin = origin
  return new Request('https://spotless.test/api/checkout', {
    method: 'POST',
    headers,
    body: raw ?? JSON.stringify(body),
  })
}

// Mailing address — required since tokens are physically shipped there.
const MAILING = {
  mailingLine1: '123 Roosevelt Rd',
  mailingCity: 'Forest Park',
  mailingState: 'IL',
  mailingPostalCode: '60130',
}

const VALID_PACK = {
  package: '12',
  mode: 'pack',
  quantity: 2,
  email: 'joe@example.com',
  name: 'Joe',
  phone: '7087712945',
  ...MAILING,
}

const VALID_SINGLE = {
  mode: 'single',
  washValue: 10,
  quantity: 1,
  email: 'joe@example.com',
  name: 'Joe',
  phone: '7087712945',
  ...MAILING,
}

async function callPost(body: unknown, opts?: Parameters<typeof makeReq>[1]) {
  const res = await POST(makeReq(body, opts))
  const json = await res.json()
  return { res, json }
}

const lastSession = () => sessionsCreate.mock.calls.at(-1)?.[0]

// --- Tests ----------------------------------------------------------------

// Default coupon-mock world: the base coupon exists ($5 off), derived
// `<base>_x<qty>` coupons don't yet, and creating one succeeds.
const BASE_COUPON = {
  id: 'coupon_test',
  amount_off: 500,
  currency: 'usd',
  name: '$5 Off 4-Packs',
  redeem_by: null,
}

beforeEach(() => {
  sessionsCreate.mockReset().mockResolvedValue({ url: 'https://checkout.stripe.com/c/pay/test' })
  customersCreate.mockReset()
  couponsRetrieve.mockReset().mockImplementation(async (id: string) => {
    if (id === BASE_COUPON.id) return BASE_COUPON
    throw Object.assign(new Error(`No such coupon: ${id}`), { code: 'resource_missing' })
  })
  couponsCreate.mockReset().mockImplementation(async (params: { id: string }) => params)
  getStripeSecretKey.mockReturnValue('sk_test_fake')
  getActiveSeasonalSale.mockReturnValue(null)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('POST /api/checkout — validation', () => {
  it('returns 500 when Stripe is not configured', async () => {
    getStripeSecretKey.mockReturnValue(undefined)
    const { res, json } = await callPost(VALID_PACK)
    expect(res.status).toBe(500)
    expect(json.error).toBe('Stripe not configured')
  })

  it('returns 500 when no site URL can be resolved', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    vi.stubEnv('VERCEL_URL', '')
    const { res, json } = await callPost(VALID_PACK, { origin: null })
    expect(res.status).toBe(500)
    expect(json.error).toBe('Site URL missing')
  })

  it('returns 400 on invalid JSON', async () => {
    const { res, json } = await callPost(undefined, { raw: 'not-json' })
    expect(res.status).toBe(400)
    expect(json.error).toBe('Invalid JSON')
  })

  it('returns 400 on a bad pack package', async () => {
    const { res, json } = await callPost({ ...VALID_PACK, package: '7' })
    expect(res.status).toBe(400)
    expect(json.error).toBe('Bad package')
  })

  it('returns 400 on a bad single wash value', async () => {
    const { res, json } = await callPost({ ...VALID_SINGLE, washValue: 99 })
    expect(res.status).toBe(400)
    expect(json.error).toBe('Bad wash value')
  })

  it('returns 400 on an invalid email', async () => {
    const { res, json } = await callPost({ ...VALID_PACK, email: 'not-an-email' })
    expect(res.status).toBe(400)
    expect(json.error).toBe('Valid email required')
  })

  it('returns 400 when name is missing', async () => {
    const { res, json } = await callPost({ ...VALID_PACK, name: '   ' })
    expect(res.status).toBe(400)
    expect(json.error).toBe('Name required')
  })

  it('returns 400 when phone is missing', async () => {
    const { res, json } = await callPost({ ...VALID_PACK, phone: '' })
    expect(res.status).toBe(400)
    expect(json.error).toBe('Phone required')
  })

  it.each([
    ['mailingLine1', { mailingLine1: '   ' }],
    ['mailingCity', { mailingCity: '' }],
    ['mailingState', { mailingState: '' }],
    ['mailingPostalCode', { mailingPostalCode: '' }],
  ])('returns 400 when %s is missing from the mailing address', async (_field, override) => {
    const { res, json } = await callPost({ ...VALID_PACK, ...override })
    expect(res.status).toBe(400)
    expect(json.error).toBe('Complete mailing address required')
  })

  it('returns 500 with the Stripe message when session.create throws', async () => {
    sessionsCreate.mockRejectedValueOnce(new Error('boom'))
    const { res, json } = await callPost(VALID_PACK)
    expect(res.status).toBe(500)
    expect(json.error).toBe('boom')
  })
})

describe('POST /api/checkout — no orphan customers (091d5fa)', () => {
  it('never pre-creates a Stripe Customer', async () => {
    await callPost(VALID_PACK)
    expect(customersCreate).not.toHaveBeenCalled()
  })

  it('defers customer creation to a completed checkout', async () => {
    await callPost(VALID_PACK)
    const session = lastSession()
    expect(session.customer_email).toBe('joe@example.com')
    expect(session.customer_creation).toBe('always')
    // The old flow passed a pre-created `customer` id — it must be gone.
    expect(session.customer).toBeUndefined()
  })
})

describe('POST /api/checkout — token-count metadata (091d5fa)', () => {
  it('sets package_size to 4 for a pack (tokens per unit, not the wash value)', async () => {
    await callPost({ ...VALID_PACK, package: '12' })
    const { metadata } = lastSession()
    expect(metadata.package_size).toBe('4')
    expect(metadata.wash_value).toBe('12')
    expect(metadata.mode).toBe('pack')
  })

  it('sets package_size to 1 for a single', async () => {
    await callPost(VALID_SINGLE)
    const { metadata } = lastSession()
    expect(metadata.package_size).toBe('1')
    expect(metadata.wash_value).toBe('10')
    expect(metadata.mode).toBe('single')
  })
})

describe('POST /api/checkout — mailing address metadata', () => {
  it('carries the mailing address into session metadata for the webhook', async () => {
    await callPost(VALID_PACK)
    const { metadata } = lastSession()
    expect(metadata.mail_line1).toBe('123 Roosevelt Rd')
    expect(metadata.mail_city).toBe('Forest Park')
    expect(metadata.mail_state).toBe('IL')
    expect(metadata.mail_postal_code).toBe('60130')
  })

  it('normalizes the state to uppercase', async () => {
    await callPost({ ...VALID_PACK, mailingState: 'il' })
    expect(lastSession().metadata.mail_state).toBe('IL')
  })

  it('records the mailing-list opt-in as a string flag in metadata', async () => {
    await callPost({ ...VALID_PACK, mailingListSubscribed: true })
    expect(lastSession().metadata.mail_list_subscribed).toBe('true')
  })

  it('defaults the mailing-list flag to false when omitted', async () => {
    await callPost(VALID_PACK)
    expect(lastSession().metadata.mail_list_subscribed).toBe('false')
  })
})

describe('POST /api/checkout — discounts & quantity', () => {
  it('auto-applies the pack coupon and records the 5-off discount outside the sale', async () => {
    getActiveSeasonalSale.mockReturnValue(null)
    await callPost({ ...VALID_PACK, quantity: 1 })
    const session = lastSession()
    expect(session.discounts).toEqual([{ coupon: 'coupon_test' }])
    expect(session.allow_promotion_codes).toBeUndefined()
    expect(session.metadata.pack_discount).toBe('5_off')
    // Single-pack orders use the base coupon as-is — no derivation round-trip.
    expect(couponsCreate).not.toHaveBeenCalled()
  })

  it('creates and applies a quantity-scaled coupon for multi-pack orders', async () => {
    await callPost({ ...VALID_PACK, quantity: 2 })
    expect(couponsCreate).toHaveBeenCalledWith({
      id: 'coupon_test_x2',
      amount_off: 1000,
      currency: 'usd',
      duration: 'once',
      name: '$5 Off 4-Packs ×2',
    })
    expect(lastSession().discounts).toEqual([{ coupon: 'coupon_test_x2' }])
  })

  it('carries the base coupon expiry onto the derived coupon (seasonal sale)', async () => {
    couponsRetrieve.mockImplementation(async (id: string) => {
      if (id === BASE_COUPON.id) return { ...BASE_COUPON, amount_off: 1000, redeem_by: 1782172740 }
      throw Object.assign(new Error('missing'), { code: 'resource_missing' })
    })
    await callPost({ ...VALID_PACK, quantity: 3 })
    expect(couponsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'coupon_test_x3', amount_off: 3000, redeem_by: 1782172740 }),
    )
  })

  it('reuses an existing quantity-scaled coupon without creating a new one', async () => {
    couponsRetrieve.mockResolvedValue({ id: 'coupon_test_x2', amount_off: 1000 })
    await callPost({ ...VALID_PACK, quantity: 2 })
    expect(couponsCreate).not.toHaveBeenCalled()
    expect(lastSession().discounts).toEqual([{ coupon: 'coupon_test_x2' }])
  })

  it('uses the derived coupon when creation races (resource_already_exists)', async () => {
    couponsCreate.mockRejectedValue(
      Object.assign(new Error('Coupon already exists.'), { code: 'resource_already_exists' }),
    )
    await callPost({ ...VALID_PACK, quantity: 2 })
    expect(lastSession().discounts).toEqual([{ coupon: 'coupon_test_x2' }])
  })

  it('falls back to the base coupon when derivation fails, and checkout still succeeds', async () => {
    couponsCreate.mockRejectedValue(new Error('stripe is down'))
    const { res, json } = await callPost({ ...VALID_PACK, quantity: 2 })
    expect(res.status).toBe(200)
    expect(json.url).toBe('https://checkout.stripe.com/c/pay/test')
    expect(lastSession().discounts).toEqual([{ coupon: 'coupon_test' }])
  })

  it('records the seasonal-sale discount on packs during a sale window', async () => {
    getActiveSeasonalSale.mockReturnValue({
      id: 'labor-day-2026',
      discountMetadata: '10_off_labor_day_2026',
    })
    await callPost(VALID_PACK)
    expect(lastSession().metadata.pack_discount).toBe('10_off_labor_day_2026')
  })

  it('leaves pack_discount at 5_off when no seasonal sale is running', async () => {
    getActiveSeasonalSale.mockReturnValue(null)
    await callPost(VALID_PACK)
    expect(lastSession().metadata.pack_discount).toBe('5_off')
  })

  it('uses promo codes (not the pack coupon) for singles and leaves pack_discount empty', async () => {
    await callPost(VALID_SINGLE)
    const session = lastSession()
    expect(session.allow_promotion_codes).toBe(true)
    expect(session.discounts).toBeUndefined()
    expect(session.metadata.pack_discount).toBe('')
  })

  it('uses the single price id for single mode', async () => {
    await callPost({ ...VALID_SINGLE, washValue: 9 })
    expect(lastSession().line_items).toEqual([{ price: 'price_single_9', quantity: 1 }])
  })

  it('clamps quantity to the 1..20 range', async () => {
    await callPost({ ...VALID_PACK, quantity: 999 })
    expect(lastSession().line_items[0].quantity).toBe(20)
    expect(lastSession().metadata.quantity).toBe('20')

    await callPost({ ...VALID_PACK, quantity: 0 })
    expect(lastSession().line_items[0].quantity).toBe(1)
  })

  it('strips a trailing slash from the resolved origin in redirect URLs', async () => {
    await callPost(VALID_PACK, { origin: 'https://spotless.test/' })
    const session = lastSession()
    expect(session.success_url).toBe(
      'https://spotless.test/buy-tokens/success?session_id={CHECKOUT_SESSION_ID}',
    )
    expect(session.cancel_url).toBe('https://spotless.test/buy-tokens')
  })
})
