import type { MetadataRoute } from 'next'
import { locations } from '@/src/data/locations'
import { subscriptionsEnabled } from '@/lib/featureFlags'

const SITE_URL = 'https://spotlessautowash.com'

// The sitemap is statically generated, so this resolves once at build time
// rather than per request — every deploy stamps a fresh date and it stays
// stable in between. Naming it says that out loud: a `new Date()` inline
// reads like "now", which would be a lie told to crawlers on every fetch.
const BUILD_DATE = new Date()

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = BUILD_DATE
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
    // Subscription landing page — a conversion page like /buy-tokens. Listed
    // only while the feature is enabled; the route 404s when it isn't, and
    // advertising a 404 to crawlers is worse than omitting it.
    ...(subscriptionsEnabled()
      ? [
          {
            url: `${SITE_URL}/buy-tokens/subscribe`,
            lastModified,
            changeFrequency: 'weekly' as const,
            priority: 0.9,
          },
        ]
      : []),
    { url: `${SITE_URL}/faq`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/privacy`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
  ]
  // Intentionally excluded: /buy-tokens/success, /buy-tokens/subscribe/success
  // and /under-construction
  // (non-indexable), /studio + /api/* (internal), and the /seo-audit,
  // /competitor-report, /marketing-audit report pages (internal-only).
}
