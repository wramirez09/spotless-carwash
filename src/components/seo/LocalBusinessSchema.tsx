import { type Location, fullAddress } from '@/src/data/locations'
import JsonLd from './JsonLd'

export default function LocalBusinessSchema({ location }: { location: Location }) {
  // TODO(coords): fill in real lat/long for each location.
  const data = {
    '@context': 'https://schema.org',
    '@type': 'AutoWash',
    '@id': `#location-${location.slug}`,
    name: `Spotless Carwash — ${location.name}`,
    description: `${location.heated ? 'Heated, enclosed ' : ''}touchless automatic and self-serve car wash bays in Forest Park, IL. Open 24 hours.`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: location.street,
      addressLocality: location.city,
      addressRegion: location.region,
      postalCode: location.postalCode,
      addressCountry: 'US',
    },
    telephone: location.phone,
    url: `/locations/${location.slug}`,
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '00:00',
        closes: '23:59',
      },
    ],
    priceRange: '$$',
    paymentAccepted: 'Cash, Visa, Mastercard, Amex',
    areaServed: {
      '@type': 'City',
      name: 'Forest Park',
    },
    image: `/${location.slug}.jpg`,
    fullAddress: fullAddress(location),
  }

  return <JsonLd data={data} />
}
