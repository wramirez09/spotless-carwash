import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripeSecretKey, getStripeWebhookSecret } from '@/lib/stripeEnv'
import { sendOwnerSaleNotification } from '@/lib/email'
import { getSupabaseAdmin } from '@/lib/supabase'
import { subscribeToPromotions } from '@/lib/promotions'

export const runtime = 'nodejs'

function generateTokenCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/1/O/I for legibility
  let body = ''
  for (let i = 0; i < 10; i++) {
    body += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return `SPL-${body}`
}

type Persisted = {
  // Whether THIS delivery created the order row. Stripe can deliver a webhook
  // more than once; we only act (notify the owner) on the first, real insert.
  isNewOrder: boolean
}

/**
 * Persist the customer and their order after a successful checkout. Customers
 * are keyed by email (upserted so repeat buyers update their profile); orders
 * are keyed by stripe_session_id (insert-or-ignore, so a retried webhook never
 * creates a duplicate order or re-issues codes). Best-effort: if Supabase is
 * unconfigured or errors, we log and return null so the webhook still 200s and
 * Stripe does not retry forever.
 */
async function persistCustomerAndOrder(args: {
  session: Stripe.Checkout.Session
  email: string
  name: string
  phone: string
  mode: string
  washValue: string
  packageSize: number
  quantity: number
  totalTokens: number
  codes: string[]
  mailing: {
    line1: string
    line2: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  mailingListSubscribed: boolean
  billing: Stripe.Address | null
}): Promise<Persisted | null> {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    console.warn('[stripe-webhook] Supabase not configured — skipping persistence', {
      sessionId: args.session.id,
    })
    return null
  }

  try {
    const stripeCustomerId =
      typeof args.session.customer === 'string'
        ? args.session.customer
        : (args.session.customer?.id ?? null)

    const { data: customer, error: customerErr } = await supabase
      .from('customers')
      .upsert(
        {
          email: args.email,
          name: args.name || null,
          phone: args.phone || null,
          mailing_line1: args.mailing.line1 || null,
          mailing_line2: args.mailing.line2 || null,
          mailing_city: args.mailing.city || null,
          mailing_state: args.mailing.state || null,
          mailing_postal_code: args.mailing.postalCode || null,
          mailing_country: args.mailing.country || 'US',
          mailing_list_subscribed: args.mailingListSubscribed,
          billing_address: args.billing,
          stripe_customer_id: stripeCustomerId,
        },
        { onConflict: 'email' },
      )
      .select('id')
      .single()

    if (customerErr) throw customerErr

    // Mirror the checkout marketing opt-in into the promotions list, linked to
    // the customer row. Best-effort: subscribeToPromotions never throws, and a
    // ticked checkbox is explicit consent, so we confirm any re-subscribe
    // directly rather than gating it.
    if (args.mailingListSubscribed && customer?.id) {
      // Fully isolated from order persistence below — a promotions failure must
      // never prevent the order row from being written.
      try {
        const promo = await subscribeToPromotions({
          email: args.email,
          name: args.name || null,
          phone: args.phone || null,
          source: 'checkout',
          marketingConsent: true,
          confirmResubscribe: true,
          customerId: customer.id,
        })
        if (!promo.ok) {
          console.error('[stripe-webhook] promotion signup failed', {
            sessionId: args.session.id,
            reason: promo.reason,
          })
        }
      } catch (promoErr) {
        console.error('[stripe-webhook] promotion signup threw', {
          sessionId: args.session.id,
          error: promoErr,
        })
      }
    }

    const { data: inserted, error: orderErr } = await supabase
      .from('orders')
      .upsert(
        {
          customer_id: customer?.id ?? null,
          stripe_session_id: args.session.id,
          stripe_customer_id: stripeCustomerId,
          email: args.email,
          name: args.name || null,
          phone: args.phone || null,
          mode: args.mode,
          wash_value: args.washValue,
          package_size: args.packageSize,
          quantity: args.quantity,
          total_tokens: args.totalTokens,
          codes: args.codes,
          amount_total: args.session.amount_total,
          currency: args.session.currency,
          pack_discount: args.session.metadata?.pack_discount || null,
          status: 'paid',
          mailing_line1: args.mailing.line1 || null,
          mailing_line2: args.mailing.line2 || null,
          mailing_city: args.mailing.city || null,
          mailing_state: args.mailing.state || null,
          mailing_postal_code: args.mailing.postalCode || null,
          mailing_country: args.mailing.country || 'US',
          billing_address: args.billing,
        },
        { onConflict: 'stripe_session_id', ignoreDuplicates: true },
      )
      .select('id')

    if (orderErr) throw orderErr

    return { isNewOrder: (inserted?.length ?? 0) > 0 }
  } catch (err) {
    console.error('[stripe-webhook] persistence failed', {
      sessionId: args.session.id,
      error: err,
    })
    return null
  }
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
    const phone = expanded.customer_details?.phone ?? expanded.metadata?.customer_phone ?? ''
    const purchaseMode = expanded.metadata?.mode ?? 'pack'
    const washValue = expanded.metadata?.wash_value ?? ''
    const quantity = Number(expanded.metadata?.quantity ?? 1)
    const packageSize = Number(expanded.metadata?.package_size ?? 0)

    // Mailing address — the shipping destination collected in the buy-tokens
    // form and carried here via session metadata. Distinct from the Stripe
    // billing address (customer_details.address).
    const mailing = {
      line1: expanded.metadata?.mail_line1 ?? '',
      line2: expanded.metadata?.mail_line2 ?? '',
      city: expanded.metadata?.mail_city ?? '',
      state: expanded.metadata?.mail_state ?? '',
      postalCode: expanded.metadata?.mail_postal_code ?? '',
      country: 'US',
    }
    const billing = expanded.customer_details?.address ?? null
    const mailingListSubscribed = expanded.metadata?.mail_list_subscribed === 'true'

    if (email && codes.length > 0) {
      // Persist first, then notify. Persistence is idempotent on the Stripe
      // session id; `isNewOrder` is false on a retried delivery, so the owner
      // is only emailed once per real order. When Supabase is unconfigured
      // (result is null) we fall back to always sending, preserving the prior
      // notify-only behavior.
      const persisted = await persistCustomerAndOrder({
        session: expanded,
        email,
        name,
        phone,
        mode: purchaseMode,
        washValue,
        packageSize,
        quantity,
        totalTokens,
        codes,
        mailing,
        mailingListSubscribed,
        billing,
      })

      if (!persisted || persisted.isNewOrder) {
        await sendOwnerSaleNotification({
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          // Prefer the mailing address (where tokens ship); fall back to the
          // Stripe billing address if metadata is somehow missing.
          address: mailing.line1
            ? {
                line1: mailing.line1,
                line2: mailing.line2 || null,
                city: mailing.city,
                state: mailing.state,
                postalCode: mailing.postalCode,
                country: mailing.country,
              }
            : billing
              ? {
                  line1: billing.line1,
                  line2: billing.line2,
                  city: billing.city,
                  state: billing.state,
                  postalCode: billing.postal_code,
                  country: billing.country,
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
  }

  return NextResponse.json({ received: true })
}
