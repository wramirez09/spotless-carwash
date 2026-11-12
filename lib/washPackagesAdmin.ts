import 'server-only'
import { sanityClient } from './sanity'
import { slugify } from './pricing/model'
import { audit, syncCatalogToWashPackages, type AdminResult } from './pricingAdmin'
import {
  orderForPrice,
  validateNewWashPackage,
  washPackageDocument,
  type NewWashPackage,
} from './washPricing'

// Adding a wash package from /admin/pricing.
//
// The package is written to the CMS (Sanity) — still the one place the wash
// lineup lives, so the Studio, the home page and everything priced from it
// keep reading a single source. Then the token catalog in Stripe is synced to
// the new lineup, so the new wash's token pack (and single token, if those
// are sold) is on sale straight away rather than waiting for a CMS webhook.

/** Writes need an Editor token; reads elsewhere use the public client. */
export function washPackageWritesEnabled(): boolean {
  return Boolean(process.env.SANITY_WRITE_TOKEN?.trim())
}

function writeClient() {
  const token = process.env.SANITY_WRITE_TOKEN?.trim()
  if (!token) return null
  return sanityClient.withConfig({ token, useCdn: false, stega: { enabled: false } })
}

type ExistingPackage = { _id: string; name?: string; priceNumber?: number; order?: number }

export async function createWashPackage(
  input: NewWashPackage & { actorEmail: string | null },
): Promise<AdminResult<{ id: string }>> {
  const client = writeClient()
  if (!client) {
    return {
      ok: false,
      message:
        'Adding packages from here needs SANITY_WRITE_TOKEN set for this deployment. Use the CMS (Studio) instead for now.',
    }
  }

  let existing: ExistingPackage[]
  try {
    existing = await client.fetch<ExistingPackage[]>(
      '*[_type == "washPackage" && !(_id in path("drafts.**"))]{ _id, name, priceNumber, order }',
      {},
      { cache: 'no-store' },
    )
  } catch (err) {
    console.error('[washPackagesAdmin] could not read packages', err)
    return { ok: false, message: "Couldn't reach the CMS. Nothing was added — try again." }
  }

  const invalid = validateNewWashPackage(input, existing)
  if (invalid) return { ok: false, message: invalid }

  // A readable, unique id: washPackage-premium, washPackage-premium-2, …
  const base = slugify(input.name) || String(input.priceNumber)
  const taken = new Set(existing.map((p) => p._id))
  let suffix = base
  for (let n = 2; taken.has('washPackage-' + suffix); n++) suffix = base + '-' + n

  const doc = washPackageDocument(input, orderForPrice(existing, input.priceNumber), suffix)
  try {
    // Published straight away (no draft): the admin asked to add it.
    await client.create(doc)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    await audit(input.actorEmail, 'washPackage.create', { name: doc.name, error: message }, false)
    return { ok: false, message: 'The CMS rejected the new package: ' + message }
  }
  await audit(input.actorEmail, 'washPackage.create', {
    id: doc._id,
    name: doc.name,
    priceNumber: doc.priceNumber,
  })

  // Put its tokens on sale. The package exists either way; if the sync falls
  // short, the admin page lists what's missing and "Sync" finishes the job.
  const sync = await syncCatalogToWashPackages(input.actorEmail).catch((err) => ({
    ok: false,
    message: err instanceof Error ? err.message : 'Sync failed',
  }))
  const what = '"' + doc.name + '" ($' + doc.priceNumber + ') is on the site.'
  return sync.ok
    ? {
        ok: true,
        message: what + ' Its tokens are on sale: ' + sync.message,
        data: { id: doc._id },
      }
    : {
        ok: true,
        message:
          what + ' Its tokens are not on sale yet (' + sync.message + ') — press "Sync to wash packages".',
        data: { id: doc._id },
      }
}
