import 'server-only'
import Stripe from 'stripe'
import { getSupabaseAdmin } from './supabase'
import { getStripeSecretKey } from './stripeEnv'
import {
  getPricingSnapshot,
  invalidatePricingCache,
  mapSaleRow,
} from './pricingStore'
import {
  combinedCouponAmountCents,
  findWindowConflict,
  formatCents,
  saleState,
  type PriceKind,
  type SaleRecord,
  type WashValue,
} from './pricing/model'
import { formatSaleEndLabel } from './pricing/time'
import { adoptSku } from './stripeCatalog'

// The WRITE side of admin-managed pricing: the services behind the buttons on
// /admin/pricing. Every function here does two things that must stay in step —
// it changes something in Stripe and it records that change in Supabase — so
// the ordering is deliberate throughout: **Stripe first, then Supabase**.
//
// If Stripe succeeds and Supabase then fails, the result is an orphaned
// Stripe object that nothing references — inert, and visible in the audit log.
// The other order would point the storefront at a Stripe object that doesn't
// exist, which breaks checkout. Losing money is worse than leaving litter.

export type AdminResult<T = undefined> =
  | ({ ok: true; message: string } & (T extends undefined ? object : { data: T }))
  | { ok: false; message: string }

const CURRENCY = 'usd'

let stripeSingleton: Stripe | null = null
function getStripe(): Stripe | null {
  if (stripeSingleton) return stripeSingleton
  const key = getStripeSecretKey()
  if (!key) return null
  stripeSingleton = new Stripe(key)
  return stripeSingleton
}

function stripeMessage(err: unknown): string {
  if (err instanceof Stripe.errors.StripeError) return err.message
  return err instanceof Error ? err.message : 'Unknown error'
}

/**
 * Append to `pricing_audit_log`. Never throws and never fails the caller: a
 * lost log line must not roll back a price change that already happened in
 * Stripe. Failures are logged to the platform logs instead.
 */
async function audit(
  actorEmail: string | null,
  action: string,
  detail: Record<string, unknown>,
  succeeded = true,
): Promise<void> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return
  const { error } = await supabase.from('pricing_audit_log').insert({
    actor_email: actorEmail,
    action,
    detail,
    succeeded,
  })
  if (error) console.error('[pricingAdmin] audit write failed', { action, error })
}

// ---------------------------------------------------------------------------
// Catalog prices
// ---------------------------------------------------------------------------


/**
 * The Stripe Product a SKU's Prices hang off, created on demand.
 *
 * Looked up by a deterministic lookup key rather than by name so repeated
 * calls converge on one Product instead of littering the account with
 * duplicates — including across the two Stripe accounts, since the sandbox and
 * live account each get their own copy under the same key.
 */
async function findOrCreateProduct(
  stripe: Stripe,
  kind: PriceKind,
  washValue: WashValue,
): Promise<string> {
  const lookupKey = `spotless_${kind}_${washValue}`
  const search = await stripe.products
    .search({ query: `metadata['lookup_key']:'${lookupKey}'`, limit: 1 })
    .catch(() => null)
  const found = search?.data?.[0]
  if (found) return found.id

  const created = await stripe.products.create({
    name:
      kind === 'pack'
        ? `$${washValue} Wash Token — 4-Pack`
        : `$${washValue} Wash Token`,
    description:
      kind === 'pack'
        ? `Four pre-paid $${washValue} wash tokens for the Spotless automatic bays.`
        : `One pre-paid $${washValue} wash token for the Spotless automatic bays.`,
    shippable: true,
    metadata: { lookup_key: lookupKey, sku_kind: kind, wash_value: washValue, source: 'admin_pricing' },
  })
  return created.id
}

export type UpdatePriceInput = {
  kind: PriceKind
  washValue: WashValue
  unitAmountCents: number
  actorEmail: string | null
}

/**
 * Change what a SKU costs.
 *
 * Stripe Prices are immutable, so this creates a NEW Price on the same Product
 * and repoints `catalog_prices` at it. The previous Price is left ACTIVE in
 * Stripe on purpose — see the note on `shouldArchive` below.
 */
