import type { FAQ } from '@/src/data/faq'
import JsonLd from './JsonLd'

/**
 * FAQPage structured data. Takes the SAME answers the page renders — prices
 * already filled from Stripe — so search results can't quote a different
 * number from the page itself.
 */
export default function FAQPageSchema({ faqs }: { faqs: readonly FAQ[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  }
  return <JsonLd data={data} />
}
