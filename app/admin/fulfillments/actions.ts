'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/authServer'
import { getSupabaseAdmin } from '@/lib/supabase'
import { isAdminEmail } from '@/lib/adminAccess'

export type ShipResult = { ok: true; message: string } | { ok: false; message: string }

/**
 * Re-validate the caller's admin session. Server actions are their own entry
 * point — middleware protects the page render, not the action invocation — so
 * every mutating action checks for itself, matching inviteAdmin.
 */
async function requireAdmin(): Promise<string | null> {
  const supabase = await createServerSupabase()
  if (!supabase) return null
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) return null
  return user.email ?? null
}

/**
 * Mark a shipment as mailed.
 *
 * The tracking number is genuinely optional: these ship as First-Class letters,
 * which have no USPS tracking. `status` is the completion signal — a shipment
 * with no tracking number is the normal case, not an incomplete record.
 */
export async function markShipped(
  fulfillmentId: string,
  trackingNumber?: string,
): Promise<ShipResult> {
  if (!(await requireAdmin())) {
    return { ok: false, message: 'Your session has expired. Sign in again.' }
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return { ok: false, message: 'The database is not configured for this deployment.' }
  }

  const tracking = (trackingNumber ?? '').trim()

  const { error } = await supabase
    .from('fulfillments')
    .update({
      status: 'shipped',
      shipped_at: new Date().toISOString(),
      tracking_number: tracking || null,
    })
    .eq('id', fulfillmentId)

  if (error) {
    console.error('[fulfillments] markShipped failed', { fulfillmentId, error })
    return { ok: false, message: 'Could not update that shipment. Please try again.' }
  }

  revalidatePath('/admin/fulfillments')
  return { ok: true, message: 'Marked as shipped.' }
}

/** Undo a mistaken "mark as shipped" — puts the row back in the queue. */
export async function markPending(fulfillmentId: string): Promise<ShipResult> {
  if (!(await requireAdmin())) {
    return { ok: false, message: 'Your session has expired. Sign in again.' }
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return { ok: false, message: 'The database is not configured for this deployment.' }
  }

  const { error } = await supabase
    .from('fulfillments')
    .update({ status: 'pending', shipped_at: null, tracking_number: null })
    .eq('id', fulfillmentId)

  if (error) {
    console.error('[fulfillments] markPending failed', { fulfillmentId, error })
    return { ok: false, message: 'Could not update that shipment. Please try again.' }
  }

  revalidatePath('/admin/fulfillments')
  return { ok: true, message: 'Moved back to pending.' }
}
