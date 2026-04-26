import { faqs } from '@/src/data/faq'
import JsonLd from './JsonLd'

export default function FAQPageSchema() {
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
