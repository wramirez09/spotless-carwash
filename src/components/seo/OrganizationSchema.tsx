import { locations } from '@/src/data/locations'
import JsonLd from './JsonLd'

export default function OrganizationSchema() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Spotless Carwash',
    url: '/',
    foundingDate: '1998',
    description:
      "Forest Park's 24/7 touchless car wash since 1998. Two locations with heated automatic bays for winter and self-serve wand bays.",
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
