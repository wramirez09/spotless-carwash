'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/authServer'
import { isAdminEmail } from '@/lib/adminAccess'
import {
  adoptAllCatalogSkus,
  adoptCatalogSku,
  createCatalogSku,
  deleteCatalogSku,
  setSkuFeatured,
  updateSubscriptionPrice,
  cancelSale as cancelSaleService,
  publishSale as publishSaleService,
  reprovisionSale as reprovisionSaleService,
  saveSale as saveSaleService,
  updateBaseDiscount as updateBaseDiscountService,
  updateCatalogPrice,
} from '@/lib/pricingAdmin'
import {
  PRICE_KINDS,
  parseDollarsToCents,
  parseSkuLookupKey,
  slugify,
  type PriceKind,
} from '@/lib/pricing/model'
import {
  isSubscriptionPlanId,
  isSubscriptionWashValue,
} from '@/lib/subscriptionPricing'
import { parseChicagoLocalInput } from '@/lib/pricing/time'

export type ActionResult = { ok: boolean; message: string }

/**
 * Re-validate the caller's admin session.
 *
 * Server actions are their own entry point — middleware protects the page
 * render, not the action invocation — so every mutating action checks for
 * itself, matching the fulfillments and signups actions.
 */
async function requireAdmin(): Promise<string | null> {
  const supabase = await createServerSupabase()
  if (!supabase) return null
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) return null
  // `?? null` matters: the return type is `string | null`, and an admin with
  // no email on the account would otherwise leak `undefined` into the actor
  // field of every audit-log row.
  return user.email ?? null
}

const EXPIRED = 'Your session has expired. Sign in again.'

/**
 * Everything a pricing change touches. The storefront caches the banner and
 * the pack cards, so a change that isn't revalidated here would be invisible
 * until the next deploy — the exact problem this feature exists to solve.
 */
function revalidateStorefront(): void {
  revalidatePath('/admin/pricing')
  revalidatePath('/buy-tokens')
  revalidatePath('/buy-tokens/subscribe')
  revalidatePath('/', 'layout')
}

// Narrows away the service layer's `data` payload — the UI only ever renders
// the outcome and its message.
function toResult(result: { ok: boolean; message: string }): ActionResult {
  return { ok: result.ok, message: result.message }
}

// ---------------------------------------------------------------------------
// Prices
// ---------------------------------------------------------------------------

export async function setPrice(formData: FormData): Promise<ActionResult> {
  const actor = await requireAdmin()
  if (!actor) return { ok: false, message: EXPIRED }

  const sku = String(formData.get('sku') ?? '')
  const amount = String(formData.get('amount') ?? '')
  if (!parseSkuLookupKey(sku)) return { ok: false, message: 'That is not a valid product.' }

  const cents = parseDollarsToCents(amount)
  if (cents == null) {
    return { ok: false, message: `"${amount}" is not a valid dollar amount.` }
  }

  const result = await updateCatalogPrice({ sku, unitAmountCents: cents, actorEmail: actor })
  if (result.ok) revalidateStorefront()
  return toResult(result)
}

/** Add a new pack size / denomination, or a single token, to the store. */
export async function createSku(formData: FormData): Promise<ActionResult> {
  const actor = await requireAdmin()
  if (!actor) return { ok: false, message: EXPIRED }

  const kind = String(formData.get('kind') ?? '') as PriceKind
  if (!PRICE_KINDS.includes(kind)) return { ok: false, message: 'Choose a pack or a single token.' }
  const washValue = String(formData.get('washValue') ?? '').trim().replace(/^\$/, '')
  const tokens = kind === 'single' ? 1 : Number(String(formData.get('tokens') ?? '').trim())
  const amount = String(formData.get('amount') ?? '')
  const cents = parseDollarsToCents(amount)
  if (cents == null) return { ok: false, message: `"${amount}" is not a valid dollar amount.` }
  const featured = formData.get('featured') === 'on' || formData.get('featured') === 'true'

  const result = await createCatalogSku({
    kind,
    washValue,
    tokens,
    unitAmountCents: cents,
    featured: featured || undefined,
    actorEmail: actor,
  })
  if (result.ok) revalidateStorefront()
  return toResult(result)
}

/** Take a SKU off sale (archives its Stripe Product). */
export async function deleteSku(sku: string): Promise<ActionResult> {
  const actor = await requireAdmin()
  if (!actor) return { ok: false, message: EXPIRED }
  if (!parseSkuLookupKey(sku)) return { ok: false, message: 'That is not a valid product.' }
  const result = await deleteCatalogSku(sku, actor)
  if (result.ok) revalidateStorefront()
  return toResult(result)
}

export async function featureSku(sku: string, featured: boolean): Promise<ActionResult> {
  const actor = await requireAdmin()
  if (!actor) return { ok: false, message: EXPIRED }
  if (!parseSkuLookupKey(sku)) return { ok: false, message: 'That is not a valid product.' }
  const result = await setSkuFeatured(sku, featured, actor)
  if (result.ok) revalidateStorefront()
  return toResult(result)
}

