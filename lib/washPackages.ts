import 'server-only'
import { sanityFetch } from './sanityFetch'
import { sanityClient } from './sanity'
import { packages as fallbackPackages, type Pkg } from '@/src/data/washes'
import { tiersFromPackages, type WashTier } from './washPricing'

// Loads the wash packages — the source of truth for which tokens are sold and
// what they cost (see lib/washPricing.ts). One query, shared by the home page
// cards, the storefront, checkout, the admin page and the CMS sync, so they
// can never read two different lineups.

export const WASH_PACKAGES_QUERY = `*[_type == "washPackage"] | order(order asc, priceNumber asc){
  num, name, price, priceNumber, color, featured,
  features[]{ text, included }
}`

export type WashLineup = {
  packages: Pkg[]
  tiers: WashTier[]
  /**
   * 'cms' — read from Sanity. 'fallback' — Sanity didn't answer and the copy
   * in src/data/washes.ts was used. Callers that would REFUSE something based
   * on the lineup (checkout, sync) only do so on a 'cms' answer, so a CMS
   * outage never stops a sale or deletes a product.
   */
  source: 'cms' | 'fallback'
}

function lineup(packages: Pkg[] | null | undefined): WashLineup {
  if (packages && packages.length > 0) {
    const tiers = tiersFromPackages(packages)
    if (tiers.length > 0) return { packages, tiers, source: 'cms' }
  }
  return { packages: fallbackPackages, tiers: tiersFromPackages(fallbackPackages), source: 'fallback' }
}

/**
 * The wash lineup. Normally read through the same 60-second-cached fetch the
 * rest of the CMS content uses; `fresh` goes straight to the API (no CDN, no
 * cache) for the sync that runs the moment an editor publishes a change.
 */
export async function getWashLineup({ fresh = false }: { fresh?: boolean } = {}): Promise<WashLineup> {
  if (!fresh) return lineup(await sanityFetch<Pkg[]>(WASH_PACKAGES_QUERY))
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) return lineup(null)
  try {
    const client = sanityClient.withConfig({ useCdn: false, stega: { enabled: false } })
    return lineup(await client.fetch<Pkg[]>(WASH_PACKAGES_QUERY, {}, { cache: 'no-store' }))
  } catch (err) {
    console.error('[washPackages] fresh read failed; using fallback', err)
    return lineup(null)
  }
}
