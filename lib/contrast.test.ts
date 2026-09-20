// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { AA_NORMAL, accessiblePair, contrastRatio, meetsAA, relativeLuminance } from './contrast'

// These numbers are the WCAG reference values — if the maths drifts, the dial
// silently starts shipping unreadable labels again.

describe('relativeLuminance', () => {
  it('matches the WCAG reference points', () => {
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5)
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5)
  })

  it('returns null for an unparseable colour', () => {
    expect(relativeLuminance('rebeccapurple')).toBeNull()
    expect(relativeLuminance('var(--brand)')).toBeNull()
  })
})

describe('contrastRatio', () => {
  it('is 21:1 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 4)
  })

  it('is 1:1 for a colour against itself', () => {
    expect(contrastRatio('#e6157a', '#e6157a')).toBeCloseTo(1, 5)
  })

  it('is symmetric', () => {
    expect(contrastRatio('#ffffff', '#f08a17')).toBeCloseTo(
      contrastRatio('#f08a17', '#ffffff')!,
      6,
    )
  })

  it('accepts shorthand hex and a missing #', () => {
    expect(contrastRatio('#fff', '000')).toBeCloseTo(21, 4)
  })

  it('reproduces the failures Lighthouse reported on the dial', () => {
    // Pinned so the regression is recognisable if it ever comes back.
    expect(contrastRatio('#ffffff', '#e6157a')).toBeCloseTo(4.42, 1)
    expect(contrastRatio('#ffffff', '#f08a17')).toBeCloseTo(2.51, 1)
    expect(contrastRatio('#ffffff', '#3fb5e6')).toBeCloseTo(2.34, 1)
  })

  it('returns null when either colour is unparseable', () => {
    expect(contrastRatio('#fff', 'not-a-colour')).toBeNull()
  })
})

describe('meetsAA', () => {
  it('uses 4.5:1 as the default floor', () => {
    expect(AA_NORMAL).toBe(4.5)
    expect(meetsAA('#ffffff', '#047857')).toBe(true)
    expect(meetsAA('#ffffff', '#10b981')).toBe(false)
  })

  it('is false when a colour cannot be parsed', () => {
    expect(meetsAA('#ffffff', 'currentColor')).toBe(false)
  })
})

describe('accessiblePair', () => {
  it('leaves an already-passing pair untouched', () => {
    // Nothing should be "corrected" that was fine to begin with.
    expect(accessiblePair('#0A2A6B', '#ffffff')).toEqual({ bg: '#0A2A6B', fg: '#ffffff' })
  })

  it('keeps the background and swaps the text when that is enough', () => {
    // The background mirrors the physical dial, so it changes last.
    const { bg, fg } = accessiblePair('#f08a17', '#ffffff')
    expect(bg).toBe('#f08a17')
    expect(meetsAA(fg!, bg!)).toBe(true)
  })

  it('picks ink over white on a light background', () => {
    const { fg } = accessiblePair('#3fb5e6', '#ffffff')
    expect(fg).toBe('#08183F')
  })

  it('darkens the background only when no text colour passes', () => {
    // #e6157a clears neither white (4.42) nor ink (3.92).
    const { bg, fg } = accessiblePair('#e6157a', '#ffffff')
    expect(bg).not.toBe('#e6157a')
    expect(fg).toBe('#ffffff')
    expect(meetsAA(fg!, bg!)).toBe(true)
  })

  it('preserves hue when it darkens', () => {
    // Scaling all three channels keeps the colour recognisably the same pink.
    const { bg } = accessiblePair('#e6157a', '#ffffff')
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(bg!.slice(i, i + 2), 16))
    expect(r).toBeGreaterThan(g)
    expect(r).toBeGreaterThan(b)
    expect(b).toBeGreaterThan(g)
  })

  it('changes the background as little as it can', () => {
    // A single darkening step should be enough for a near-miss like this one.
    const { bg } = accessiblePair('#e6157a', '#ffffff')
    const r = parseInt(bg!.slice(1, 3), 16)
    expect(r).toBeGreaterThan(0xb0)
  })

  it('guarantees AA for every colour in the authored dial palette', () => {
    for (const bg of ['#e6157a', '#f08a17', '#3fb5e6', '#1B4FD9', '#08183F', '#4a4a52']) {
      const pair = accessiblePair(bg, '#ffffff')
      expect(meetsAA(pair.fg!, pair.bg!)).toBe(true)
    }
  })

  it('handles an undefined background', () => {
    expect(accessiblePair(undefined, '#fff')).toEqual({ bg: undefined, fg: '#fff' })
  })

  it('passes through a value it cannot parse instead of throwing', () => {
    // An editor could paste a CSS variable or a named colour.
    expect(accessiblePair('var(--brand)', '#fff')).toEqual({
      bg: 'var(--brand)',
      fg: '#fff',
    })
  })

  it('works with no preferred foreground', () => {
    const { bg, fg } = accessiblePair('#f08a17')
    expect(meetsAA(fg!, bg!)).toBe(true)
  })

  it('honours a stricter minimum', () => {
    const { bg, fg } = accessiblePair('#f08a17', '#ffffff', 7)
    expect(contrastRatio(fg!, bg!)).toBeGreaterThanOrEqual(7)
  })
})