export async function updateCatalogPrice(
  input: UpdatePriceInput,
): Promise<AdminResult<{ stripePriceId: string }>> {
  const { kind, washValue, unitAmountCents, actorEmail } = input

  if (!Number.isInteger(unitAmountCents) || unitAmountCents <= 0) {
    return { ok: false, message: 'Enter a price greater than $0.00.' }
  }
  // A fat-fingered "3200" in a dollars field becomes $3,200. Nothing in this
  // catalog is anywhere near $500, so refuse rather than publish it.
  if (unitAmountCents > 50_000) {
    return {
      ok: false,
      message: `${formatCents(unitAmountCents)} looks like a typo — prices above $500 are blocked.`,
    }
  }

  const stripe = getStripe()
  const supabase = getSupabaseAdmin()
  if (!stripe) return { ok: false, message: 'Stripe is not configured for this deployment.' }
  if (!supabase) return { ok: false, message: 'The database is not configured for this deployment.' }

  const snapshot = await getPricingSnapshot()
  const current = snapshot.prices[kind][washValue]
  if (current?.cents === unitAmountCents) {
    return { ok: false, message: 'That is already the current price.' }
  }

  let newPriceId: string
  let productId: string | null = null
  try {
    // Resolve the Product to hang the new Price off. A SKU that has never been
    // priced through this tool has no Stripe Price to read a Product from, so
    // one is created — that's what keeps a new denomination from requiring a
    // trip to the Stripe dashboard.
    let existing: Stripe.Price | null = null
    if (current?.stripePriceId) {
      existing = await stripe.prices.retrieve(current.stripePriceId).catch(() => null)
    }

    if (existing) {
      productId = typeof existing.product === 'string' ? existing.product : existing.product.id
    } else {
      productId = await findOrCreateProduct(stripe, kind, washValue)
    }

    const created = await stripe.prices.create({
      product: productId,
      currency: CURRENCY,
      unit_amount: unitAmountCents,
      metadata: { sku_kind: kind, wash_value: washValue, source: 'admin_pricing' },
    })
    newPriceId = created.id

    // Point the Product at the new Price and stamp the SKU lookup key. This is
    // what makes the change authoritative: the app resolves prices from the
    // Product's default_price, so until this runs the new Price exists but
    // nothing is using it.
    await adoptSku(stripe, { productId, priceId: newPriceId, kind, washValue })

    // Archive the SUPERSEDED price only when this system created it. The
    // env-var Price IDs are the fallback the storefront reverts to when
    // Supabase is unreachable (see lib/pricingStore.ts) — archiving one would
    // turn a database blip into a checkout outage, because archived Prices
    // can't be used in new Checkout Sessions.
    const shouldArchive =
      existing?.metadata?.source === 'admin_pricing' && existing.id !== newPriceId
    if (shouldArchive && existing) {
      await stripe.prices.update(existing.id, { active: false }).catch((err) => {
        // Non-fatal: an un-archived old Price is clutter, not a defect.
        console.error('[pricingAdmin] archiving superseded price failed', err)
      })
    }
  } catch (err) {
    const message = stripeMessage(err)
    await audit(actorEmail, 'price.update', { kind, washValue, unitAmountCents, error: message }, false)
    return { ok: false, message: `Stripe rejected the new price: ${message}` }
  }

  // Deactivate the old row, then insert the new one. The partial unique index
  // allows only one active row per SKU, so this order avoids tripping it.
  const { error: deactivateError } = await supabase
    .from('catalog_prices')
    .update({ active: false })
    .eq('kind', kind)
    .eq('wash_value', washValue)
    .eq('active', true)

  if (deactivateError) {
    await audit(actorEmail, 'price.update', { kind, washValue, unitAmountCents, newPriceId, error: deactivateError.message }, false)
    return {
      ok: false,
      message: `Stripe Price ${newPriceId} was created but the database did not record it. Nothing changed for customers — retry, and tell Will if it keeps failing.`,
    }
  }

  const { error: insertError } = await supabase.from('catalog_prices').insert({
    kind,
    wash_value: washValue,
    unit_amount_cents: unitAmountCents,
    stripe_price_id: newPriceId,
    stripe_product_id: productId,
    active: true,
    created_by: actorEmail,
  })

  if (insertError) {
    await audit(actorEmail, 'price.update', { kind, washValue, unitAmountCents, newPriceId, error: insertError.message }, false)
    return {
      ok: false,
      message: `Stripe Price ${newPriceId} was created but could not be saved. The previous price is no longer marked active — reload and set the price again.`,
    }
  }

  await audit(actorEmail, 'price.update', {
    kind,
    washValue,
    from: current?.cents ?? null,
    to: unitAmountCents,
    stripePriceId: newPriceId,
  })
  invalidatePricingCache()

  return {
    ok: true,
    message: `$${washValue} ${kind} is now ${formatCents(unitAmountCents)}.`,
    data: { stripePriceId: newPriceId },
  }
}

