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
  PACK_TOKEN_COUNT,
  WASH_VALUES,
  combinedCouponAmountCents,
  findWindowConflict,
  formatCents,
  parseSkuLookupKey,
  saleState,
  skuLookupKey,
  skuProductName,
  validatePriceCents,
  validateSkuInput,
  type PriceKind,
  type SaleRecord,
} from './pricing/model'
import { formatSaleEndLabel } from './pricing/time'
import { adoptSku, loadStripeCatalog } from './stripeCatalog'

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
export function getStripe(): Stripe | null {
  if (stripeSingleton) return stripeSingleton
  const key = getStripeSecretKey()
  if (!key) return null
  stripeSingleton = new Stripe(key)
  return stripeSingleton
}

export function stripeMessage(err: unknown): string {
  if (err instanceof Stripe.errors.StripeError) return err.message
  return err instanceof Error ? err.message : 'Unknown error'
}

/**
 * Append to `pricing_audit_log`. Never throws and never fails the caller: a
 * lost log line must not roll back a price change that already happened in
 * Stripe. Failures are logged to the platform logs instead.
 */
export async function audit(
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
// Catalog (one-time token SKUs)
// ---------------------------------------------------------------------------

/**
 * Best-effort history row in `catalog_prices`.
 *
 * Stripe is authoritative — by the time this runs the Product already points
 * at the new Price, so customers are already seeing it. The row only exists
 * as a price history and as the fallback for when Stripe can't be listed, and
 * its CHECK constraints only admit the original eight SKUs. So it is written
 * for those, never for a custom pack size, and a failure is logged rather
 * than reported as a failed price change.
 */
async function recordPriceHistory(args: {
  kind: PriceKind
  washValue: string
  tokens: number
  cents: number
  priceId: string
  productId: string
  actorEmail: string | null
}): Promise<void> {
  const legacyShape =
    (WASH_VALUES as readonly string[]).includes(args.washValue) &&
    (args.kind === 'single' || args.tokens === PACK_TOKEN_COUNT)
  if (!legacyShape) return
  const supabase = getSupabaseAdmin()
  if (!supabase) return

  // Deactivate first: the partial unique index allows one active row per SKU.
  const { error: deactivateError } = await supabase
    .from('catalog_prices')
    .update({ active: false })
    .eq('kind', args.kind)
    .eq('wash_value', args.washValue)
    .eq('active', true)
  if (deactivateError) {
    console.error('[pricingAdmin] price history deactivate failed', deactivateError)
    return
  }
  const { error: insertError } = await supabase.from('catalog_prices').insert({
    kind: args.kind,
    wash_value: args.washValue,
    unit_amount_cents: args.cents,
    stripe_price_id: args.priceId,
    stripe_product_id: args.productId,
    active: true,
    created_by: args.actorEmail,
  })
  if (insertError) console.error('[pricingAdmin] price history insert failed', insertError)
}

/** Deactivate the history row so the Stripe-down fallback forgets a deleted SKU. */
async function retirePriceHistory(kind: PriceKind, washValue: string): Promise<void> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return
  const { error } = await supabase
    .from('catalog_prices')
    .update({ active: false })
    .eq('kind', kind)
    .eq('wash_value', washValue)
    .eq('active', true)
  if (error) console.error('[pricingAdmin] price history retire failed', error)
}

function describeSku(s: { kind: PriceKind; washValue: string; tokens: number }): string {
  return s.kind === 'single'
    ? `$${s.washValue} single token`
    : `$${s.washValue} ${s.tokens}-pack`
}

/**
 * The Product a SKU lives on, if Stripe or the deploy config knows of one.
 *
 * Checks the Stripe catalog first (including ARCHIVED Products, so deleting
 * and re-creating a SKU reuses its Product instead of littering the account
 * with duplicates), then a legacy SKU's env-var Price.
 */
