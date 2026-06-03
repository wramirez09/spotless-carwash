import 'server-only'
import { getSupabaseAdmin } from './supabase'

// Mirrors lib/supabase env selection: writes land in the DEV project for local
// dev + Vercel Preview, and only in PROD on Vercel Production.

export type PromotionSignupInput = {
  email: string
  name?: string | null
  phone?: string | null
  // Where the signup came from, e.g. 'under_construction', 'footer', 'checkout'.
  source?: string | null
  marketingConsent?: boolean
  // For a previously-unsubscribed email, the caller must pass true to confirm
  // the re-opt-in before we reactivate the row.
  confirmResubscribe?: boolean
}

// 'subscribed'         — brand new email, row created.
// 'confirm_resubscribe'— email previously unsubscribed; awaiting confirmation (no write).
// 'resubscribed'       — confirmed re-opt-in of a previously unsubscribed email.
// 'already_subscribed' — email already on the list and still subscribed (no-op).
export type SubscribeOutcome =
  | 'subscribed'
  | 'confirm_resubscribe'
  | 'resubscribed'
  | 'already_subscribed'

export type SubscribeResult =
  | { ok: true; outcome: SubscribeOutcome }
  | { ok: false; reason: 'invalid_email' | 'unconfigured' | 'error' }

// Loose, on purpose — real validation is the double opt-in email, not a regex.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Add (or re-activate) a promotions subscriber, reporting whether the email was
 * new, already on the list, or reactivated. Best-effort — returns a tagged
 * reason instead of throwing so callers can decide the HTTP response.
 *
 * The "new vs existing" check is race-safe: we attempt an insert-or-ignore and
 * a row only comes back when THIS call created it. If nothing comes back, the
 * email already exists and we look up its status to decide already/resubscribe.
 */
export async function subscribeToPromotions(
  input: PromotionSignupInput,
): Promise<SubscribeResult> {
  const email = input.email.trim().toLowerCase()
  if (!EMAIL_RE.test(email)) return { ok: false, reason: 'invalid_email' }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    console.warn('[promotions] Supabase not configured — skipping signup')
    return { ok: false, reason: 'unconfigured' }
  }

  // Insert-or-ignore. With ignoreDuplicates a conflicting row is left untouched
  // and not returned, so a returned row means we just created it.
  const { data: inserted, error: insertErr } = await supabase
    .from('promotion_signups')
    .upsert(
      {
        email,
        name: input.name?.trim() || null,
        phone: input.phone?.trim() || null,
        source: input.source || null,
        marketing_consent: input.marketingConsent ?? true,
        status: 'subscribed',
        unsubscribed_at: null,
      },
      { onConflict: 'email', ignoreDuplicates: true },
    )
    .select('id')

  if (insertErr) {
    console.error('[promotions] signup insert failed', { error: insertErr })
    return { ok: false, reason: 'error' }
  }

  if (inserted && inserted.length > 0) {
    return { ok: true, outcome: 'subscribed' }
  }

  // Email already exists — find out whether they'd unsubscribed.
  const { data: existing, error: lookupErr } = await supabase
    .from('promotion_signups')
    .select('id, status')
    .eq('email', email)
    .maybeSingle()

  if (lookupErr) {
    console.error('[promotions] existing lookup failed', { error: lookupErr })
    return { ok: false, reason: 'error' }
  }


  if (existing && existing.status !== 'subscribed') {
    // Previously unsubscribed — don't silently re-add. Ask the caller to
    // confirm the opt-in first; only reactivate once they pass the flag.
    if (!input.confirmResubscribe) {
      return { ok: true, outcome: 'confirm_resubscribe' }
    }

    const { error: reactivateErr } = await supabase
      .from('promotion_signups')
      .update({ status: 'subscribed', unsubscribed_at: null })
      .eq('id', existing.id)

    if (reactivateErr) {
      console.error('[promotions] reactivate failed', { error: reactivateErr })
      return { ok: false, reason: 'error' }
    }
    return { ok: true, outcome: 'resubscribed' }
  }

  return { ok: true, outcome: 'already_subscribed' }
}
