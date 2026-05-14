import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'

const PRICES: Record<string, string | undefined> = {
  '5': process.env.STRIPE_PRICE_5,
  '10': process.env.STRIPE_PRICE_10,
  '25': process.env.STRIPE_PRICE_25,
}

type Body = {
  package?: '5' | '10' | '25'
  quantity?: number
  email?: string
  name?: string
  phone?: string
}

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

  const pkg = body.package
  const quantity = Math.max(1, Math.min(20, Number(body.quantity) || 1))
  const email = (body.email ?? '').trim()
  const name = (body.name ?? '').trim()
  const phone = (body.phone ?? '').trim()

  if (!pkg || !PRICES[pkg]) {
    return NextResponse.json({ error: 'Bad package' }, { status: 400 })
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }
  if (!name) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 })
  }

  const stripe = new Stripe(secret)

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: [{ price: PRICES[pkg]!, quantity }],
      success_url: `${siteUrl}/buy-tokens/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/buy-tokens`,
      allow_promotion_codes: true,
      automatic_tax: { enabled: true },
      phone_number_collection: { enabled: !phone },
      metadata: {
        customer_name: name,
        customer_phone: phone,
        package_size: pkg,
        quantity: String(quantity),
      },
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
