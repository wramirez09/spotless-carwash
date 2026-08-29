import 'server-only'
import type Stripe from 'stripe'
import { getSupabaseAdmin } from './supabase'
import { subscribeToPromotions } from './promotions'
import { DEFAULT_SUBSCRIPTION_WASH_VALUE } from './subscriptionPricing'

// Write-side of the Wash Token Subscription. Mirrors the contract used by the
// one-time order persistence in app/api/stripe-webhook: every function is
// best-effort and never throws, so a Supabase outage can't make the webhook
// return non-200 and send Stripe into an infinite retry loop.

const SUBSCRIPTIONS = 'subscriptions'
const FULFILLMENTS = 'fulfillments'

export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'paused'
  | 'canceled'
  | 'incomplete'

type ShipAddress = {
  line1: string | null
  line2: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  country: string
}

const EMPTY_ADDRESS: ShipAddress = {
  line1: null,
  line2: null,
  city: null,
  state: null,
  postalCode: null,
  country: 'US',
}

function toShipAddress(address: Stripe.Address | null | undefined): ShipAddress {
  if (!address) return EMPTY_ADDRESS
  return {
    line1: address.line1 || null,
    line2: address.line2 || null,
    city: address.city || null,
    state: address.state || null,
    postalCode: address.postal_code || null,
    country: address.country || 'US',
  }
}

/**
 * Shipping address from the `mail_*` session metadata our own form writes.
 * Returns null when line1 is absent so the caller can fall back.
 */
function metaShipAddress(
  meta: Record<string, string> | null | undefined,
): ShipAddress | null {
  const line1 = meta?.mail_line1?.trim()
  if (!line1) return null
  return {
    line1,
    line2: meta?.mail_line2?.trim() || null,
    city: meta?.mail_city?.trim() || null,
    state: meta?.mail_state?.trim() || null,
    postalCode: meta?.mail_postal_code?.trim() || null,
    country: 'US',
  }
}

function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null
  return typeof value === 'string' ? value : value.id
}

/**
 * Map a Stripe subscription status onto ours. Stripe's `unpaid` and
 * `incomplete_expired` both mean "stop shipping", so they collapse to
 * 'canceled'; `trialing` ships like an active plan.
 */
export function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'active'
    case 'past_due':
      return 'past_due'
    case 'paused':
      return 'paused'
    case 'incomplete':
      return 'incomplete'
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
    default:
      return 'canceled'
  }
}

/**
 * Create (or refresh) the subscription row after a subscription-mode Checkout
 * Session completes. Also upserts the customer, so a subscriber who has never
 * bought a one-time pack still gets a `customers` record.
 *
 * Deliberately does NOT create a fulfillment — Stripe fires `invoice.paid` for
 * the first cycle within seconds of this event, and that is the sole shipment
 * trigger. Doing it here as well would ship cycle one twice.
 */
