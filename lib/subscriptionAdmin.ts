import 'server-only'
import type Stripe from 'stripe'
import {
  archiveIfOurs,
  audit,
  getStripe,
  stripeMessage,
  type AdminResult,
} from './pricingAdmin'
import {
  formatCents,
  slugify,
  subscriptionLookupKey,
  validatePlanInput,
  validatePriceCents,
  validateWashValue,
} from './pricing/model'
import {
  getSubscriptionCatalog,
  invalidateSubscriptionCache,
  type SubscriptionPlan,
} from './subscriptionPricing'

// The WRITE side of subscription plans: everything behind the "Subscription
// plans" section of /admin/pricing. Plans and their prices live entirely in
// Stripe (see lib/subscriptionPricing.ts for how they're read):
//
//   plan        = Stripe Product, metadata.spotless_sub_plan = <id>
//   token value = monthly Price on that Product, lookup_key
//                 spotless_sub_<id>_<value>
//
// Two rules hold throughout, because these are RECURRING charges:
//
//  * Nothing here touches an existing subscription. Stripe keeps billing a
//    live subscription on its original Price even after that Price or its
//    Product is archived, and the subscriber's token count and value were
//    snapshotted into the subscription's metadata at checkout. Changes apply
//    to new sign-ups only — each message says so.
//  * A plan id is permanent. It is recorded on every subscription row and
//    used by fulfilment, so renaming a plan changes its name, never its id.

const CURRENCY = 'usd'

function done(planName: string, what: string): string {
  return `${planName}: ${what} Existing subscribers are not affected.`
}

async function findPlan(id: string): Promise<SubscriptionPlan | null> {
  const { plans, live } = await getSubscriptionCatalog({ fresh: true })
  if (!live) throw new Error('Stripe could not be reached. Nothing was changed — try again.')
  return plans.find((p) => p.id === id) ?? null
}

/** Create a monthly Price for a plan's token value and move its lookup key onto it. */
async function createPlanPrice(
  stripe: Stripe,
  args: { productId: string; planId: string; planName: string; washValue: string; cents: number },
): Promise<string> {
  const price = await stripe.prices.create({
    product: args.productId,
    currency: CURRENCY,
    unit_amount: args.cents,
    recurring: { interval: 'month' },
    // Stripe moves the key off whichever Price held it in the same call, so
    // there is never a moment where checkout can't resolve this value.
    lookup_key: subscriptionLookupKey(args.planId, args.washValue),
    transfer_lookup_key: true,
    nickname: `${args.planName} · $${args.washValue} tokens`,
    metadata: { plan: args.planId, wash_value: args.washValue, source: 'admin_pricing' },
  })
  return price.id
}

function planMetadata(plan: {
  id: string
  tokensPerCycle: number
  featured?: boolean
  sortOrder: number
}): Record<string, string> {
  return {
    spotless_sub_plan: plan.id,
    tokens_per_cycle: String(plan.tokensPerCycle),
    featured: plan.featured ? 'true' : 'false',
    sort_order: String(plan.sortOrder),
    source: 'admin_pricing',
  }
}

/**
 * Move one of the original, code-defined plans into Stripe so it can be
 * edited. Creates its Product and re-creates each token value that has a real
 * Price, at the same amount, moving the lookup key across. Values that only
 * ever had a computed display price (never purchasable) are not carried over.
 */
async function adoptLegacyPlan(stripe: Stripe, plan: SubscriptionPlan): Promise<string> {
  const product = await stripe.products.create({
    name: plan.name,
    description: plan.blurb || undefined,
    shippable: true,
    metadata: planMetadata(plan),
  })
  for (const v of plan.variants) {
    if (!v.priceId) continue
    const newId = await createPlanPrice(stripe, {
      productId: product.id,
      planId: plan.id,
      planName: plan.name,
      washValue: v.washValue,
      cents: v.price,
    })
    await archiveIfOurs(stripe, v.priceId, newId)
  }
  return product.id
}

/** The plan's Product, moving an original plan into Stripe first if needed. */
async function editableProductId(stripe: Stripe, plan: SubscriptionPlan): Promise<string> {
  return plan.productId ?? (await adoptLegacyPlan(stripe, plan))
}

/**
 * Keep "Most Popular" on one plan: un-flag every other plan that carries it.
 * An original plan still in code is moved into Stripe so the flag can stick.
 */
async function clearOtherFeatured(stripe: Stripe, keepId: string): Promise<void> {
  const { plans } = await getSubscriptionCatalog({ fresh: true })
  for (const other of plans) {
    if (other.id === keepId || !other.featured) continue
    const productId = await editableProductId(stripe, other)
    await stripe.products.update(productId, { metadata: { featured: 'false' } })
  }
}

