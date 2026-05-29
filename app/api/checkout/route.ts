import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import {
  PACK_PRICES,
  SINGLE_PRICES,
  activePackCouponId,
  isFathersDaySaleActive,
  type WashValue,
} from '@/lib/stripePricing'
import { getStripeSecretKey } from '@/lib/stripeEnv'

export const runtime = 'nodejs'

type Body = {
  package?: string
  quantity?: number
  mode?: 'single' | 'pack'
  washValue?: number
  email?: string
  name?: string
  phone?: string
}

const VALID_WASH: Set<WashValue> = new Set(['8', '9', '10', '12'])

export async function POST(req: Request) {
  const secret = getStripeSecretKey()
  if (!secret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }
  // Prefer the request's own origin so the redirect always returns to the
  // site the user came from, regardless of how NEXT_PUBLIC_SITE_URL is set
  // in the deploy env. Fall back to the env var, then to the Vercel URL.
  const originHeader = req.headers.get('origin')
  const envSite = process.env.NEXT_PUBLIC_SITE_URL
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined
  const siteUrl = (originHeader || envSite || vercelUrl || '').replace(/\/$/, '')
  if (!siteUrl) {
    return NextResponse.json({ error: 'Site URL missing' }, { status: 500 })
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const pkg = (body.package ?? '') as WashValue
  const quantity = Math.max(1, Math.min(20, Number(body.quantity) || 1))
  const purchaseMode: 'single' | 'pack' = body.mode === 'single' ? 'single' : 'pack'
  const washValue = String(Number(body.washValue)) as WashValue
  const email = (body.email ?? '').trim()
  const name = (body.name ?? '').trim()
  const phone = (body.phone ?? '').trim()

  if (purchaseMode === 'pack' && !VALID_WASH.has(pkg)) {
    return NextResponse.json({ error: 'Bad package' }, { status: 400 })
  }
  if (purchaseMode === 'single' && !VALID_WASH.has(washValue)) {
    return NextResponse.json({ error: 'Bad wash value' }, { status: 400 })
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }
  if (!name) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 })
  }
  if (!phone) {
    return NextResponse.json({ error: 'Phone required' }, { status: 400 })
  }

  const stripe = new Stripe(secret)

  const priceId =
    purchaseMode === 'single' ? SINGLE_PRICES[washValue] : PACK_PRICES[pkg]
  const skuWash = purchaseMode === 'single' ? washValue : pkg

  const applyPackDiscount = purchaseMode === 'pack'
  const fathersDayActive = applyPackDiscount && isFathersDaySaleActive()
  const packCoupon = activePackCouponId()

  try {
    // We do NOT pre-create a Stripe Customer here. Pre-creation would leave an
    // orphan Customer record for every abandoned cart or failed payment. With
    // `customer_email` + `customer_creation: 'always'`, Stripe only creates a
    // Customer when checkout completes successfully, populated from the data
    // collected during checkout (name + billing address). Phone is collected
    // on the Session via `phone_number_collection` but is not auto-copied to
    // the Customer — if you need it on the Customer, do a `customers.update`
    // in the webhook using `session.customer_details.phone`.
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      customer_creation: 'always',
      line_items: [{ price: priceId, quantity }],
      success_url: `${siteUrl}/buy-tokens/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/buy-tokens`,
      // `discounts` and `allow_promotion_codes` are mutually exclusive — packs
      // get the auto-applied coupon (Father's Day $10 during the sale window,
      // otherwise the always-on $5), singles fall back to promo codes.
      ...(applyPackDiscount
        ? { discounts: [{ coupon: packCoupon }] }
        : { allow_promotion_codes: true }),
      // Re-enable once Stripe Tax is configured in the sandbox (origin address,
      // registrations, product tax codes). Until then, leaving it on causes the
      // session.create call to throw and surfaces as the generic checkout
      // error in the browser.
      automatic_tax: { enabled: false },
      billing_address_collection: 'required',
      phone_number_collection: { enabled: true },
      metadata: {
        customer_name: name,
        customer_phone: phone,
        // Tokens per purchased unit: a 4-pack = 4 tokens, a single = 1. The
        // chosen wash value is carried separately in `wash_value` below.
        package_size: purchaseMode === 'single' ? '1' : '4',
        quantity: String(quantity),
        mode: purchaseMode,
        wash_value: skuWash,
        pack_discount: applyPackDiscount
          ? fathersDayActive
            ? '10_off_fathers_day_2026'
            : '5_off'
          : '',
      },
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[api/checkout] stripe session.create failed:', message, err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
