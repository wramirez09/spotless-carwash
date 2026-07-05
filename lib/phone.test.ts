// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { nationalDigits, isValidUsPhone, formatUsPhone, normalizeUsPhone } from './phone'
import { subscribeBodySchema } from './schemas'

describe('nationalDigits', () => {
  it('strips non-digits and a leading country code', () => {
    expect(nationalDigits('(774) 246-3245')).toBe('7742463245')
    expect(nationalDigits('1 774 246 3245')).toBe('7742463245')
    expect(nationalDigits('+1 (774) 246-3245')).toBe('7742463245')
    expect(nationalDigits('774.246.3245')).toBe('7742463245')
  })
})

describe('isValidUsPhone', () => {
  it('accepts valid 10-digit US numbers (with or without formatting/country code)', () => {
    expect(isValidUsPhone('7742463245')).toBe(true)
    expect(isValidUsPhone('(774) 246-3245')).toBe(true)
    expect(isValidUsPhone('1-774-246-3245')).toBe(true)
  })

  it('rejects bad lengths and NANP-invalid area/exchange codes', () => {
    expect(isValidUsPhone('123')).toBe(false) // too short
    expect(isValidUsPhone('77424632451')).toBe(false) // 11 digits, not country code
    expect(isValidUsPhone('0742463245')).toBe(false) // area code starts 0
    expect(isValidUsPhone('1742463245')).toBe(false) // area code starts 1
    expect(isValidUsPhone('7740463245')).toBe(false) // exchange starts 0
    expect(isValidUsPhone('')).toBe(false)
  })
})

describe('formatUsPhone', () => {
  it('formats progressively as digits are entered', () => {
    expect(formatUsPhone('')).toBe('')
    expect(formatUsPhone('77')).toBe('(77')
    expect(formatUsPhone('774')).toBe('(774')
    expect(formatUsPhone('774246')).toBe('(774) 246')
    expect(formatUsPhone('7742463245')).toBe('(774) 246-3245')
  })

  it('ignores extra digits and stray characters', () => {
    expect(formatUsPhone('7742463245999')).toBe('(774) 246-3245')
    expect(formatUsPhone('774abc246')).toBe('(774) 246')
  })
})

describe('normalizeUsPhone', () => {
  it('returns canonical form for valid input, null otherwise', () => {
    expect(normalizeUsPhone('7742463245')).toBe('(774) 246-3245')
    expect(normalizeUsPhone('+1 774 246 3245')).toBe('(774) 246-3245')
    expect(normalizeUsPhone('123')).toBeNull()
  })
})

describe('subscribeBodySchema phone', () => {
  const base = { email: 'a@b.com' }

  it('allows a missing/empty phone', () => {
    expect(subscribeBodySchema.safeParse(base).success).toBe(true)
    const r = subscribeBodySchema.safeParse({ ...base, phone: '   ' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.phone).toBe('')
  })

  it('normalizes a valid phone to canonical form', () => {
    const r = subscribeBodySchema.safeParse({ ...base, phone: '7742463245' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.phone).toBe('(774) 246-3245')
  })

  it('rejects an invalid phone with a US-specific message', () => {
    const r = subscribeBodySchema.safeParse({ ...base, phone: '123' })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => /valid US phone/i.test(i.message))).toBe(true)
    }
  })
})