/**
 * Make Stripe authoritative for a SKU without changing its price.
 *
 * Takes whatever Price the SKU currently resolves to, stamps the lookup key on
 * its Product and sets that Price as `default_price`. From then on the app
 * reads the price from Stripe, so editing it in the Stripe dashboard takes
 * effect on the site.
 *
 * Needed because the original Products were created by hand, long before this
 * tool existed — they carry no lookup key, so nothing can find them. Adoption
 * is idempotent and safe to re-run.
 */
export async function adoptCatalogSku(
  kind: PriceKind,
  washValue: WashValue,
  actorEmail: string | null,
): Promise<AdminResult> {
  const stripe = getStripe()
  if (!stripe) return { ok: false, message: 'Stripe is not configured for this deployment.' }

  const snapshot = await getPricingSnapshot()
  const current = snapshot.prices[kind][washValue]
  if (!current?.stripePriceId) {
    return {
      ok: false,
      message: `The $${washValue} ${kind} has no Stripe price yet — set a price first.`,
    }
  }

  try {
    const price = await stripe.prices.retrieve(current.stripePriceId)
    const productId = typeof price.product === 'string' ? price.product : price.product.id
    await adoptSku(stripe, { productId, priceId: price.id, kind, washValue })
    await audit(actorEmail, 'price.adopt', {
      kind,
      washValue,
      productId,
      priceId: price.id,
    })
  } catch (err) {
    const message = stripeMessage(err)
    await audit(actorEmail, 'price.adopt', { kind, washValue, error: message }, false)
    return { ok: false, message: `Stripe rejected the change: ${message}` }
  }

  invalidatePricingCache()
  return {
    ok: true,
    message: `The $${washValue} ${kind} now reads its price from Stripe.`,
  }
}

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------

/**
 * Create a one-off Stripe coupon worth `amountOffCents`.
 *
 * `duration: 'once'` matches the existing coupons and is what the
 * quantity-scaling logic in /api/checkout expects to derive from. `redeem_by`
 * is set to the sale's end so an expired sale can't be redeemed even if a
 * stale page is still advertising it.
 */
async function createCoupon(
  stripe: Stripe,
  args: { name: string; amountOffCents: number; redeemByMs?: number },
): Promise<string> {
  const coupon = await stripe.coupons.create({
    name: args.name,
    amount_off: args.amountOffCents,
    currency: CURRENCY,
    duration: 'once',
    ...(args.redeemByMs ? { redeem_by: Math.floor(args.redeemByMs / 1000) } : {}),
    metadata: { source: 'admin_pricing' },
  })
  return coupon.id
}

// ---------------------------------------------------------------------------
// Sales
// ---------------------------------------------------------------------------

export type SaleInput = {
  id?: string
  slug: string
  label: string
  badge: string
  emoji: string
  endLabel: string | null
  startMs: number
  endMs: number
  extraDiscountCents: number
  /** Publish immediately, or keep as an unprovisioned draft. */
  publish: boolean
  actorEmail: string | null
}

function validateSaleInput(input: SaleInput): string | null {
  if (!input.slug) return 'A sale needs a name.'
  if (!input.label.trim()) return 'A sale needs a label for the discount chip.'
  if (!input.badge.trim()) return 'A sale needs banner badge text.'
  if (!Number.isFinite(input.startMs) || !Number.isFinite(input.endMs)) {
    return 'Enter a valid start and end date.'
  }
  if (input.endMs <= input.startMs) return 'The sale must end after it starts.'
  if (!Number.isInteger(input.extraDiscountCents) || input.extraDiscountCents <= 0) {
    return 'Enter an extra discount greater than $0.00.'
  }
  // The coupon is a fixed amount off a ~$32 pack. Anything approaching the
  // pack price would make packs free or error at checkout.
  if (input.extraDiscountCents > 3_000) {
    return `${formatCents(input.extraDiscountCents)} off is more than a 4-pack is worth — cap the extra discount at $30.00.`
  }
  return null
}

