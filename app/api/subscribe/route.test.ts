// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'

// --- Mocks ----------------------------------------------------------------
// The route delegates the real work to subscribeToPromotions; here we stub it
// so we can assert the route's job: input validation and the mapping from a
// SubscribeResult to the right HTTP status + user-facing message/copy.

const { subscribeToPromotions } = vi.hoisted(() => ({
  subscribeToPromotions: vi.fn(),
}))

vi.mock('@/lib/promotions', () => ({ subscribeToPromotions }))

import { POST } from './route'

// --- Helpers --------------------------------------------------------------

function makeReq(body: unknown, { raw }: { raw?: string } = {}) {
  return new Request('https://spotless.test/api/subscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: raw ?? JSON.stringify(body),
  })
}

afterEach(() => vi.clearAllMocks())

// --- Bad input ------------------------------------------------------------

describe('POST /api/subscribe — bad input', () => {
  it('rejects non-JSON body with 400', async () => {
    const res = await POST(makeReq(undefined, { raw: 'not json' }))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid request body.' })
    expect(subscribeToPromotions).not.toHaveBeenCalled()
  })

  it('rejects a missing email with the schema message', async () => {
    const res = await POST(makeReq({ name: 'Jo' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('Email is required.')
    expect(subscribeToPromotions).not.toHaveBeenCalled()
  })

  it('rejects a malformed email before hitting the service', async () => {
    const res = await POST(makeReq({ email: 'not-an-email' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('Please enter a valid email address.')
    expect(subscribeToPromotions).not.toHaveBeenCalled()
  })
})

// --- Service outcome mapping ---------------------------------------------

describe('POST /api/subscribe — success outcomes', () => {
  it('passes normalized fields through to the service', async () => {
    subscribeToPromotions.mockResolvedValue({ ok: true, outcome: 'subscribed' })
    await POST(
      makeReq({
        email: 'a@b.com',
        name: 'Jo',
        phone: '7742463245',
        source: 'footer',
        confirmResubscribe: true,
      }),
    )
    expect(subscribeToPromotions).toHaveBeenCalledWith({
      email: 'a@b.com',
      name: 'Jo',
      // Normalized to canonical US form by the schema.
      phone: '(774) 246-3245',
      source: 'footer',
      confirmResubscribe: true,
    })
  })

  it('defaults blank optionals to null and source to "website"', async () => {
    subscribeToPromotions.mockResolvedValue({ ok: true, outcome: 'subscribed' })
    await POST(makeReq({ email: 'a@b.com' }))
    expect(subscribeToPromotions).toHaveBeenCalledWith({
      email: 'a@b.com',
      name: null,
      phone: null,
      source: 'website',
      confirmResubscribe: false,
    })
  })

  it.each([
    ['subscribed', "You're on the list — thanks for subscribing!"],
    ['confirm_resubscribe', 'You previously unsubscribed. Want to resubscribe?'],
    ['resubscribed', "Welcome back — you're resubscribed."],
    ['already_subscribed', "You're already on our list — thanks!"],
  ] as const)('returns 200 + copy for outcome %s', async (outcome, message) => {
    subscribeToPromotions.mockResolvedValue({ ok: true, outcome })
    const res = await POST(makeReq({ email: 'a@b.com' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, outcome, message })
  })
})

describe('POST /api/subscribe — failure outcomes', () => {
  it('maps invalid_email to 400', async () => {
    subscribeToPromotions.mockResolvedValue({ ok: false, reason: 'invalid_email' })
    const res = await POST(makeReq({ email: 'a@b.com' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('Please enter a valid email address.')
  })

  it('maps an ops misconfig (unconfigured) to 503, not 500', async () => {
    subscribeToPromotions.mockResolvedValue({ ok: false, reason: 'unconfigured' })
    const res = await POST(makeReq({ email: 'a@b.com' }))
    expect(res.status).toBe(503)
    expect((await res.json()).error).toMatch(/temporarily unavailable/i)
  })

  it('maps a generic error to 500', async () => {
    subscribeToPromotions.mockResolvedValue({ ok: false, reason: 'error' })
    const res = await POST(makeReq({ email: 'a@b.com' }))
    expect(res.status).toBe(500)
    expect((await res.json()).error).toMatch(/something went wrong/i)
  })
})
