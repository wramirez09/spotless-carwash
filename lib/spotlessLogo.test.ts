// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { SPOTLESS_LOGO_BASE64 } from './spotlessLogo'

// Inlined so the owner-notification email renders without a hosted asset. If
// this ever got truncated the email would show a broken image, which is the
// kind of thing nobody notices until a client mentions it.

describe('SPOTLESS_LOGO_BASE64', () => {
  it('is valid standalone base64 with no data: prefix', () => {
    // Resend takes the raw base64; a data: URI here would not render.
    expect(SPOTLESS_LOGO_BASE64).not.toMatch(/^data:/)
    expect(SPOTLESS_LOGO_BASE64).toMatch(/^[A-Za-z0-9+/]+={0,2}$/)
  })

  it('decodes to a PNG', () => {
    const bytes = Buffer.from(SPOTLESS_LOGO_BASE64, 'base64')
    expect(bytes.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
  })

  it('is a complete file, not a truncated one', () => {
    const bytes = Buffer.from(SPOTLESS_LOGO_BASE64, 'base64')
    // PNGs end with an IEND chunk.
    expect(bytes.subarray(-8, -4).toString('ascii')).toBe('IEND')
  })
})
