import type { MetadataRoute } from 'next'
import { locations } from '@/src/data/locations'

const SITE_URL = 'https://spotlessautowash.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: 'weekly', priority: 1 },
    // Conversion page — prices/sales change, so crawl it more often.
    { url: `${SITE_URL}/buy-tokens`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    ...locations.map((loc) => ({
      url: `${SITE_URL}/locations/${loc.slug}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    { url: `${SITE_URL}/faq`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/privacy`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
  ]
  // Intentionally excluded: /buy-tokens/success and /under-construction
  // (non-indexable), /studio + /api/* (internal), and the /seo-audit,
  // /competitor-report, /marketing-audit report pages (internal-only).
}
