// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Opening hours appear in the nav, footer and local-business schema. Sanity
// being empty or unreachable must never render a blank where the hours go.

const { sanityFetch } = vi.hoisted(() => ({ sanityFetch: vi.fn() }))
vi.mock('./sanityFetch', () => ({ sanityFetch }))

import { getSiteSettings } from './siteSettings'

beforeEach(() => vi.clearAllMocks())

describe('getSiteSettings', () => {
  it('returns the values authored in Sanity', async () => {
    sanityFetch.mockResolvedValue({ hoursLine: 'Open 6am–11pm', hoursShort: '6–11' })
    await expect(getSiteSettings()).resolves.toEqual({
      hoursLine: 'Open 6am–11pm',
      hoursShort: '6–11',
    })
  })

  it('falls back when Sanity returns nothing', async () => {
    sanityFetch.mockResolvedValue(null)
    await expect(getSiteSettings()).resolves.toEqual({
      hoursLine: 'Open 7am–10pm, every day',
      hoursShort: '7–10',
    })
  })

  it('falls back per field, not all-or-nothing', async () => {
    // A half-filled Studio document shouldn't blank the other field.
    sanityFetch.mockResolvedValue({ hoursLine: 'Open late Fridays' })
    const settings = await getSiteSettings()
    expect(settings.hoursLine).toBe('Open late Fridays')
    expect(settings.hoursShort).toBe('7–10')
  })

  it('treats an empty string as unset', async () => {
    sanityFetch.mockResolvedValue({ hoursLine: '', hoursShort: '' })
    await expect(getSiteSettings()).resolves.toEqual({
      hoursLine: 'Open 7am–10pm, every day',
      hoursShort: '7–10',
    })
  })
})