/** Make Stripe authoritative for a SKU that still resolves from deploy config. */
export async function adoptSkuFromStripe(sku: string): Promise<ActionResult> {
  const actor = await requireAdmin()
  if (!actor) return { ok: false, message: EXPIRED }
  if (!parseSkuLookupKey(sku)) return { ok: false, message: 'That is not a valid product.' }
  const result = await adoptCatalogSku(sku, actor)
  if (result.ok) revalidateStorefront()
  return toResult(result)
}

export async function adoptAllSkusFromStripe(): Promise<ActionResult> {
  const actor = await requireAdmin()
  if (!actor) return { ok: false, message: EXPIRED }
  const result = await adoptAllCatalogSkus(actor)
  revalidateStorefront()
  return toResult(result)
}

export async function setSubscriptionPrice(formData: FormData): Promise<ActionResult> {
  const actor = await requireAdmin()
  if (!actor) return { ok: false, message: EXPIRED }

  const plan = String(formData.get('plan') ?? '')
  const washValue = String(formData.get('washValue') ?? '')
  if (!isSubscriptionPlanId(plan) || !isSubscriptionWashValue(washValue)) {
    return { ok: false, message: 'That is not a valid plan.' }
  }
  const amount = String(formData.get('amount') ?? '')
  const cents = parseDollarsToCents(amount)
  if (cents == null) return { ok: false, message: `"${amount}" is not a valid dollar amount.` }

  const result = await updateSubscriptionPrice({
    plan,
    washValue,
    unitAmountCents: cents,
    actorEmail: actor,
  })
  if (result.ok) revalidateStorefront()
  return toResult(result)
}

export async function setBaseDiscount(formData: FormData): Promise<ActionResult> {
  const actor = await requireAdmin()
  if (!actor) return { ok: false, message: EXPIRED }

  const cents = parseDollarsToCents(String(formData.get('amount') ?? ''))
  if (cents == null) return { ok: false, message: 'Enter a valid dollar amount.' }

  const result = await updateBaseDiscountService(cents, actor)
  if (result.ok) revalidateStorefront()
  return toResult(result)
}

// ---------------------------------------------------------------------------
// Sales
// ---------------------------------------------------------------------------

export async function saveSale(formData: FormData): Promise<ActionResult> {
  const actor = await requireAdmin()
  if (!actor) return { ok: false, message: EXPIRED }

  const id = String(formData.get('id') ?? '').trim() || undefined
  const label = String(formData.get('label') ?? '').trim()
  const badge = String(formData.get('badge') ?? '').trim() || label.toUpperCase()
  const emoji = String(formData.get('emoji') ?? '').trim()
  const endLabel = String(formData.get('endLabel') ?? '').trim() || null
  const publish = formData.get('publish') === 'on' || formData.get('publish') === 'true'

  // The slug is the sale's stable identity — it ends up in Stripe metadata and
  // in reporting — so it is derived once, on create, and never re-derived from
  // a renamed label afterwards.
  const slug = String(formData.get('slug') ?? '').trim() || slugify(label)
  if (!slug) return { ok: false, message: 'A sale needs a name.' }

  const startMs = parseChicagoLocalInput(String(formData.get('startsAt') ?? ''))
  const endMs = parseChicagoLocalInput(String(formData.get('endsAt') ?? ''))
  if (startMs == null) return { ok: false, message: 'Enter a valid start date and time.' }
  if (endMs == null) return { ok: false, message: 'Enter a valid end date and time.' }

  const extra = parseDollarsToCents(String(formData.get('extraDiscount') ?? ''))
  if (extra == null) {
    return { ok: false, message: 'Enter a valid extra discount, e.g. 5.00.' }
  }

  const result = await saveSaleService({
    id,
    slug,
    label,
    badge,
    emoji,
    endLabel,
    startMs,
    endMs,
    extraDiscountCents: extra,
    publish,
    actorEmail: actor,
  })
  if (result.ok) revalidateStorefront()
  return toResult(result)
}

export async function publishSale(id: string): Promise<ActionResult> {
  const actor = await requireAdmin()
  if (!actor) return { ok: false, message: EXPIRED }
  const result = await publishSaleService(id, actor)
  if (result.ok) revalidateStorefront()
  return toResult(result)
}

export async function cancelSale(id: string): Promise<ActionResult> {
  const actor = await requireAdmin()
  if (!actor) return { ok: false, message: EXPIRED }
  const result = await cancelSaleService(id, actor)
  if (result.ok) revalidateStorefront()
  return toResult(result)
}

export async function reprovisionSale(id: string): Promise<ActionResult> {
  const actor = await requireAdmin()
  if (!actor) return { ok: false, message: EXPIRED }
  const result = await reprovisionSaleService(id, actor)
  if (result.ok) revalidateStorefront()
  return toResult(result)
}
