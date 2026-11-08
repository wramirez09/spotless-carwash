import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripeSecretKey } from '@/lib/stripeEnv'
import {
  getSubscriptionPlan,
  getSubscriptionVariant,
  isSubscriptionPlanId,
  isSubscriptionWashValue,
  subscriptionPriceId,
} from '@/lib/subscriptionPricing'
import { firstIssueMessage, subscriptionCheckoutBodySchema } from '@/lib/schemas'

export const runtime = 'nodejs'

// Wash Token Subscription checkout. Kept separate from /api/checkout because
// subscription mode differs in ways that would clutter that route:
//   - `customer_creation` is invalid in subscription mode (Stripe always
//     creates the Customer), so it must be omitted rather than set.
//   - The pack coupons in /api/checkout are `duration: 'once'` and would only
//     ever discount the first invoice; subscription discounts belong in the
//     recurring Price itself, so no coupon is applied here.
//   - Like /api/checkout it collects the mailing address on our own form and
//     carries it in `mail_*` session metadata, so Stripe's own shipping step is
//     left off — asking twice would be pure friction.
// It is also distinct from /api/subscribe, which is the newsletter signup.

export async function POST(req: Request) {
  const secret = getStripeSecretKey()
  if (!secret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  // Same origin resolution as /api/checkout — prefer the request's own origin
  // so the redirect returns to the site the user actually came from.
  const originHeader = req.headers.get('origin')
  const envSite = process.env.NEXT_PUBLIC_SITE_URL
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined
  const siteUrl = (originHeader || envSite || vercelUrl || '').replace(/\/$/, '')
  if (!siteUrl) {
    return NextResponse.json({ error: 'Site URL missing' }, { status: 500 })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = subscriptionCheckoutBodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssueMessage(parsed.error) }, { status: 400 })
  }
  const b = parsed.data

  if (!isSubscriptionPlanId(b.plan)) {
    return NextResponse.json({ error: 'Bad plan' }, { status: 400 })
  }
  if (!isSubscriptionWashValue(b.washValue)) {
    return NextResponse.json({ error: 'Bad token value' }, { status: 400 })
  }
  const plan = getSubscriptionPlan(b.plan)
  const variant = getSubscriptionVariant(b.plan, b.washValue)

  let priceId: string | undefined
  try {
    priceId = subscriptionPriceId(plan.id, variant.washValue)
  } catch (err) {
    // getSubscriptionPriceId throws on Vercel Production when the PROD_* var is
    // unset. Surface it as a controlled 500 rather than an unhandled crash.
    console.error('[api/subscription-checkout] price ID unresolved:', err)
    return NextResponse.json({ error: 'Subscriptions not configured' }, { status: 500 })
  }
  if (!priceId) {
    return NextResponse.json({ error: 'Subscriptions not configured' }, { status: 500 })
  }

  const stripe = new Stripe(secret)

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: b.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/buy-tokens/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/buy-tokens/subscribe`,
      billing_address_collection: 'required',
      phone_number_collection: { enabled: true },
      allow_promotion_codes: true,
      // Matches /api/checkout: Stripe Tax is not configured for this account,
      // and enabling it here would make session.create throw.
      automatic_tax: { enabled: false },
      // Mirrored onto the Subscription so renewal invoices carry the plan
      // details too — `metadata` on the Session is not copied automatically,
      // and the webhook needs these on every `invoice.paid`, not just the first.
      subscription_data: {
        metadata: {
          plan: plan.id,
          tokens_per_cycle: String(plan.tokensPerCycle),
          wash_value: variant.washValue,
          customer_name: b.name,
          customer_phone: b.phone,
          // Mailing address for the monthly shipment — read back in the webhook
          // and stored on the subscription row.
          mail_line1: b.mailingLine1,
          mail_line2: b.mailingLine2,
          mail_city: b.mailingCity,
          mail_state: b.mailingState,
          mail_postal_code: b.mailingPostalCode,
          mail_list_subscribed: b.mailingListSubscribed ? 'true' : 'false',
        },
      },
      metadata: {
        plan: plan.id,
        tokens_per_cycle: String(plan.tokensPerCycle),
        wash_value: variant.washValue,
        customer_name: b.name,
        customer_phone: b.phone,
        mail_line1: b.mailingLine1,
        mail_line2: b.mailingLine2,
        mail_city: b.mailingCity,
        mail_state: b.mailingState,
        mail_postal_code: b.mailingPostalCode,
        mail_list_subscribed: b.mailingListSubscribed ? 'true' : 'false',
      },
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[api/subscription-checkout] stripe session.create failed:', message, err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
