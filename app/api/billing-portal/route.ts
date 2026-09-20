import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getBillingPortalConfigId, getStripeSecretKey } from '@/lib/stripeEnv'
import { getSupabaseAdmin } from '@/lib/supabase'
import { firstIssueMessage } from '@/lib/schemas'
import { z } from 'zod'

export const runtime = 'nodejs'

const bodySchema = z.object({
  email: z.preprocess(
    (v) => (typeof v === 'string' ? v.trim() : ''),
    z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Valid email required'),
  ),
})

// Generic response for both "no such subscriber" and "found one". Returning a
// different message for a missing email would turn this endpoint into an oracle
// for which addresses have subscriptions.
const GENERIC_OK = {
  message: "If that email has a subscription, we've opened your billing page.",
}

/**
 * Open the Stripe Customer Portal for a subscriber.
 *
 * The Stripe customer is looked up server-side from the caller's email against
 * our own `subscriptions` table — the client never supplies a
 * `stripe_customer_id`, which would let anyone open anyone else's billing page.
 */
export async function POST(req: Request) {
  const secret = getStripeSecretKey()
  if (!secret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const originHeader = req.headers.get('origin')
  const envSite = process.env.NEXT_PUBLIC_SITE_URL
  const siteUrl = (originHeader || envSite || '').replace(/\/$/, '')

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssueMessage(parsed.error) }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  const { data: sub, error } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('email', parsed.data.email.toLowerCase())
    .not('stripe_customer_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[api/billing-portal] lookup failed', { error })
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
  if (!sub?.stripe_customer_id) {
    return NextResponse.json(GENERIC_OK, { status: 200 })
  }

  try {
    const stripe = new Stripe(secret)
    const configuration = getBillingPortalConfigId()
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${siteUrl || 'https://spotlessautowash.com'}/buy-tokens/subscribe`,
      // Unset falls back to the account's default portal configuration.
      ...(configuration ? { configuration } : {}),
    })
    return NextResponse.json({ ...GENERIC_OK, url: session.url })
  } catch (err) {
    console.error('[api/billing-portal] session create failed', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