async function locateSku(
  stripe: Stripe,
  sku: string,
): Promise<{
  productId: string | null
  current: { priceId: string; cents: number | null } | null
  archived: boolean
  catalogOk: boolean
}> {
  const catalog = await loadStripeCatalog(stripe)
  const keyed = catalog.skus.get(sku)
  if (keyed) {
    return {
      productId: keyed.productId,
      current: keyed.active && keyed.stripePriceId
        ? { priceId: keyed.stripePriceId, cents: keyed.cents }
        : null,
      archived: !keyed.active,
      catalogOk: catalog.ok,
    }
  }
  // Not keyed in Stripe. A legacy SKU may still be on sale from an env-var
  // Price whose hand-made Product carries no lookup key.
  const snapshot = await getPricingSnapshot({ fresh: true })
  const legacy = snapshot.catalog.find((s) => s.sku === sku)
  if (legacy?.stripePriceId) {
    const price = await stripe.prices.retrieve(legacy.stripePriceId).catch(() => null)
    if (price) {
      return {
        productId: typeof price.product === 'string' ? price.product : price.product.id,
        current: { priceId: price.id, cents: price.unit_amount ?? legacy.cents },
        archived: false,
        catalogOk: catalog.ok,
      }
    }
  }
  return { productId: null, current: null, archived: false, catalogOk: catalog.ok }
}

/**
 * Archive a Price this tool created, once it's been superseded.
 *
 * Env-var Price IDs are left ACTIVE on purpose: they are the fallback the
 * storefront reverts to when Stripe's catalog can't be listed (see
 * lib/pricingStore.ts), and archived Prices can't be used in new Checkout
 * Sessions — archiving one would turn a Stripe blip into a checkout outage.
 */
export async function archiveIfOurs(stripe: Stripe, priceId: string, keepId: string): Promise<void> {
  if (!priceId || priceId === keepId) return
  const old = await stripe.prices.retrieve(priceId).catch(() => null)
  if (old?.metadata?.source !== 'admin_pricing') return
  await stripe.prices.update(priceId, { active: false }).catch((err) => {
    // Non-fatal: an un-archived old Price is clutter, not a defect.
    console.error('[pricingAdmin] archiving superseded price failed', err)
  })
}

export type CreateSkuInput = {
  kind: PriceKind
  washValue: string
  /** Ignored for singles. */
  tokens: number
  unitAmountCents: number
  featured?: boolean
  actorEmail: string | null
}

/**
 * Put a new pack or single token on sale.
 *
 * Creates (or revives) the Stripe Product, gives it a Price, and keys it so
 * the storefront lists it on the next read. No database row is needed for it
 * to sell — the Stripe catalog IS the list of what's for sale.
 */
export async function createCatalogSku(
  input: CreateSkuInput,
): Promise<AdminResult<{ sku: string; stripePriceId: string }>> {
  const tokens = input.kind === 'single' ? 1 : input.tokens
  const invalid = validateSkuInput({
    kind: input.kind,
    washValue: input.washValue,
    tokens,
    cents: input.unitAmountCents,
  })
  if (invalid) return { ok: false, message: invalid }

  const stripe = getStripe()
  if (!stripe) return { ok: false, message: 'Stripe is not configured for this deployment.' }

  const { kind, washValue, unitAmountCents, actorEmail } = input
  const sku = skuLookupKey(kind, washValue, tokens)
  const name = describeSku({ kind, washValue, tokens })

  let priceId: string
  let productId: string
  try {
    const found = await locateSku(stripe, sku)
    if (!found.catalogOk) {
      return { ok: false, message: 'Stripe could not be reached. Nothing was created — try again.' }
    }
    if (found.current) {
      return {
        ok: false,
        message: `The ${name} already exists. Change its price in the table instead.`,
      }
    }

    if (found.productId) {
      productId = found.productId
    } else {
      const created = await stripe.products.create({
        name: skuProductName(kind, washValue, tokens),
        description:
          kind === 'pack'
            ? `${tokens} pre-paid $${washValue} wash tokens for the Spotless automatic bays.`
            : `One pre-paid $${washValue} wash token for the Spotless automatic bays.`,
        shippable: true,
        metadata: {
          lookup_key: sku,
          sku_kind: kind,
          wash_value: washValue,
          token_count: String(tokens),
          source: 'admin_pricing',
        },
      })
      productId = created.id
    }

    const price = await stripe.prices.create({
      product: productId,
      currency: CURRENCY,
      unit_amount: unitAmountCents,
      metadata: {
        sku_kind: kind,
        wash_value: washValue,
        token_count: String(tokens),
        source: 'admin_pricing',
      },
    })
    priceId = price.id

    // Keying + default_price is what puts it on sale; this also un-archives a
    // Product that was deleted earlier.
    await adoptSku(stripe, { productId, priceId, kind, washValue, tokens })
    if (input.featured !== undefined) {
      await stripe.products.update(productId, {
        metadata: { featured: input.featured ? 'true' : 'false' },
      })
    }
  } catch (err) {
    const message = stripeMessage(err)
    await audit(actorEmail, 'sku.create', { sku, unitAmountCents, error: message }, false)
    return { ok: false, message: `Stripe rejected the new item: ${message}` }
  }

  await recordPriceHistory({ kind, washValue, tokens, cents: unitAmountCents, priceId, productId, actorEmail })
  await audit(actorEmail, 'sku.create', { sku, unitAmountCents, stripePriceId: priceId, productId })
  invalidatePricingCache()

  return {
    ok: true,
    message: `The ${name} is on sale at ${formatCents(unitAmountCents)}.`,
    data: { sku, stripePriceId: priceId },
  }
}

