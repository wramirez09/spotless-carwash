import { packages } from '@/src/data/washes'
import JsonLd from './JsonLd'

export default function OfferCatalogSchema() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: 'Wash packages',
    itemListElement: packages.map((pkg) => ({
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
  }
  return <JsonLd data={data} />
}
