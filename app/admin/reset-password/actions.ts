'use server'

import { createServerSupabase } from '@/lib/supabase/authServer'
import { isAdminEmail } from '@/lib/adminAccess'

export type UpdatePasswordResult = { ok: true } | { ok: false; message: string }

/**
 * Set a new password for the currently-authenticated admin. Reached via the
 * password-reset email, which establishes a short-lived recovery session at
 * /admin/auth/confirm before forwarding here. Requires that session to belong
 * to an allowlisted admin.
 */
export async function updatePassword(password: string): Promise<UpdatePasswordResult> {
  if (!password || password.length < 8) {
    return { ok: false, message: 'Password must be at least 8 characters.' }
  }

  const supabase = await createServerSupabase()
  if (!supabase) {
    return { ok: false, message: 'Sign-in is not configured. Please contact the site admin.' }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return {
      ok: false,
      message: 'Your reset link has expired. Request a new one from the sign-in page.',
    }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    console.error('[admin-auth] updateUser(password) failed', { message: error.message })
    return {
      ok: false,
      message: 'Could not update password. The link may have expired — request a new one.',
    }
  }
  return { ok: true }
}