function finish(): void {
  invalidateSubscriptionCache()
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export type CreatePlanInput = {
  name: string
  tokensPerCycle: number
  blurb: string
  featured: boolean
  /** The first token value offered, and its monthly price. */
  washValue: string
  unitAmountCents: number
  actorEmail: string | null
}

export async function createSubscriptionPlan(
  input: CreatePlanInput,
): Promise<AdminResult<{ id: string }>> {
  const invalid =
    validatePlanInput(input) ??
    validateWashValue(input.washValue) ??
    validatePriceCents(input.unitAmountCents)
  if (invalid) return { ok: false, message: invalid }

  const id = slugify(input.name)
  if (!id) return { ok: false, message: 'Use letters or numbers in the plan name.' }

  const stripe = getStripe()
  if (!stripe) return { ok: false, message: 'Stripe is not configured for this deployment.' }

  const name = input.name.trim()
  try {
    const { plans, live } = await getSubscriptionCatalog({ fresh: true })
    if (!live) {
      return { ok: false, message: 'Stripe could not be reached. Nothing was created — try again.' }
    }
    if (plans.some((p) => p.id === id)) {
      return {
        ok: false,
        message: `A plan called "${name}" already exists. Edit it, or pick a different name.`,
      }
    }
    const sortOrder = Math.max(0, ...plans.map((p) => p.sortOrder)) + 10

    // Re-creating a plan that was deleted revives its Product rather than
    // minting a second one with the same id.
    const existing = await stripe.products
      .search({ query: `metadata['spotless_sub_plan']:'${id}'`, limit: 1 })
      .then((r) => r.data[0] ?? null)
      .catch(() => null)
    const meta = planMetadata({ id, tokensPerCycle: input.tokensPerCycle, featured: input.featured, sortOrder })
    const productId = existing
      ? (
          await stripe.products.update(existing.id, {
            active: true,
            name,
            description: input.blurb.trim() || '',
            metadata: meta,
          })
        ).id
      : (
          await stripe.products.create({
            name,
            description: input.blurb.trim() || undefined,
            shippable: true,
            metadata: meta,
          })
        ).id

    await createPlanPrice(stripe, {
      productId,
      planId: id,
      planName: name,
      washValue: input.washValue,
      cents: input.unitAmountCents,
    })
    if (input.featured) await clearOtherFeatured(stripe, id)
  } catch (err) {
    const message = stripeMessage(err)
    await audit(input.actorEmail, 'plan.create', { id, error: message }, false)
    return { ok: false, message: `Stripe rejected the new plan: ${message}` }
  }

  await audit(input.actorEmail, 'plan.create', {
    id,
    name,
    tokensPerCycle: input.tokensPerCycle,
    washValue: input.washValue,
    unitAmountCents: input.unitAmountCents,
  })
  finish()
  return {
    ok: true,
    message: `"${name}" is on offer: ${input.tokensPerCycle} × $${input.washValue} tokens for ${formatCents(input.unitAmountCents)}/mo.`,
    data: { id },
  }
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export type UpdatePlanInput = {
  id: string
  name: string
  tokensPerCycle: number
  blurb: string
  featured: boolean
  actorEmail: string | null
}

/**
 * Change a plan's name, description, token count or Most Popular flag.
 *
 * A new token count applies to new sign-ups: a subscriber's count was recorded
 * on their subscription at checkout and is what fulfilment ships.
 */
export async function updateSubscriptionPlan(input: UpdatePlanInput): Promise<AdminResult> {
  const invalid = validatePlanInput(input)
  if (invalid) return { ok: false, message: invalid }
  const stripe = getStripe()
  if (!stripe) return { ok: false, message: 'Stripe is not configured for this deployment.' }

  const name = input.name.trim()
  try {
    const plan = await findPlan(input.id)
    if (!plan) return { ok: false, message: 'That plan no longer exists.' }
    const productId = await editableProductId(stripe, plan)
    await stripe.products.update(productId, {
      name,
      description: input.blurb.trim(),
      metadata: planMetadata({
        id: plan.id,
        tokensPerCycle: input.tokensPerCycle,
        featured: input.featured,
        sortOrder: plan.sortOrder,
      }),
    })
    if (input.featured) await clearOtherFeatured(stripe, plan.id)
  } catch (err) {
    const message = stripeMessage(err)
    await audit(input.actorEmail, 'plan.update', { id: input.id, error: message }, false)
    return { ok: false, message: `Stripe rejected the change: ${message}` }
  }

  await audit(input.actorEmail, 'plan.update', {
    id: input.id,
    name,
    tokensPerCycle: input.tokensPerCycle,
    featured: input.featured,
  })
  finish()
  return { ok: true, message: done(name, 'saved.') }
}

export type SetPlanPriceInput = {
  planId: string
  washValue: string
  unitAmountCents: number
  actorEmail: string | null
}

/** Add a token value to a plan, or change what an existing one costs. */
export async function setSubscriptionPlanPrice(
  input: SetPlanPriceInput,
): Promise<AdminResult<{ stripePriceId: string }>> {
  const invalid = validateWashValue(input.washValue) ?? validatePriceCents(input.unitAmountCents)
  if (invalid) return { ok: false, message: invalid }
  const stripe = getStripe()
  if (!stripe) return { ok: false, message: 'Stripe is not configured for this deployment.' }

  let newPriceId: string
  let planName = input.planId
  let from: number | null = null
  try {
    const plan = await findPlan(input.planId)
    if (!plan) return { ok: false, message: 'That plan no longer exists.' }
    planName = plan.name
    const current = plan.variants.find((v) => v.washValue === input.washValue)
    if (current?.priceId && current.price === input.unitAmountCents) {
      return { ok: false, message: 'That is already the current price.' }
    }
    from = current?.priceId ? current.price : null

    const wasLegacy = !plan.productId
    const productId = await editableProductId(stripe, plan)
    newPriceId = await createPlanPrice(stripe, {
      productId,
      planId: plan.id,
      planName: plan.name,
      washValue: input.washValue,
      cents: input.unitAmountCents,
    })
    // Adoption already re-created (and archived) the old Price; otherwise the
    // superseded one is archived here when this tool made it.
    if (!wasLegacy && current?.priceId) await archiveIfOurs(stripe, current.priceId, newPriceId)
  } catch (err) {
    const message = stripeMessage(err)
    await audit(input.actorEmail, 'plan.price', { ...input, actorEmail: undefined, error: message }, false)
    return { ok: false, message: `Stripe rejected the new price: ${message}` }
  }

  await audit(input.actorEmail, 'plan.price', {
    planId: input.planId,
    washValue: input.washValue,
    from,
    to: input.unitAmountCents,
    stripePriceId: newPriceId,
  })
  finish()
  return {
    ok: true,
    message: done(
      planName,
      `$${input.washValue} tokens are now ${formatCents(input.unitAmountCents)}/mo for new sign-ups.`,
    ),
    data: { stripePriceId: newPriceId },
  }
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

/** Stop offering one token value on a plan. */
export async function removeSubscriptionPlanPrice(
  planId: string,
  washValue: string,
  actorEmail: string | null,
): Promise<AdminResult> {
  const stripe = getStripe()
  if (!stripe) return { ok: false, message: 'Stripe is not configured for this deployment.' }

  let planName = planId
  try {
    const plan = await findPlan(planId)
    if (!plan) return { ok: false, message: 'That plan no longer exists.' }
    planName = plan.name
    if (!plan.variants.some((v) => v.washValue === washValue)) {
      return { ok: false, message: `${plan.name} doesn't offer $${washValue} tokens.` }
    }
    // Moving an original plan into Stripe gives every value a keyed Price we
    // own, so the one being removed can be archived like any other.
    await editableProductId(stripe, plan)
    const { plans } = await getSubscriptionCatalog({ fresh: true })
    const priceId = plans
      .find((p) => p.id === planId)
      ?.variants.find((v) => v.washValue === washValue)?.priceId
    if (priceId) await stripe.prices.update(priceId, { active: false })
  } catch (err) {
    const message = stripeMessage(err)
    await audit(actorEmail, 'plan.price.remove', { planId, washValue, error: message }, false)
    return { ok: false, message: `Stripe rejected the change: ${message}` }
  }

  await audit(actorEmail, 'plan.price.remove', { planId, washValue })
  finish()
  return { ok: true, message: done(planName, `$${washValue} tokens are no longer offered.`) }
}

/**
 * Stop offering a plan. Archives its Product and Prices so the site and
 * checkout drop it at once; an original plan still in code gets an archived
 * Product created for it, which is what keeps it from reappearing.
 *
 * Current subscribers keep their subscription — cancel those individually in
 * Stripe if the plan is truly ending.
 */
export async function deleteSubscriptionPlan(
  id: string,
  actorEmail: string | null,
): Promise<AdminResult> {
  const stripe = getStripe()
  if (!stripe) return { ok: false, message: 'Stripe is not configured for this deployment.' }

  let name = id
  try {
    const plan = await findPlan(id)
    if (!plan) return { ok: false, message: 'That plan no longer exists.' }
    name = plan.name
    for (const v of plan.variants) {
      // Env-var Prices are left alone (see archiveIfOurs); the archived
      // Product is what retires an original plan.
      if (v.source === 'stripe' && v.priceId) {
        await stripe.prices.update(v.priceId, { active: false })
      }
    }
    if (plan.productId) {
      await stripe.products.update(plan.productId, { active: false })
    } else {
      await stripe.products.create({
        name: plan.name,
        active: false,
        description: plan.blurb || undefined,
        metadata: { ...planMetadata(plan), featured: 'false' },
      })
    }
  } catch (err) {
    const message = stripeMessage(err)
    await audit(actorEmail, 'plan.delete', { id, error: message }, false)
    return { ok: false, message: `Stripe rejected the change: ${message}` }
  }

  await audit(actorEmail, 'plan.delete', { id })
  finish()
  return {
    ok: true,
    message: `"${name}" is no longer offered. Current subscribers keep their plan until they cancel — cancel them in Stripe if the plan is ending.`,
  }
}
