import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { parseBody } from 'next-sanity/webhook'
import type { NextRequest } from 'next/server'
import { syncCatalogToWashPackages } from '@/lib/pricingAdmin'

export const runtime = 'nodejs'

/**
 * Sanity publish webhook.
 *
 * Refreshes cached pages, and — when the wash packages may have changed —
 * brings the token catalog in Stripe in line with them (lib/washPricing.ts),
 * so a new wash price reaches the token packs and checkout without anyone
 * visiting /admin/pricing.
 *
 * Pages are revalidated FIRST and the sync runs in `after()`, once the
 * response is sent: the sync makes a run of Stripe calls, and a slow or
 * timed-out sync must never cost the page refresh. A second revalidation
 * after the sync makes the new token prices show without waiting for the
 * cache. The sync is idempotent and refuses to act on partial information, so
 * an interrupted run is finished by the next publish or by "Sync" in the admin.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_WEBHOOK_SECRET
  if (!secret) {
    return new Response('Missing SANITY_WEBHOOK_SECRET', { status: 500 })
  }

  const { isValidSignature, body } = await parseBody<{ _type?: string }>(request, secret)
  if (!isValidSignature) {
    return new Response('Invalid signature', { status: 401 })
  }

  revalidatePath('/', 'layout')

  const type = body?._type
  const syncing = !type || type === 'washPackage'
  if (syncing) {
    after(async () => {
      try {
        const sync = await syncCatalogToWashPackages('sanity-webhook')
        if (!sync.ok) console.error('[revalidate] token price sync incomplete:', sync.message)
        else console.info('[revalidate]', sync.message)
        revalidatePath('/', 'layout')
      } catch (err) {
        console.error('[revalidate] token price sync failed', err)
      }
    })
  }

  return Response.json({ message: 'Revalidated', syncing }, { status: 200 })
}
