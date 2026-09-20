// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The sitemap is what we tell Google is worth crawling. Two ways it can be
// actively harmful: listing a URL that 404s, and listing pages that are meant
// to stay out of the index. Both are pinned here.

const SITE = 'https://spotlessautowash.com'

async function loadSitemap() {
  vi.resetModules()
  const mod = await import('./sitemap')
  return mod.default()
}

beforeEach(() => {
  vi.stubEnv('VERCEL_ENV', 'preview') // subscriptions on by default off-prod
  vi.stubEnv('SUBSCRIPTIONS_ENABLED', '')
})
afterEach(() => vi.unstubAllEnvs())

describe('sitemap', () => {
  it('lists the core pages', async () => {
    const urls = (await loadSitemap()).map((e) => e.url)
    for (const path of ['/', '/buy-tokens', '/faq', '/privacy', '/terms']) {
      expect(urls).toContain(`${SITE}${path}`)
    }
  })

  it('lists every location page', async () => {
    const urls = (await loadSitemap()).map((e) => e.url)
    expect(urls).toContain(`${SITE}/locations/madison-st`)
    expect(urls).toContain(`${SITE}/locations/roosevelt-rd`)
  })

  it('uses absolute canonical URLs on the production domain', async () => {
    // A relative or preview-domain URL in a sitemap is ignored at best.
    for (const e of await loadSitemap()) {
      expect(e.url.startsWith(`${SITE}/`)).toBe(true)
    }
  })

  it('contains no duplicates', async () => {
    const urls = (await loadSitemap()).map((e) => e.url)
    expect(new Set(urls).size).toBe(urls.length)
  })

  it('excludes pages that must never be indexed', async () => {
    // Checkout confirmations, the maintenance page, the Studio, the API and
    // the internal report pages.
    const urls = (await loadSitemap()).map((e) => e.url)
    for (const path of [
      '/buy-tokens/success',
      '/buy-tokens/subscribe/success',
      '/under-construction',
      '/studio',
      '/admin',
      '/admin/signups',
      '/seo-audit',
      '/competitor-report',
      '/marketing-audit',
    ]) {
      expect(urls).not.toContain(`${SITE}${path}`)
    }
  })

  it('gives every entry a lastModified date', async () => {
    for (const e of await loadSitemap()) {
      expect(e.lastModified).toBeInstanceOf(Date)
      expect(Number.isNaN(new Date(e.lastModified as Date).getTime())).toBe(false)
    }
  })

  it('stamps one stable build date rather than a per-entry "now"', async () => {
    // Telling crawlers every page changed at a slightly different instant on
    // every fetch is noise; one build timestamp is the honest signal.
    const entries = await loadSitemap()
    const stamps = new Set(entries.map((e) => (e.lastModified as Date).getTime()))
    expect(stamps.size).toBe(1)
  })

  it('keeps the homepage at the highest priority', async () => {
    const home = (await loadSitemap()).find((e) => e.url === `${SITE}/`)
    expect(home?.priority).toBe(1)
  })
})

describe('sitemap — subscription gating', () => {
  it('lists the subscribe page while the feature is enabled', async () => {
    vi.stubEnv('SUBSCRIPTIONS_ENABLED', 'true')
    const urls = (await loadSitemap()).map((e) => e.url)
    expect(urls).toContain(`${SITE}/buy-tokens/subscribe`)
  })

  it('omits it when gated off, because the route 404s', async () => {
    // Advertising a 404 to crawlers at priority 0.9 is worse than omitting it.
    vi.stubEnv('SUBSCRIPTIONS_ENABLED', 'false')
    const urls = (await loadSitemap()).map((e) => e.url)
    expect(urls).not.toContain(`${SITE}/buy-tokens/subscribe`)
  })

  it('omits it on Vercel Production by default', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('SUBSCRIPTIONS_ENABLED', '')
    const urls = (await loadSitemap()).map((e) => e.url)
    expect(urls).not.toContain(`${SITE}/buy-tokens/subscribe`)
  })
})