/**
 * Create or update a sale, provisioning its Stripe coupon when published.
 *
 * Publishing is what makes a sale real: a draft has no coupon and is never
 * returned by the storefront. That split means an admin can write the copy for
 * next summer's sale today without any risk of it going live early.
 */
export async function saveSale(input: SaleInput): Promise<AdminResult<{ id: string }>> {
  const invalid = validateSaleInput(input)
  if (invalid) return { ok: false, message: invalid }

  const supabase = getSupabaseAdmin()
  if (!supabase) return { ok: false, message: 'The database is not configured for this deployment.' }

  const snapshot = await getPricingSnapshot()
  const baseDiscountCents = snapshot.settings.baseDiscountCents

  // Conflict check runs against every stored sale, not just the scheduled
  // ones the storefront caches, so an overlap with a sale outside the cached
  // set is still caught.
  const { data: existingRows, error: listError } = await supabase.from('sales').select('*')
  if (listError) {
    return { ok: false, message: 'Could not read the existing sales. Please try again.' }
  }
  const existing = (existingRows ?? []).map((r) => mapSaleRow(r as never))

  const status = input.publish ? 'scheduled' : 'draft'
  const conflict = findWindowConflict(
    { id: input.id, startMs: input.startMs, endMs: input.endMs, status },
    existing,
  )
  if (conflict) {
    return {
      ok: false,
      message: `That window overlaps the "${conflict.label}" sale. Two sales can't run at once — adjust the dates or cancel the other one first.`,
    }
  }

  const combined = combinedCouponAmountCents(baseDiscountCents, input.extraDiscountCents)
  const prior = input.id ? existing.find((s) => s.id === input.id) ?? null : null

  // Reuse the existing coupon only when it is still worth the right amount AND
  // still expires on the right day. Stripe coupons are immutable in both
  // `amount_off` and `redeem_by`, so either change means a new coupon — there
  // is no update path. Missing the end-date check would let an admin extend a
  // sale while its coupon kept the old `redeem_by`, so the banner would
  // advertise a discount that Stripe refuses to apply.
  const couponIsCurrent =
    prior?.stripeCouponId != null &&
    prior.stripeAmountOffCents === combined &&
    prior.endMs === input.endMs
  let couponId = couponIsCurrent ? prior!.stripeCouponId : null
  let amountOff = couponIsCurrent ? prior!.stripeAmountOffCents : null

  if (input.publish && !couponId) {
    const stripe = getStripe()
    if (!stripe) return { ok: false, message: 'Stripe is not configured for this deployment.' }
    try {
      couponId = await createCoupon(stripe, {
        name: `${input.label} — ${formatCents(combined)} off 4-pack`,
        amountOffCents: combined,
        redeemByMs: input.endMs,
      })
      amountOff = combined
    } catch (err) {
      const message = stripeMessage(err)
      await audit(input.actorEmail, 'sale.provision', { slug: input.slug, combined, error: message }, false)
      return { ok: false, message: `Stripe rejected the sale coupon: ${message}` }
    }
  }

  const row = {
    slug: input.slug,
    label: input.label.trim(),
    badge: input.badge.trim(),
    emoji: input.emoji.trim() || '✨',
    end_label: input.endLabel?.trim() || formatSaleEndLabel(input.endMs),
    starts_at: new Date(input.startMs).toISOString(),
    ends_at: new Date(input.endMs).toISOString(),
    extra_discount_cents: input.extraDiscountCents,
    stripe_coupon_id: couponId,
    stripe_amount_off_cents: amountOff,
    status,
    updated_at: new Date().toISOString(),
  }

  // A superseded coupon is deleted only AFTER the row points at the new one,
  // so a failure here can never leave the sale referencing a coupon that no
  // longer exists.
  const supersededCouponId =
    prior?.stripeCouponId && prior.stripeCouponId !== couponId
      ? prior.stripeCouponId
      : null

  const result = input.id
    ? await supabase.from('sales').update(row).eq('id', input.id).select('id').single()
    : await supabase
        .from('sales')
        .insert({ ...row, created_by: input.actorEmail })
        .select('id')
        .single()

  if (result.error) {
    const duplicate = result.error.code === '23505'
    await audit(input.actorEmail, 'sale.save', { slug: input.slug, error: result.error.message }, false)
    return {
      ok: false,
      message: duplicate
        ? `A sale named "${input.slug}" already exists. Pick a different name.`
        : 'Could not save that sale. Please try again.',
    }
  }

  if (supersededCouponId) {
    const stripe = getStripe()
    await stripe?.coupons.del(supersededCouponId).catch(() => {
      /* best effort — an orphaned coupon nothing references is harmless */
    })
  }

  await audit(input.actorEmail, input.id ? 'sale.update' : 'sale.create', {
    slug: input.slug,
    status,
    extraDiscountCents: input.extraDiscountCents,
    combined,
    couponId,
  })
  invalidatePricingCache()

  return {
    ok: true,
    message: input.publish
      ? `"${input.label}" is scheduled — ${formatCents(combined)} off every 4-pack during the window.`
      : `"${input.label}" saved as a draft. It won't reach customers until you publish it.`,
    data: { id: result.data.id },
  }
}

