import { locations } from '@/src/data/locations'
import JsonLd from './JsonLd'

export default function OrganizationSchema() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Spotless Carwash',
    url: '/',
    description:
      "Forest Park's touchless car wash. Two locations with heated automatic bays for winter and self-serve wand bays. Open 7am–10pm daily.",
    department: locations.map((loc) => ({
      '@type': 'AutoWash',
      '@id': `#location-${loc.slug}`,
      name: `Spotless Carwash — ${loc.name}`,
      address: {
        '@type': 'PostalAddress',
        streetAddress: loc.street,
        addressLocality: loc.city,
        addressRegion: loc.region,
        postalCode: loc.postalCode,
        addressCountry: 'US',
      },
      telephone: loc.phone,
    })),
  }
  return <JsonLd data={data} />
}
