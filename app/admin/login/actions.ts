'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/authServer'
import { isAdminEmail } from '@/lib/adminAccess'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type MagicLinkResult = { ok: boolean; message: string }

// Build the site origin from the incoming request so magic links point back at
// the environment the user is actually on (prod / preview / local), falling
// back to the configured site URL.
async function siteOrigin(): Promise<string> {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'https'
  if (host) return `${proto}://${host}`
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://spotlessautowash.com'
}

/**
 * Email a magic sign-in link — but only to an allowlisted admin address, and
 * only for a user that already exists (`shouldCreateUser: false`). Always
 * returns the same neutral message so the form never reveals which addresses
 * are admins.
 */
export async function requestMagicLink(email: string, next?: string): Promise<MagicLinkResult> {
  const neutral: MagicLinkResult = {
    ok: true,
    message: 'If that address is an admin, a sign-in link is on its way — check your inbox.',
  }

  const clean = email.trim().toLowerCase()
  if (!EMAIL_RE.test(clean)) {
    return { ok: false, message: 'Please enter a valid email address.' }
  }

  // Not an admin → say nothing revealing, send nothing.
  if (!isAdminEmail(clean)) return neutral

  const supabase = await createServerSupabase()
  if (!supabase) {
    return { ok: false, message: 'Sign-in is not configured. Please contact the site admin.' }
  }

  const origin = await siteOrigin()
  const safeNext = next && next.startsWith('/admin') ? next : '/admin/signups'
  const emailRedirectTo = `${origin}/admin/auth/confirm?next=${encodeURIComponent(safeNext)}`

  const { error } = await supabase.auth.signInWithOtp({
    email: clean,
    options: { shouldCreateUser: false, emailRedirectTo },
  })
  if (error) {
    console.error('[admin-auth] signInWithOtp failed', { message: error.message })
    // Still neutral to the user — most failures here (unknown user, rate limit)
    // shouldn't leak, and a retry is the right action.
    return neutral
  }
  return neutral
}

export async function signOut(): Promise<void> {
  const supabase = await createServerSupabase()
  if (supabase) await supabase.auth.signOut()
  redirect('/admin/login')
}
