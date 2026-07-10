'use server'

import { headers } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase/authServer'
import { getSupabaseAuthAdmin } from '@/lib/supabase'
import { isAdminEmail } from '@/lib/adminAccess'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type InviteResult = { ok: true; message: string } | { ok: false; message: string }

// Build the site origin from the incoming request so the invite link points back
// at the environment the inviting admin is on (prod / preview / local).
async function siteOrigin(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'https'
  if (host) return `${proto}://${host}`
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://spotlessautowash.com'
}

/**
 * Invite a new admin by email. Only an already-authenticated admin can call this
 * (the action re-validates the caller's session), and the invited address must
 * already be on the ADMIN_EMAILS allowlist — otherwise the invitee could set a
 * password but the middleware would still block them from the dashboard.
 *
 * Supabase emails the invite; the link lands on /admin/auth/confirm, which
 * establishes the session and forwards to /admin/reset-password?flow=invite so
 * the new admin can set their initial password.
 */
export async function inviteAdmin(email: string): Promise<InviteResult> {
  // Caller must be a signed-in admin.
  const supabase = await createServerSupabase()
  if (!supabase) {
    return { ok: false, message: 'Auth is not configured for this deployment.' }
  }
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return { ok: false, message: 'Your session has expired. Sign in again.' }
  }

  const clean = email.trim().toLowerCase()
  if (!EMAIL_RE.test(clean)) {
    return { ok: false, message: 'Please enter a valid email address.' }
  }

  // The invitee must be allowlisted, or they can never actually reach the
  // dashboard. Make that failure explicit rather than sending a dead-end invite.
  if (!isAdminEmail(clean)) {
    return {
      ok: false,
      message: 'Add this address to ADMIN_EMAILS before inviting — only allowlisted admins can sign in.',
    }
  }

  const admin = getSupabaseAuthAdmin()
  if (!admin) {
    return { ok: false, message: 'Invites are not configured for this deployment.' }
  }

  const origin = await siteOrigin()
  const redirectTo = `${origin}/admin/auth/confirm?next=${encodeURIComponent('/admin/reset-password?flow=invite')}`

  const { error } = await admin.auth.admin.inviteUserByEmail(clean, { redirectTo })
  if (error) {
    console.error('[admin-auth] inviteUserByEmail failed', { message: error.message })
    // Most common cause is the user already existing — surface a useful hint.
    if (/already|registered|exists/i.test(error.message)) {
      return {
        ok: false,
        message: 'That address already has an account. They can use “Forgot password?” to set a new one.',
      }
    }
    return { ok: false, message: 'Could not send the invite. Please try again.' }
  }

  return { ok: true, message: `Invite sent to ${clean}.` }
}