export async function persistSubscriptionFromSession(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    console.warn('[subscriptions] Supabase not configured — skipping', {
      sessionId: session.id,
    })
    return
  }

  const stripeSubscriptionId = idOf(session.subscription)
  if (!stripeSubscriptionId) {
    console.error('[subscriptions] session has no subscription id', {
      sessionId: session.id,
    })
    return
  }

  const email = session.customer_details?.email ?? session.customer_email ?? ''
  if (!email) {
    console.error('[subscriptions] session has no email', { sessionId: session.id })
    return
  }

  const meta = session.metadata ?? {}
  const name = meta.customer_name ?? session.customer_details?.name ?? ''
  const phone = session.customer_details?.phone ?? meta.customer_phone ?? ''
  // The mailing address comes from OUR form, carried in session metadata — the
  // same `mail_*` convention the one-time order flow uses. Stripe's own
  // shipping step is disabled, but fall back to it (and then to the billing
  // address) so a session created before this change still persists somewhere.
  const ship = metaShipAddress(meta) ??
    toShipAddress(
      session.collected_information?.shipping_details?.address ??
        session.customer_details?.address,
    )
  const mailingListSubscribed = meta.mail_list_subscribed === 'true'

  try {
    const { data: customer, error: customerErr } = await supabase
      .from('customers')
      .upsert(
        {
          email,
          name: name || null,
          phone: phone || null,
          mailing_line1: ship.line1,
          mailing_line2: ship.line2,
          mailing_city: ship.city,
          mailing_state: ship.state,
          mailing_postal_code: ship.postalCode,
          mailing_country: ship.country,
          mailing_list_subscribed: mailingListSubscribed,
          billing_address: session.customer_details?.address ?? null,
          stripe_customer_id: idOf(session.customer),
        },
        { onConflict: 'email' },
      )
      .select('id')
      .single()

    if (customerErr) throw customerErr

    // Mirror the marketing opt-in, isolated so a promotions failure can never
    // stop the subscription row from being written.
    if (mailingListSubscribed && customer?.id) {
      try {
        const promo = await subscribeToPromotions({
          email,
          name: name || null,
          phone: phone || null,
          source: 'subscription',
          marketingConsent: true,
          confirmResubscribe: true,
          customerId: customer.id,
        })
        if (!promo.ok) {
          console.error('[subscriptions] promotion signup failed', {
            sessionId: session.id,
            reason: promo.reason,
          })
        }
      } catch (promoErr) {
        console.error('[subscriptions] promotion signup threw', {
          sessionId: session.id,
          error: promoErr,
        })
      }
    }

    const { error: subErr } = await supabase.from(SUBSCRIPTIONS).upsert(
      {
        customer_id: customer?.id ?? null,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_customer_id: idOf(session.customer),
        email,
        name: name || null,
        phone: phone || null,
        plan: meta.plan ?? null,
        tokens_per_cycle: Number(meta.tokens_per_cycle ?? 0) || null,
        wash_value: meta.wash_value ?? DEFAULT_SUBSCRIPTION_WASH_VALUE,
        status: 'active' satisfies SubscriptionStatus,
        ship_line1: ship.line1,
        ship_line2: ship.line2,
        ship_city: ship.city,
        ship_state: ship.state,
        ship_postal_code: ship.postalCode,
        ship_country: ship.country,
      },
      { onConflict: 'stripe_subscription_id' },
    )

    if (subErr) throw subErr
  } catch (err) {
    console.error('[subscriptions] persist failed', { sessionId: session.id, error: err })
  }
}

export type FulfillmentResult = {
  /** True only when THIS delivery created the row — drives the owner email. */
  isNew: boolean
  tokensCount: number
  email: string
}

/**
 * Queue one shipment for a paid invoice.
 *
 * `invoice.paid` is the only fulfillment trigger: for card payments it fires on
 * successful capture, so nothing is ever queued against money that has not
 * posted. A dunning retry that eventually succeeds fires `invoice.paid` for the
 * SAME invoice, which the unique `stripe_invoice_id` collapses to one shipment.
 */
