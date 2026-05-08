import type { MetadataRoute } from 'next'

const isProduction = process.env.VERCEL_ENV === 'production'

export default function robots(): MetadataRoute.Robots {
  if (!isProduction) {
    return {
      rules: { userAgent: '*', disallow: '/' },
    }
  }
  // TODO(domain): once production domain is set, add `sitemap: 'https://<domain>/sitemap.xml'`.
  // Until then we omit the field — sitemap protocol requires absolute URLs and Lighthouse
  // (correctly) rejects relative ones. Crawlers will still find /sitemap.xml by convention.
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/marketing-audit', '/competitor-report', '/seo-audit'] },
  }
}
