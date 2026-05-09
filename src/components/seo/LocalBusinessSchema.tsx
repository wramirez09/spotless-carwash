import { type Location, fullAddress } from '@/src/data/locations'
import JsonLd from './JsonLd'

const SITE_URL = 'https://spotlesscarwash.com'

// Approximate coordinates derived from street addresses. Replace with exact
// coords from Google Business Profile when available.
const LOCATION_GEO: Record<Location['slug'], { latitude: number; longitude: number }> = {
  'roosevelt-rd': { latitude: 41.8730, longitude: -87.8137 },
  'madison-st': { latitude: 41.8853, longitude: -87.8255 },
}

// TODO: replace with actual Google Business Profile URLs once provided.
const LOCATION_SAMEAS: Record<Location['slug'], string[]> = {
  'roosevelt-rd': [
    'https://www.facebook.com/spotlesscarwashforestpark/',
    'https://www.yelp.com/biz/spotless-car-wash-forest-park-2',
  ],
  'madison-st': [
    'https://www.facebook.com/spotlesscarwashforestpark/',
    'https://www.yelp.com/biz/spotless-car-wash-forest-park',
  ],
}

export default function LocalBusinessSchema({ location }: { location: Location }) {
  const geo = LOCATION_GEO[location.slug]
  const sameAs = LOCATION_SAMEAS[location.slug]
  const data = {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'AutoWash'],
    '@id': `${SITE_URL}/locations/${location.slug}#location`,
    name: `Spotless Carwash — ${location.name}`,
    description: `${location.heated ? 'Heated, enclosed ' : ''}touchless automatic and self-serve car wash bays in Forest Park, IL. Open 7am–10pm daily.`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: location.street,
      addressLocality: location.city,
      addressRegion: location.region,
      postalCode: location.postalCode,
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: geo.latitude,
      longitude: geo.longitude,
    },
    telephone: location.phone,
    url: `${SITE_URL}/locations/${location.slug}`,
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '07:00',
        closes: '22:00',
      },
    ],
    priceRange: '$$',
    paymentAccepted: 'Cash, Visa, Mastercard, Amex, Apple Pay, Tap, Wash tokens',
    areaServed: {
      '@type': 'City',
      name: 'Forest Park',
    },
    image: `${SITE_URL}/images/${location.slug === 'roosevelt-rd' ? 'location-exterior' : 'madison-location'}.jpg`,
    sameAs,
    hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress(location))}`,
  }

  return <JsonLd data={data} />
}