export type UpdatePriceInput = {
  sku: string
  unitAmountCents: number
  actorEmail: string | null
}

/**
 * Change what a SKU costs.
 *
 * Stripe Prices are immutable, so this creates a NEW Price on the same Product
 * and makes it the Product's `default_price` — which is what the storefront
 * and checkout read. Orders already placed keep the Price they were bought at.
 */
export async function updateCatalogPrice(
  input: UpdatePriceInput,
): Promise<AdminResult<{ stripePriceId: string }>> {
  const { sku, unitAmountCents, actorEmail } = input
  const parsed = parseSkuLookupKey(sku)
  if (!parsed) return { ok: false, message: 'That is not a valid product.' }
  const invalid = validatePriceCents(unitAmountCents)
  if (invalid) return { ok: false, message: invalid }

  const stripe = getStripe()
  if (!stripe) return { ok: false, message: 'Stripe is not configured for this deployment.' }

  const name = describeSku(parsed)
  let newPriceId: string
  let productId: string
  let fromCents: number | null = null
  try {
    const found = await locateSku(stripe, sku)
    if (found.archived || !found.productId || !found.current) {
      return {
        ok: false,
        message: `The ${name} isn't on sale. Add it again instead of changing its price.`,
      }
    }
    if (found.current.cents === unitAmountCents) {
      return { ok: false, message: 'That is already the current price.' }
    }
    fromCents = found.current.cents
    productId = found.productId

    const created = await stripe.prices.create({
      product: productId,
      currency: CURRENCY,
      unit_amount: unitAmountCents,
      metadata: {
        sku_kind: parsed.kind,
        wash_value: parsed.washValue,
        token_count: String(parsed.tokens),
        source: 'admin_pricing',
      },
    })
    newPriceId = created.id

    // Point the Product at the new Price and stamp the SKU lookup key. This is
    // what makes the change authoritative: until this runs the new Price
    // exists but nothing is using it.
    await adoptSku(stripe, { productId, priceId: newPriceId, ...parsed })
    await archiveIfOurs(stripe, found.current.priceId, newPriceId)
  } catch (err) {
    const message = stripeMessage(err)
    await audit(actorEmail, 'price.update', { sku, unitAmountCents, error: message }, false)
    return { ok: false, message: `Stripe rejected the new price: ${message}` }
  }

  await recordPriceHistory({
    ...parsed,
    cents: unitAmountCents,
    priceId: newPriceId,
    productId,
    actorEmail,
  })
  await audit(actorEmail, 'price.update', {
    sku,
    from: fromCents,
    to: unitAmountCents,
    stripePriceId: newPriceId,
  })
  invalidatePricingCache()

  return {
    ok: true,
    message: `The ${name} is now ${formatCents(unitAmountCents)}.`,
    data: { stripePriceId: newPriceId },
  }
}

/**
 * Take a SKU off sale.
 *
 * Archives the Stripe Product, which is what removes it everywhere at once:
 * the storefront stops listing it, and Stripe itself refuses new Checkout
 * Sessions for its Prices — so even a page rendered before the delete can't
 * buy it. The Product keeps its lookup key, which (a) tells the store not to
 * resurrect a legacy SKU from the env vars, and (b) lets "add" revive the same
 * Product later. Past orders are untouched.
 */