/** Publish a draft, provisioning its coupon. */
export async function publishSale(
  id: string,
  actorEmail: string | null,
): Promise<AdminResult> {
  const sale = await fetchSale(id)
  if (!sale) return { ok: false, message: 'That sale no longer exists.' }
  return saveSale({
    id: sale.id,
    slug: sale.slug,
    label: sale.label,
    badge: sale.badge,
    emoji: sale.emoji,
    endLabel: sale.endLabel,
    startMs: sale.startMs,
    endMs: sale.endMs,
    extraDiscountCents: sale.extraDiscountCents,
    publish: true,
    actorEmail,
  })
}

/**
 * Pull a sale. Canceled is terminal and immediate — including mid-window,
 * which is the "stop the discount NOW" button.
 *
 * The Stripe coupon is deleted too, so the discount stops applying even to a
 * checkout started from a cached page. Deleting a coupon does not affect
 * orders that already redeemed it.
 */
export async function cancelSale(
  id: string,
  actorEmail: string | null,
): Promise<AdminResult> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return { ok: false, message: 'The database is not configured for this deployment.' }

  const sale = await fetchSale(id)
  if (!sale) return { ok: false, message: 'That sale no longer exists.' }

  const { error } = await supabase
    .from('sales')
    .update({ status: 'canceled', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    await audit(actorEmail, 'sale.cancel', { id, error: error.message }, false)
    return { ok: false, message: 'Could not cancel that sale. Please try again.' }
  }

  invalidatePricingCache()

  const stripe = getStripe()
  if (stripe && sale.stripeCouponId) {
    // Best effort. The row is already canceled, so the storefront has stopped
    // offering the sale regardless of what Stripe says here.
    await stripe.coupons.del(sale.stripeCouponId).catch((err) => {
      console.error('[pricingAdmin] deleting sale coupon failed', {
        couponId: sale.stripeCouponId,
        err,
      })
    })
  }

  await audit(actorEmail, 'sale.cancel', {
    slug: sale.slug,
    wasLive: saleState(sale) === 'live',
    couponId: sale.stripeCouponId,
  })

  return {
    ok: true,
    message:
      saleState(sale) === 'live'
        ? `"${sale.label}" has been pulled. The discount stops applying immediately.`
        : `"${sale.label}" has been canceled.`,
  }
}

/**
 * Re-issue a sale's coupon at the amount the CURRENT base discount implies.
 * Used to clear the drift warning after the base bundle discount changes.
 */
