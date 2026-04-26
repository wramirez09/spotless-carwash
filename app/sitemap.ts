import type { MetadataRoute } from 'next'
import { locations } from '@/src/data/locations'

// TODO(domain): once metadataBase is set in app/layout.tsx, sitemap entries will
// automatically resolve to absolute URLs. For now, paths are relative.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return [
    { url: '/', lastModified, changeFrequency: 'monthly', priority: 1 },
    { url: '/faq', lastModified, changeFrequency: 'monthly', priority: 0.7 },
    ...locations.map((loc) => ({
      url: `/locations/${loc.slug}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ]
}
