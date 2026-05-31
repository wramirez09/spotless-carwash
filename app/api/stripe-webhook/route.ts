import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripeSecretKey, getStripeWebhookSecret } from '@/lib/stripeEnv'
import { sendOwnerSaleNotification } from '@/lib/email'

export const runtime = 'nodejs'

function generateTokenCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/1/O/I for legibility
  let body = ''
  for (let i = 0; i < 10; i++) {
    body += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return `SPL-${body}`
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
    const purchaseMode = expanded.metadata?.mode ?? 'pack'
    const washValue = expanded.metadata?.wash_value ?? ''
    const quantity = Number(expanded.metadata?.quantity ?? 1)

    if (email && codes.length > 0) {
      // TODO: persist codes to a DB tied to email + sessionId. Storage approach
      // is still undecided, so codes currently live only in the owner email.
      await sendOwnerSaleNotification({
        customerName: name,
        customerEmail: email,
        customerPhone: expanded.customer_details?.phone ?? expanded.metadata?.customer_phone ?? '',
        address: expanded.customer_details?.address
          ? {
              line1: expanded.customer_details.address.line1,
              line2: expanded.customer_details.address.line2,
              city: expanded.customer_details.address.city,
              state: expanded.customer_details.address.state,
              postalCode: expanded.customer_details.address.postal_code,
              country: expanded.customer_details.address.country,
            }
          : null,
        mode: purchaseMode,
        washValue,
        quantity,
        totalTokens: totalTokens,
        amountTotal: expanded.amount_total,
        currency: expanded.currency,
        codes,
        sessionId: expanded.id,
      })
    }
  }

  return NextResponse.json({ received: true })
}