export async function reprovisionSale(
  id: string,
  actorEmail: string | null,
): Promise<AdminResult> {
  const sale = await fetchSale(id)
  if (!sale) return { ok: false, message: 'That sale no longer exists.' }
  if (saleState(sale) === 'ended') {
    return { ok: false, message: 'That sale has already ended.' }
  }

  const stripe = getStripe()
  const supabase = getSupabaseAdmin()
  if (!stripe) return { ok: false, message: 'Stripe is not configured for this deployment.' }
  if (!supabase) return { ok: false, message: 'The database is not configured for this deployment.' }

  const { settings } = await getPricingSnapshot()
  const combined = combinedCouponAmountCents(settings.baseDiscountCents, sale.extraDiscountCents)

  let couponId: string
  try {
    couponId = await createCoupon(stripe, {
      name: `${sale.label} — ${formatCents(combined)} off 4-pack`,
      amountOffCents: combined,
      redeemByMs: sale.endMs,
    })
  } catch (err) {
    const message = stripeMessage(err)
    await audit(actorEmail, 'sale.reprovision', { id, combined, error: message }, false)
    return { ok: false, message: `Stripe rejected the new coupon: ${message}` }
  }

  const { error } = await supabase
    .from('sales')
    .update({
      stripe_coupon_id: couponId,
      stripe_amount_off_cents: combined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    await audit(actorEmail, 'sale.reprovision', { id, couponId, error: error.message }, false)
    return { ok: false, message: 'The new coupon was created but could not be saved. Please try again.' }
  }

  const stale = sale.stripeCouponId
  if (stale && stale !== couponId) {
    await stripe.coupons.del(stale).catch(() => {
      /* best effort — a stale coupon nothing references is harmless */
    })
  }

  await audit(actorEmail, 'sale.reprovision', { slug: sale.slug, combined, couponId })
  invalidatePricingCache()
  return { ok: true, message: `"${sale.label}" now applies ${formatCents(combined)} off.` }
}

async function fetchSale(id: string): Promise<SaleRecord | null> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return null
  const { data, error } = await supabase.from('sales').select('*').eq('id', id).maybeSingle()
  if (error || !data) return null
  return mapSaleRow(data as never)
}

// ---------------------------------------------------------------------------
// Base bundle discount
// ---------------------------------------------------------------------------

/**
 * Change the always-on 4-pack bundle discount.
 *
 * This is the discount every pack gets outside a sale window, and the floor a
 * sale's coupon is built on. Changing it does NOT re-issue the coupons of
 * already-scheduled sales — Stripe coupon amounts are immutable — so those go
 * into drift and the UI prompts to re-provision them.
 */
export async function updateBaseDiscount(
  cents: number,
  actorEmail: string | null,
): Promise<AdminResult> {
  if (!Number.isInteger(cents) || cents <= 0) {
    return { ok: false, message: 'Enter a bundle discount greater than $0.00.' }
  }
  if (cents > 2_000) {
    return { ok: false, message: 'The bundle discount is capped at $20.00.' }
  }

  const stripe = getStripe()
  const supabase = getSupabaseAdmin()
  if (!stripe) return { ok: false, message: 'Stripe is not configured for this deployment.' }
  if (!supabase) return { ok: false, message: 'The database is not configured for this deployment.' }

  const { settings } = await getPricingSnapshot()
  if (settings.baseDiscountCents === cents) {
    return { ok: false, message: 'That is already the current bundle discount.' }
  }

  let couponId: string
  try {
    // No redeem_by — this coupon is always on.
    couponId = await createCoupon(stripe, {
      name: `4-Pack bundle — ${formatCents(cents)} off`,
      amountOffCents: cents,
    })
  } catch (err) {
    const message = stripeMessage(err)
    await audit(actorEmail, 'settings.baseDiscount', { cents, error: message }, false)
    return { ok: false, message: `Stripe rejected the new coupon: ${message}` }
  }

  const { error } = await supabase.from('pricing_settings').upsert({
    id: 1,
    base_discount_cents: cents,
    base_coupon_id: couponId,
    updated_at: new Date().toISOString(),
    updated_by: actorEmail,
  })

  if (error) {
    await audit(actorEmail, 'settings.baseDiscount', { cents, couponId, error: error.message }, false)
    return { ok: false, message: 'The new coupon was created but could not be saved. Please try again.' }
  }

  await audit(actorEmail, 'settings.baseDiscount', {
    from: settings.baseDiscountCents,
    to: cents,
    couponId,
  })
  invalidatePricingCache()

  return {
    ok: true,
    message: `Every 4-pack now saves ${formatCents(cents)}. Scheduled sales still carry their old coupon — re-issue any that show as out of date.`,
  }
}