export async function recordFulfillmentForInvoice(
  invoice: Stripe.Invoice,
): Promise<FulfillmentResult | null> {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    console.warn('[subscriptions] Supabase not configured — skipping fulfillment', {
      invoiceId: invoice.id,
    })
    return null
  }

  // Stripe SDK v22: the subscription moved under `parent.subscription_details`.
  const details = invoice.parent?.subscription_details ?? null
  const stripeSubscriptionId = idOf(details?.subscription)
  if (!stripeSubscriptionId) {
    // A one-off invoice, not a subscription renewal. Nothing to ship.
    return null
  }

  try {
    const { data: sub, error: subErr } = await supabase
      .from(SUBSCRIPTIONS)
      .select('id, email, tokens_per_cycle, wash_value, status')
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .maybeSingle()

    if (subErr) throw subErr
    if (!sub) {
      // Stripe does not guarantee event ordering, so `invoice.paid` can beat
      // `checkout.session.completed`. Fall back to the metadata snapshot Stripe
      // froze onto the invoice at finalization rather than dropping the
      // shipment; the session handler will fill in the address moments later.
      console.warn('[subscriptions] no subscription row yet for invoice', {
        invoiceId: invoice.id,
        stripeSubscriptionId,
      })
    }

    const snapshot = details?.metadata ?? {}
    const tokensCount =
      sub?.tokens_per_cycle ?? Number(snapshot.tokens_per_cycle ?? 0) ?? 0
    if (!tokensCount) {
      console.error('[subscriptions] cannot determine token count for invoice', {
        invoiceId: invoice.id,
      })
      return null
    }

    const { data: inserted, error: fulfillErr } = await supabase
      .from(FULFILLMENTS)
      .upsert(
        {
          subscription_id: sub?.id ?? null,
          stripe_invoice_id: invoice.id,
          period_start: new Date(invoice.period_start * 1000).toISOString(),
          period_end: new Date(invoice.period_end * 1000).toISOString(),
          tokens_count: tokensCount,
          wash_value: sub?.wash_value ?? snapshot.wash_value ?? DEFAULT_SUBSCRIPTION_WASH_VALUE,
          status: 'pending',
        },
        { onConflict: 'stripe_invoice_id', ignoreDuplicates: true },
      )
      .select('id')

    if (fulfillErr) throw fulfillErr

    // A paid invoice also clears a past_due state from an earlier failure.
    if (sub?.id && sub.status !== 'active') {
      await supabase
        .from(SUBSCRIPTIONS)
        .update({ status: 'active' })
        .eq('id', sub.id)
    }

    return {
      isNew: (inserted?.length ?? 0) > 0,
      tokensCount,
      email: sub?.email ?? invoice.customer_email ?? '',
    }
  } catch (err) {
    console.error('[subscriptions] fulfillment failed', {
      invoiceId: invoice.id,
      error: err,
    })
    return null
  }
}

/** Sync status, plan and shipping address from a Stripe Subscription object. */
export async function syncSubscription(
  subscription: Stripe.Subscription,
): Promise<void> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return

  const meta = subscription.metadata ?? {}
  const patch: Record<string, unknown> = {
    status: mapStripeStatus(subscription.status),
  }
  if (meta.plan) patch.plan = meta.plan
  if (meta.tokens_per_cycle) patch.tokens_per_cycle = Number(meta.tokens_per_cycle)
  if (meta.wash_value) patch.wash_value = meta.wash_value

  try {
    const { error } = await supabase
      .from(SUBSCRIPTIONS)
      .update(patch)
      .eq('stripe_subscription_id', subscription.id)
    if (error) throw error
  } catch (err) {
    console.error('[subscriptions] sync failed', {
      subscriptionId: subscription.id,
      error: err,
    })
  }
}

/**
 * Keep the shipping address current when a subscriber edits it in the Stripe
 * Customer Portal. Without this, pending shipments would be mailed to a stale
 * address. Only touches rows still open for shipping.
 */
export async function syncShippingAddress(customer: Stripe.Customer): Promise<void> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return

  const ship = toShipAddress(customer.shipping?.address ?? customer.address)
  if (!ship.line1) return

  try {
    const { error } = await supabase
      .from(SUBSCRIPTIONS)
      .update({
        ship_line1: ship.line1,
        ship_line2: ship.line2,
        ship_city: ship.city,
        ship_state: ship.state,
        ship_postal_code: ship.postalCode,
        ship_country: ship.country,
      })
      .eq('stripe_customer_id', customer.id)
    if (error) throw error
  } catch (err) {
    console.error('[subscriptions] address sync failed', {
      customerId: customer.id,
      error: err,
    })
  }
}

/** Mark a subscription past_due after a failed payment. Never ships anything. */
export async function markSubscriptionStatus(
  stripeSubscriptionId: string,
  status: SubscriptionStatus,
): Promise<void> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return
  try {
    const { error } = await supabase
      .from(SUBSCRIPTIONS)
      .update({ status })
      .eq('stripe_subscription_id', stripeSubscriptionId)
    if (error) throw error
  } catch (err) {
    console.error('[subscriptions] status update failed', {
      stripeSubscriptionId,
      status,
      error: err,
    })
  }
}
