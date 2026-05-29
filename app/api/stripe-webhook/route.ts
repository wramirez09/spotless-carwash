import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripeSecretKey, getStripeWebhookSecret } from '@/lib/stripeEnv'

export const runtime = 'nodejs'

function generateTokenCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/1/O/I for legibility
  let body = ''
  for (let i = 0; i < 10; i++) {
    body += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return `SPL-${body}`
}

async function persistAndEmailTokens(args: {
  email: string
  name: string
  quantity: number
  packageSize: string
  mode: string
  washValue: string
  codes: string[]
  sessionId: string
}) {
  // TODO: persist codes to your DB tied to args.email + args.sessionId.
  // TODO: send transactional email with the codes (Resend / Postmark / SendGrid).
  // The project does not yet have an email provider installed, so for now we log
  // a structured record — replace this with the real integration when ready.
  console.log('[stripe-webhook] tokens issued', {
    email: args.email,
    name: args.name,
    quantity: args.quantity,
    packageSize: args.packageSize,
    mode: args.mode,
    washValue: args.washValue,
    sessionId: args.sessionId,
    codes: args.codes,
  })
}

export async function POST(req: Request) {
  const secret = getStripeSecretKey()
  const webhookSecret = getStripeWebhookSecret()
  if (!secret || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe webhook not configured' }, { status: 500 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const stripe = new Stripe(secret)
  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'bad signature'
    return NextResponse.json({ error: `Webhook signature failed: ${message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const expanded = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items'],
    })
    const lineItems = expanded.line_items?.data ?? []
    const totalTokens = lineItems.reduce((sum, li) => {
      const packSize = Number(expanded.metadata?.package_size ?? 0)
      return sum + packSize * (li.quantity ?? 0)
    }, 0)

    const codes = Array.from({ length: totalTokens }, generateTokenCode)
    const email = expanded.customer_details?.email ?? expanded.customer_email ?? ''
    const name = expanded.metadata?.customer_name ?? ''
    const packageSize = expanded.metadata?.package_size ?? ''
    const purchaseMode = expanded.metadata?.mode ?? 'pack'
    const washValue = expanded.metadata?.wash_value ?? ''
    const quantity = Number(expanded.metadata?.quantity ?? 1)

    if (email && codes.length > 0) {
      await persistAndEmailTokens({
        email,
        name,
        quantity,
        packageSize,
        mode: purchaseMode,
        washValue,
        codes,
        sessionId: expanded.id,
      })
    }
  }

  return NextResponse.json({ received: true })
}
