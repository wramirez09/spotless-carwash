import { revalidatePath } from 'next/cache'
import { parseBody } from 'next-sanity/webhook'
import type { NextRequest } from 'next/server'
import { syncCatalogToWashPackages } from '@/lib/pricingAdmin'

export const runtime = 'nodejs'

/**
 * Sanity publish webhook.
 *
 * Besides refreshing cached pages, a change to the wash packages — the source
 * of truth for token pricing (lib/washPricing.ts) — brings the token catalog
 * in Stripe in line straight away, so a new wash price reaches the token
 * packs and checkout without anyone visiting /admin/pricing. The sync is
 * idempotent, so it also runs when the payload doesn't say which document
 * changed. A failed sync is logged and never fails the webhook: the pages
 * still revalidate, and the admin page shows any remaining mismatch.
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

  let sync: { ok: boolean; message: string } | null = null
  const type = body?._type
  if (!type || type === 'washPackage') {
    try {
      sync = await syncCatalogToWashPackages('sanity-webhook')
      if (!sync.ok) console.error('[revalidate] token price sync incomplete:', sync.message)
    } catch (err) {
      console.error('[revalidate] token price sync failed', err)
      sync = { ok: false, message: 'Sync failed' }
    }
  }

  revalidatePath('/', 'layout')

  return Response.json(
    { message: 'Revalidated', ...(sync ? { sync: sync.message } : {}) },
    { status: 200 },
  )
}
