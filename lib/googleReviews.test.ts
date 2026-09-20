// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getGoogleReviews } from './googleReviews'

// Testimonials shown on the live site. Two properties matter: never surface a
// bad review (the rating floor), and never take a page down because Google is
// slow or rate-limited (every failure path returns null).

const fetchMock = vi.fn()

function place(overrides: Record<string, unknown> = {}) {
  return {
    rating: 4.8,
    user_ratings_total: 100,
    url: 'https://maps.google.com/spotless',
    reviews: [
      { author_name: 'Ada', rating: 5, text: 'Spotless every time', time: 1_700_000_000 },
    ],
    ...overrides,
  }
}

function respondWith(...results: unknown[]) {
  let i = 0
  fetchMock.mockImplementation(async () => {
    const result = results[Math.min(i++, results.length - 1)]
    if (result === 'error') return { ok: false, json: async () => ({}) }
    return { ok: true, json: async () => ({ result }) }
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', fetchMock)
  vi.stubEnv('GOOGLE_PLACES_API_KEY', 'key-123')
  vi.stubEnv('GOOGLE_PLACE_ID_MADISON', 'place-madison')
  vi.stubEnv('GOOGLE_PLACE_ID_ROOSEVELT', '')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('configuration', () => {
  it('returns null with no API key, without calling Google', async () => {
    vi.stubEnv('GOOGLE_PLACES_API_KEY', '')
    expect(await getGoogleReviews()).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns null when no place IDs are configured', async () => {
    vi.stubEnv('GOOGLE_PLACE_ID_MADISON', '')
    expect(await getGoogleReviews()).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('queries each configured location', async () => {
    vi.stubEnv('GOOGLE_PLACE_ID_ROOSEVELT', 'place-roosevelt')
    respondWith(place())
    await getGoogleReviews()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('sends the key and place id, and caches the response', async () => {
    respondWith(place())
    await getGoogleReviews()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('place_id=place-madison')
    expect(url).toContain('key=key-123')
    expect(init).toEqual({ next: { revalidate: 21600 } })
  })
})

describe('review selection', () => {
  it('returns qualifying reviews with their attribution', async () => {
    respondWith(place())
    const data = await getGoogleReviews()
    expect(data?.reviews).toHaveLength(1)
    expect(data?.reviews[0]).toMatchObject({
      text: 'Spotless every time',
      attribution: 'Ada',
      source: 'google',
      rating: 5,
    })
  })

  it.each([1, 2, 3])('drops a %s-star review', async (rating) => {
    // The site is not the place to surface criticism; 4 is the floor.
    respondWith(place({ reviews: [{ author_name: 'A', rating, text: 'Bad' }] }))
    const data = await getGoogleReviews()
    expect(data?.reviews ?? []).toHaveLength(0)
  })

  it('keeps a 4-star review — the boundary is inclusive', async () => {
    respondWith(place({ reviews: [{ author_name: 'A', rating: 4, text: 'Good' }] }))
    expect((await getGoogleReviews())?.reviews).toHaveLength(1)
  })

  it('drops a review with no text or no author', async () => {
    respondWith(
      place({
        reviews: [
          { author_name: 'A', rating: 5 },
          { rating: 5, text: 'Anonymous praise' },
          { author_name: 'B', rating: 5, text: '' },
        ],
      }),
    )
    expect((await getGoogleReviews())?.reviews ?? []).toHaveLength(0)
  })

  it('drops a review with a non-numeric rating', async () => {
    respondWith(
      place({ reviews: [{ author_name: 'A', rating: undefined, text: 'Hi' }] }),
    )
    expect((await getGoogleReviews())?.reviews ?? []).toHaveLength(0)
  })

  it('converts the review timestamp to an ISO date', async () => {
    respondWith(place())
    const data = await getGoogleReviews()
    expect(data?.reviews[0].date).toBe(new Date(1_700_000_000 * 1000).toISOString())
  })

  it('omits the date when Google sends none', async () => {
    respondWith(place({ reviews: [{ author_name: 'A', rating: 5, text: 'Hi' }] }))
    expect((await getGoogleReviews())?.reviews[0].date).toBeUndefined()
  })

  it('de-duplicates the same review returned by both locations', async () => {
    // The two Forest Park sites share reviewers; showing a testimonial twice
    // looks broken.
    vi.stubEnv('GOOGLE_PLACE_ID_ROOSEVELT', 'place-roosevelt')
    respondWith(place(), place())
    expect((await getGoogleReviews())?.reviews).toHaveLength(1)
  })

  it('sorts newest first', async () => {
    respondWith(
      place({
        reviews: [
          { author_name: 'Old', rating: 5, text: 'older', time: 1_600_000_000 },
          { author_name: 'New', rating: 5, text: 'newer', time: 1_700_000_000 },
        ],
      }),
    )
    const data = await getGoogleReviews()
    expect(data?.reviews.map((r) => r.attribution)).toEqual(['New', 'Old'])
  })
})

describe('aggregate rating', () => {
  it('weights each location by its review count', async () => {
    // A plain average would let a quiet location with a perfect score
    // outweigh a busy one.
    vi.stubEnv('GOOGLE_PLACE_ID_ROOSEVELT', 'place-roosevelt')
    respondWith(
      place({ rating: 5, user_ratings_total: 100, reviews: [] }),
      place({ rating: 4, user_ratings_total: 300, reviews: [] }),
    )
    const data = await getGoogleReviews()
    expect(data?.totalReviews).toBe(400)
    expect(data?.aggregateRating).toBeCloseTo(4.25, 5)
  })

  it('reports no rating when Google omits the counts', async () => {
    respondWith(place({ rating: undefined, user_ratings_total: undefined }))
    const data = await getGoogleReviews()
    expect(data?.aggregateRating).toBeNull()
    expect(data?.totalReviews).toBeNull()
  })

  it('takes the profile URL from the first location that has one', async () => {
    respondWith(place())
    expect((await getGoogleReviews())?.profileUrl).toBe('https://maps.google.com/spotless')
  })
})

describe('failure handling', () => {
  it('returns null when Google responds with an error status', async () => {
    respondWith('error')
    expect(await getGoogleReviews()).toBeNull()
  })

  it('returns null when fetch rejects', async () => {
    // A network blip must not take the homepage down.
    fetchMock.mockRejectedValue(new Error('network down'))
    expect(await getGoogleReviews()).toBeNull()
  })

  it('returns null when there is nothing worth showing', async () => {
    respondWith(place({ rating: undefined, user_ratings_total: undefined, reviews: [] }))
    expect(await getGoogleReviews()).toBeNull()
  })

  it('still returns data when one of two locations fails', async () => {
    vi.stubEnv('GOOGLE_PLACE_ID_ROOSEVELT', 'place-roosevelt')
    let call = 0
    fetchMock.mockImplementation(async () =>
      call++ === 0
        ? { ok: false, json: async () => ({}) }
        : { ok: true, json: async () => ({ result: place() }) },
    )
    const data = await getGoogleReviews()
    expect(data?.reviews).toHaveLength(1)
  })
})
