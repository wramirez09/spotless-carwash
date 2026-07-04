// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { parseAdminEmails, isAdminEmail } from './adminAccess'

describe('parseAdminEmails', () => {
  it('returns an empty list for unset/empty input', () => {
    expect(parseAdminEmails(undefined)).toEqual([])
    expect(parseAdminEmails('')).toEqual([])
    expect(parseAdminEmails('   ')).toEqual([])
  })

  it('splits on commas and whitespace, lowercasing and trimming', () => {
    expect(parseAdminEmails('A@B.com, c@d.com')).toEqual(['a@b.com', 'c@d.com'])
    expect(parseAdminEmails(' Joe@X.com \n sam@y.com ')).toEqual(['joe@x.com', 'sam@y.com'])
  })
})

describe('isAdminEmail', () => {
  const list = 'joe@spotlessautowash.com, will@example.com'

  it('matches allowlisted emails case-insensitively', () => {
    expect(isAdminEmail('joe@spotlessautowash.com', list)).toBe(true)
    expect(isAdminEmail('JOE@SpotlessAutoWash.com', list)).toBe(true)
    expect(isAdminEmail('  will@example.com ', list)).toBe(true)
  })

  it('rejects non-allowlisted or missing emails', () => {
    expect(isAdminEmail('stranger@evil.com', list)).toBe(false)
    expect(isAdminEmail(null, list)).toBe(false)
    expect(isAdminEmail(undefined, list)).toBe(false)
    expect(isAdminEmail('', list)).toBe(false)
  })

  it('fails closed when the allowlist is empty', () => {
    expect(isAdminEmail('joe@spotlessautowash.com', '')).toBe(false)
    expect(isAdminEmail('joe@spotlessautowash.com', undefined)).toBe(false)
  })
})
