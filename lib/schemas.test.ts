import { describe, expect, it } from 'vitest'
import { firstIssueMessage, subscriptionCheckoutBodySchema } from './schemas'

// Validation for POST /api/subscription-checkout. The plan id itself is checked
// in the route via isSubscriptionPlanId, so this schema only enforces presence
// and shape — see the route for the plan whitelist.

const VALID = {
  plan: 'weekly',
  washValue: '12',
  email: 'pat@example.com',
  name: 'Pat Driver',
  phone: '(708) 555-0100',
  mailingLine1: '7802 Madison St',
  mailingLine2: '',
  mailingCity: 'Forest Park',
  mailingState: 'il',
  mailingPostalCode: '60130',
  mailingListSubscribed: true,
}

function parse(overrides: Record<string, unknown> = {}) {
  return subscriptionCheckoutBodySchema.safeParse({ ...VALID, ...overrides })
}

describe('subscriptionCheckoutBodySchema', () => {
  it('accepts a complete body', () => {
    const result = parse()
    expect(result.success).toBe(true)
  })

  it('normalizes the phone to the canonical US format', () => {
    const result = parse({ phone: '7085550100' })
    expect(result.success && result.data.phone).toBe('(708) 555-0100')
  })

  it('trims surrounding whitespace on text fields', () => {
    const result = parse({ name: '  Pat Driver  ', email: ' pat@example.com ' })
    expect(result.success && result.data.name).toBe('Pat Driver')
    expect(result.success && result.data.email).toBe('pat@example.com')
  })

  it('treats a blank phone as allowed — Stripe collects one too', () => {
    const result = parse({ phone: '' })
    expect(result.success).toBe(true)
    expect(result.success && result.data.phone).toBe('')
  })

  it('rejects a phone that is present but not a valid US number', () => {
    const result = parse({ phone: '12345' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(firstIssueMessage(result.error)).toBe(
        'Please enter a valid US phone number.',
      )
    }
  })

  it('requires an email that looks like an email', () => {
    expect(parse({ email: '' }).success).toBe(false)
    expect(parse({ email: 'not-an-email' }).success).toBe(false)
  })

  it('requires a name', () => {
    const result = parse({ name: '   ' })
    expect(result.success).toBe(false)
    if (!result.success) expect(firstIssueMessage(result.error)).toBe('Name required')
  })

  it('requires a token denomination', () => {
    const result = parse({ washValue: '' })
    expect(result.success).toBe(false)
    if (!result.success) expect(firstIssueMessage(result.error)).toBe('Choose a token')
  })

  it('requires a complete mailing address', () => {
    for (const field of ['mailingLine1', 'mailingCity', 'mailingState', 'mailingPostalCode']) {
      const result = parse({ [field]: '  ' })
      expect(result.success, `${field} should be required`).toBe(false)
      if (!result.success) {
        expect(firstIssueMessage(result.error)).toBe('Complete mailing address required')
      }
    }
  })

  it('allows a blank address line 2', () => {
    expect(parse({ mailingLine2: '' }).success).toBe(true)
  })

  it('uppercases the state so it is stored consistently', () => {
    const result = parse({ mailingState: 'il' })
    expect(result.success && result.data.mailingState).toBe('IL')
  })

  it('requires a plan', () => {
    const result = parse({ plan: '' })
    expect(result.success).toBe(false)
    if (!result.success) expect(firstIssueMessage(result.error)).toBe('Choose a plan')
  })

  it('only opts into marketing on a literal true', () => {
    // A truthy string from a malformed client must not be read as consent.
    expect(parse({ mailingListSubscribed: 'yes' }).success).toBe(true)
    const result = parse({ mailingListSubscribed: 'yes' })
    expect(result.success && result.data.mailingListSubscribed).toBe(false)

    const missing = parse({ mailingListSubscribed: undefined })
    expect(missing.success && missing.data.mailingListSubscribed).toBe(false)
  })

  it('coerces non-string junk into a required-field error, not a type crash', () => {
    const result = parse({ name: 42 })
    expect(result.success).toBe(false)
    if (!result.success) expect(firstIssueMessage(result.error)).toBe('Name required')
  })
})
