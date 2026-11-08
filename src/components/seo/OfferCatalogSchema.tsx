import type { Pkg } from '@/src/data/washes'
import JsonLd from './JsonLd'

type PackOffer = { label: string; price: number; save: number }

/**
 * OfferCatalog structured data, built from the same live (Stripe-priced)
 * packages and token packs the page renders, so search results can never
 * advertise a price the page doesn't.
 */
export default function OfferCatalogSchema({
  packages,
  packs = [],
}: {
  packages: readonly Pkg[]
  packs?: readonly PackOffer[]
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: 'Wash packages',
    itemListElement: [
      ...packages.map((pkg) => ({
        '@type': 'Offer',
        name: pkg.name,
        price: pkg.priceNumber.toFixed(2),
        priceCurrency: 'USD',
        itemOffered: {
          '@type': 'Service',
          name: `${pkg.name} car wash`,
          description: pkg.features
            .filter((f) => f.included)
            .map((f) => f.text)
            .join(', '),
        },
      })),
      ...packs.map((pack) => ({
        '@type': 'Offer',
        name: `Wash tokens — ${pack.label}`,
        price: (Math.max(0, pack.price - pack.save) / 100).toFixed(2),
        priceCurrency: 'USD',
        itemOffered: { '@type': 'Product', name: `Spotless wash tokens, ${pack.label}` },
      })),
    ],
  }
  return <JsonLd data={data} />
}
