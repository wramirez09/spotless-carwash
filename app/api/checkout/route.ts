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
import { checkoutBodySchema, firstIssueMessage } from '@/lib/schemas'

export const runtime = 'nodejs'

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

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // zod handles shape, coercion, trimming, the quantity clamp, and all the
  // required-field messages (Valid email required / Name required / Phone
  // required / Complete mailing address required).
  const parsed = checkoutBodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssueMessage(parsed.error) }, { status: 400 })
  }
  const b = parsed.data

  const pkg = b.package as WashValue
  const quantity = b.quantity
  const purchaseMode = b.mode
  const washValue = String(Number(b.washValue)) as WashValue
  const email = b.email
  const name = b.name
  const phone = b.phone
  const mailingLine1 = b.mailingLine1
  const mailingLine2 = b.mailingLine2
  const mailingCity = b.mailingCity
  const mailingState = b.mailingState
  const mailingPostalCode = b.mailingPostalCode
  const mailingListSubscribed = b.mailingListSubscribed

  // Mode-dependent wash-value check drives pricing, so it stays explicit.
  if (purchaseMode === 'pack' && !VALID_WASH.has(pkg)) {
    return NextResponse.json({ error: 'Bad package' }, { status: 400 })
  }
  if (purchaseMode === 'single' && !VALID_WASH.has(washValue)) {
    return NextResponse.json({ error: 'Bad wash value' }, { status: 400 })
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
        // Mailing address — read back in the webhook to persist as the shipping
        // address for the physical tokens. (Stripe metadata values cap at 500
        // chars; address parts are well under that.)
        mail_line1: mailingLine1,
        mail_line2: mailingLine2,
        mail_city: mailingCity,
        mail_state: mailingState,
        mail_postal_code: mailingPostalCode,
        mail_list_subscribed: mailingListSubscribed ? 'true' : 'false',
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
