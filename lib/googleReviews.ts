import 'server-only'

export type GoogleReview = {
  text: string
  attribution: string
  date?: string
  source: 'google'
  rating: number
}

export type GoogleReviewsData = {
  reviews: GoogleReview[]
  aggregateRating: number | null
  totalReviews: number | null
  profileUrl: string | null
}

const REVALIDATE_SECONDS = 60 * 60 * 6 // 6 hours

function placeIds(): string[] {
  return [
    process.env.GOOGLE_PLACE_ID_MADISON,
    process.env.GOOGLE_PLACE_ID_ROOSEVELT,
  ].filter((x): x is string => typeof x === 'string' && x.length > 0)
}

type PlaceDetails = {
  rating?: number
  user_ratings_total?: number
  url?: string
  reviews?: Array<{
    author_name?: string
    rating?: number
    text?: string
    time?: number
  }>
}

async function fetchPlace(placeId: string, key: string): Promise<PlaceDetails | null> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')
  url.searchParams.set('place_id', placeId)
  url.searchParams.set('fields', 'rating,user_ratings_total,reviews,url')
  url.searchParams.set('reviews_no_translations', 'true')
  url.searchParams.set('key', key)
  const res = await fetch(url.toString(), { next: { revalidate: REVALIDATE_SECONDS } })
  if (!res.ok) return null
  const data = (await res.json()) as { result?: PlaceDetails }
  return data.result ?? null
}

export async function getGoogleReviews(): Promise<GoogleReviewsData | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY
  const ids = placeIds()
  if (!key || ids.length === 0) return null

  try {
    const places = await Promise.all(ids.map((id) => fetchPlace(id, key)))

    const reviews: GoogleReview[] = []
    let weightedRatingSum = 0
    let totalCount = 0
    let profileUrl: string | null = null

    for (const place of places) {
      if (!place) continue
      profileUrl ??= place.url ?? null
      if (
        typeof place.rating === 'number' &&
        typeof place.user_ratings_total === 'number'
      ) {
        weightedRatingSum += place.rating * place.user_ratings_total
        totalCount += place.user_ratings_total
      }
      for (const rev of place.reviews ?? []) {
        if (typeof rev.rating !== 'number' || rev.rating < 4) continue
        if (!rev.text || !rev.author_name) continue
        reviews.push({
          text: rev.text,
          attribution: rev.author_name,
          date: rev.time ? new Date(rev.time * 1000).toISOString() : undefined,
          source: 'google',
          rating: rev.rating,
        })
      }
    }

    if (reviews.length === 0 && totalCount === 0) return null

    const deduped = Array.from(
      new Map(reviews.map((r) => [`${r.attribution}::${r.text.slice(0, 80)}`, r])).values(),
    )
    deduped.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))

    return {
      reviews: deduped,
      aggregateRating: totalCount > 0 ? weightedRatingSum / totalCount : null,
      totalReviews: totalCount > 0 ? totalCount : null,
      profileUrl,
    }
  } catch {
    return null
  }
}
