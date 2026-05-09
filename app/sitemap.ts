import type { MetadataRoute } from 'next'
import { locations } from '@/src/data/locations'

const SITE_URL = 'https://spotlesscarwash.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_URL}/faq`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    ...locations.map((loc) => ({
      url: `${SITE_URL}/locations/${loc.slug}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ]
}
