import { sanityFetch } from '@/lib/sanityFetch'
import { getGoogleReviews } from '@/lib/googleReviews'
import TestimonialClient, { type Quote } from './TestimonialClient'
import JsonLd from './seo/JsonLd'

const TESTIMONIAL_QUERY = `*[_type == "testimonialSection"][0]{
  eyebrow, heading,
  aggregateRating, totalReviews, googleProfileUrl,
  quotes[]{ text, attribution, date, source, avatar, rating }
}`

type SectionData = {
  eyebrow?: string
  heading?: string
  aggregateRating?: number | null
  totalReviews?: number | null
  googleProfileUrl?: string | null
  quotes?: Quote[]
}

const FALLBACK: Required<Pick<SectionData, 'eyebrow' | 'heading'>> & {
  quotes: Quote[]
} = {
  eyebrow: 'Reviews from Google',
  heading: 'What Forest Park drivers say.',
  quotes: [
    {
      text:
        'Pulled in right before close after a Chicago snowstorm. Heated bay, four and a half minutes, drove out spotless. The only place that does it right.',
      attribution: 'Mike R., Forest Park',
      rating: 5,
    },
    {
      text:
        'Self-serve bays have everything you need. The Durashield + spot-free combo is the move. Tokens make the price feel like nothing.',
      attribution: 'Anna T., Oak Park',
      rating: 5,
    },
    {
      text:
        'My salt-covered SUV looked brand new in under five minutes. Touchless and zero scratches — I will not go anywhere else.',
      attribution: 'Dave K., Oak Park',
      rating: 5,
    },
  ],
}

const SITE_URL = 'https://spotlesscarwash.com'

export default async function Testimonial() {
  const [data, google] = await Promise.all([
    sanityFetch<SectionData>(TESTIMONIAL_QUERY),
    getGoogleReviews(),
  ])

  // Prefer live Google reviews when configured; fall back to Sanity, then hardcoded copy.
  // Defensive filter to ≥4 stars regardless of source.
  const sourceQuotes: Quote[] = google?.reviews?.length
    ? google.reviews.map((r) => ({
        text: r.text,
        attribution: r.attribution,
        date: r.date ?? null,
        source: 'google',
        rating: r.rating,
      }))
    : data?.quotes?.length
      ? data.quotes
      : FALLBACK.quotes

  const quotes = sourceQuotes.filter((q) => (q.rating ?? 5) >= 4)
  if (!quotes.length) return null

  const eyebrow = data?.eyebrow ?? FALLBACK.eyebrow
  const heading = data?.heading ?? FALLBACK.heading
  const aggregateRating = google?.aggregateRating ?? data?.aggregateRating ?? null
  const totalReviews = google?.totalReviews ?? data?.totalReviews ?? null
  const googleProfileUrl = google?.profileUrl ?? data?.googleProfileUrl ?? null

  // Only emit Review schema for quotes explicitly marked source="google" with a date.
  const verifiedReviews = quotes.filter(
    (q) => q.source === 'google' && q.date,
  )

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#organization`,
    name: 'Spotless Carwash',
    url: SITE_URL,
  }
  if (aggregateRating && totalReviews) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: aggregateRating,
      reviewCount: totalReviews,
      bestRating: 5,
      worstRating: 1,
    }
  }
  if (verifiedReviews.length) {
    schema.review = verifiedReviews.map((q) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: q.attribution },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: q.rating ?? 5,
        bestRating: 5,
        worstRating: 1,
      },
      datePublished: q.date,
      reviewBody: q.text,
      publisher: { '@type': 'Organization', name: 'Google' },
    }))
  }

  const showSchema = !!schema.aggregateRating || !!schema.review

  return (
    <>
      {showSchema && <JsonLd data={schema} />}
      <TestimonialClient
        quotes={quotes}
        eyebrow={eyebrow}
        heading={heading}
        aggregateRating={aggregateRating}
        totalReviews={totalReviews}
        googleProfileUrl={googleProfileUrl}
      />
    </>
  )
}
