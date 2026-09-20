// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Every page's copy comes through here. Its contract is that it NEVER throws:
// a missing project id, a network error or being called outside a request
// context all return null so the caller renders its hardcoded fallback copy
// rather than 500ing the page.

const { clientFetch, withConfig, draftModeMock } = vi.hoisted(() => ({
  clientFetch: vi.fn(),
  withConfig: vi.fn(),
  draftModeMock: vi.fn(),
}))

vi.mock('next/headers', () => ({ draftMode: draftModeMock }))
vi.mock('./sanity', () => ({
  sanityClient: { fetch: clientFetch, withConfig },
  studioUrl: '/studio',
}))

import { sanityFetch } from './sanityFetch'

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', 'proj123')
  vi.stubEnv('SANITY_API_READ_TOKEN', '')
  vi.stubEnv('NODE_ENV', 'production')
  clientFetch.mockResolvedValue({ title: 'hello' })
  draftModeMock.mockResolvedValue({ isEnabled: false })
  withConfig.mockReturnValue({ fetch: clientFetch })
})

afterEach(() => vi.unstubAllEnvs())

describe('sanityFetch', () => {
  it('returns the query result', async () => {
    await expect(sanityFetch('*[_type=="tokens"][0]')).resolves.toEqual({ title: 'hello' })
  })

  it('returns null when no project id is configured, without querying', async () => {
    vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', '')
    expect(await sanityFetch('*')).toBeNull()
    expect(clientFetch).not.toHaveBeenCalled()
  })

  it('returns null instead of throwing when the query fails', async () => {
    // A Sanity outage must degrade to fallback copy, not a 500.
    clientFetch.mockRejectedValue(new Error('network down'))
    expect(await sanityFetch('*')).toBeNull()
  })

  it('passes query params through', async () => {
    await sanityFetch('*[slug==$slug]', { params: { slug: 'madison-st' } })
    expect(clientFetch.mock.calls[0][1]).toEqual({ slug: 'madison-st' })
  })

  it('defaults to a 60s revalidate in production', async () => {
    expect((await sanityFetch('*'), clientFetch.mock.calls[0][2])).toEqual({
      next: { revalidate: 60, tags: undefined },
    })
  })

  it('honours an explicit revalidate', async () => {
    await sanityFetch('*', { revalidate: 300 })
    expect(clientFetch.mock.calls[0][2].next.revalidate).toBe(300)
  })

  it('passes cache tags through', async () => {
    await sanityFetch('*', { tags: ['tokens'] })
    expect(clientFetch.mock.calls[0][2].next.tags).toEqual(['tokens'])
  })

  it('never caches in development', async () => {
    // Otherwise a Studio edit wouldn't show up locally for a minute.
    vi.stubEnv('NODE_ENV', 'development')
    await sanityFetch('*')
    expect(clientFetch.mock.calls[0][2].next.revalidate).toBe(0)
  })

  it('survives being called outside a request context', async () => {
    // draftMode() throws during static generation.
    draftModeMock.mockRejectedValue(new Error('called outside a request scope'))
    await expect(sanityFetch('*')).resolves.toEqual({ title: 'hello' })
  })

  it('uses the plain client when not in draft mode', async () => {
    await sanityFetch('*')
    expect(withConfig).not.toHaveBeenCalled()
  })

  it('switches to the preview perspective in draft mode', async () => {
    draftModeMock.mockResolvedValue({ isEnabled: true })
    vi.stubEnv('SANITY_API_READ_TOKEN', 'tok')
    vi.resetModules()
    const fresh = await import('./sanityFetch')

    await fresh.sanityFetch('*')

    expect(withConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'tok',
        perspective: 'previewDrafts',
        useCdn: false,
      }),
    )
  })

  it('does not enter preview mode without a read token', async () => {
    // Without the token the preview client would 401 on every request.
    draftModeMock.mockResolvedValue({ isEnabled: true })
    await sanityFetch('*')
    expect(withConfig).not.toHaveBeenCalled()
  })

  it('disables caching in draft mode so edits appear immediately', async () => {
    draftModeMock.mockResolvedValue({ isEnabled: true })
    await sanityFetch('*')
    expect(clientFetch.mock.calls[0][2].next.revalidate).toBe(0)
  })
})
