import type { MetadataRoute } from 'next'

const isProduction = process.env.VERCEL_ENV === 'production'

export default function robots(): MetadataRoute.Robots {
  if (!isProduction) {
    return {
      rules: { userAgent: '*', disallow: '/' },
    }
  }
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/marketing-audit', '/competitor-report', '/seo-audit'] },
    sitemap: 'https://spotlesscarwash.com/sitemap.xml',
  }
}