export async function deleteCatalogSku(
  sku: string,
  actorEmail: string | null,
): Promise<AdminResult> {
  const parsed = parseSkuLookupKey(sku)
  if (!parsed) return { ok: false, message: 'That is not a valid product.' }
  const stripe = getStripe()
  if (!stripe) return { ok: false, message: 'Stripe is not configured for this deployment.' }

  const name = describeSku(parsed)
  let productId: string
  try {
    const found = await locateSku(stripe, sku)
    if (found.archived) return { ok: false, message: `The ${name} has already been removed.` }
    if (!found.productId) return { ok: false, message: `The ${name} isn't in Stripe.` }
    productId = found.productId
    await stripe.products.update(productId, {
      active: false,
      metadata: {
        lookup_key: sku,
        sku_kind: parsed.kind,
        wash_value: parsed.washValue,
        token_count: String(parsed.tokens),
      },
    })
  } catch (err) {
    const message = stripeMessage(err)
    await audit(actorEmail, 'sku.delete', { sku, error: message }, false)
    return { ok: false, message: `Stripe rejected the change: ${message}` }
  }

  await retirePriceHistory(parsed.kind, parsed.washValue)
  await audit(actorEmail, 'sku.delete', { sku, productId })
  invalidatePricingCache()
  return { ok: true, message: `The ${name} has been removed from the store.` }
}

/** Mark a SKU as the store's "Most Popular" (or clear it). */
export async function setSkuFeatured(
  sku: string,
  featured: boolean,
  actorEmail: string | null,
): Promise<AdminResult> {
  const parsed = parseSkuLookupKey(sku)
  if (!parsed) return { ok: false, message: 'That is not a valid product.' }
  const stripe = getStripe()
  if (!stripe) return { ok: false, message: 'Stripe is not configured for this deployment.' }

  const name = describeSku(parsed)
  try {
    const found = await locateSku(stripe, sku)
    if (!found.productId || !found.current) {
      return { ok: false, message: `The ${name} isn't on sale.` }
    }
    // Featuring requires the SKU to be keyed, so adopt it in the same call.
    await adoptSku(stripe, { productId: found.productId, priceId: found.current.priceId, ...parsed })
    await stripe.products.update(found.productId, {
      metadata: { featured: featured ? 'true' : 'false' },
    })
  } catch (err) {
    const message = stripeMessage(err)
    await audit(actorEmail, 'sku.feature', { sku, featured, error: message }, false)
    return { ok: false, message: `Stripe rejected the change: ${message}` }
  }
  await audit(actorEmail, 'sku.feature', { sku, featured })
  invalidatePricingCache()
  return {
    ok: true,
    message: featured
      ? `The ${name} is now marked Most Popular.`
      : `The ${name} is no longer marked Most Popular.`,
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
  sku: string,
  actorEmail: string | null,
): Promise<AdminResult> {
  const parsed = parseSkuLookupKey(sku)
  if (!parsed) return { ok: false, message: 'That is not a valid product.' }
  const stripe = getStripe()
  if (!stripe) return { ok: false, message: 'Stripe is not configured for this deployment.' }

  const name = describeSku(parsed)
  const snapshot = await getPricingSnapshot({ fresh: true })
  const current = snapshot.catalog.find((s) => s.sku === sku)
  if (!current?.stripePriceId) {
    return { ok: false, message: `The ${name} has no Stripe price yet — set a price first.` }
  }

  try {
    const price = await stripe.prices.retrieve(current.stripePriceId)
    const productId = typeof price.product === 'string' ? price.product : price.product.id
    await adoptSku(stripe, { productId, priceId: price.id, ...parsed })
    await audit(actorEmail, 'price.adopt', { sku, productId, priceId: price.id })
  } catch (err) {
    const message = stripeMessage(err)
    await audit(actorEmail, 'price.adopt', { sku, error: message }, false)
    return { ok: false, message: `Stripe rejected the change: ${message}` }
  }

  invalidatePricingCache()
  return { ok: true, message: `The ${name} now reads its price from Stripe.` }
}

/** Adopt every legacy SKU still priced from the deploy config, in one go. */
export async function adoptAllCatalogSkus(actorEmail: string | null): Promise<AdminResult> {
  const snapshot = await getPricingSnapshot({ fresh: true })
  const pending = snapshot.catalog.filter((s) => s.source !== 'stripe')
  if (pending.length === 0) {
    return { ok: false, message: 'Every item already reads its price from Stripe.' }
  }
  const failures: string[] = []
  for (const s of pending) {
    const res = await adoptCatalogSku(s.sku, actorEmail)
    if (!res.ok) failures.push(`${describeSku(s)}: ${res.message}`)
  }
  if (failures.length) {
    return { ok: false, message: `Some items could not be linked. ${failures.join(' ')}` }
  }
  return { ok: true, message: `${pending.length} item(s) now read their price from Stripe.` }
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
