import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import {
  PACK_PRICES,
  SINGLE_PRICES,
  activePackCouponId,
  isFathersDaySaleActive,
  type WashValue,
} from '@/lib/stripePricing'

export const runtime = 'nodejs'

type Body = {
  package?: string
  quantity?: number
  mode?: 'single' | 'pack'
  washValue?: number
  email?: string
  name?: string
  phone?: string
  street?: string
  city?: string
  state?: string
  zip?: string
}

const VALID_WASH: Set<WashValue> = new Set(['8', '9', '10', '12'])

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!secret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }
  if (!siteUrl) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_SITE_URL missing' }, { status: 500 })
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
  const street = (body.street ?? '').trim()
  const city = (body.city ?? '').trim()
  const state = (body.state ?? '').trim()
  const zip = (body.zip ?? '').trim()

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

  const stripe = new Stripe(secret)

  const priceId =
    purchaseMode === 'single' ? SINGLE_PRICES[washValue] : PACK_PRICES[pkg]
  const skuWash = purchaseMode === 'single' ? washValue : pkg

  // Build a Stripe Customer with billing address pre-populated so the address
  // is captured natively (not only in session metadata) and tax is calculated
  // from it.
  const customer = await stripe.customers.create({
    email,
    name,
    phone: phone || undefined,
    address: street || city || state || zip
      ? {
          line1: street || undefined,
          city: city || undefined,
          state: state || undefined,
          postal_code: zip || undefined,
          country: 'US',
        }
      : undefined,
    metadata: {
      source: 'buy-tokens',
    },
  })

  const applyPackDiscount = purchaseMode === 'pack'
  const fathersDayActive = applyPackDiscount && isFathersDaySaleActive()
  const packCoupon = activePackCouponId()

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customer.id,
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
      billing_address_collection: 'auto',
      phone_number_collection: { enabled: !phone },
      metadata: {
        customer_name: name,
        customer_phone: phone,
        street,
        city,
        state,
        zip,
        package_size: purchaseMode === 'single' ? '1' : pkg,
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
