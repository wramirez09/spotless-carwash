import { redirect } from 'next/navigation'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createServerSupabase } from '@/lib/supabase/authServer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Landing point for magic-link, invite, and password-reset emails. Establishes
// the session cookie from whichever flow Supabase used — PKCE `code` (default
// templates) or `token_hash` + `type` (custom templates) — then forwards to the
// dashboard (or a `/admin/...` `next`, so it can't be an open redirect).
//
// Uses next/navigation `redirect()` (not NextResponse.redirect) on purpose: the
// Supabase client writes the session cookies via next/headers, and `redirect()`
// is what reliably flushes those Set-Cookie headers onto the response.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const nextParam = params.get('next')
  const next = nextParam && nextParam.startsWith('/admin') ? nextParam : '/admin/signups'

  const supabase = await createServerSupabase()
  if (!supabase) redirect('/admin/login?error=unconfigured')

  const code = params.get('code')
  const tokenHash = params.get('token_hash')
  const type = params.get('type') as EmailOtpType | null

  let ok = false
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    ok = !error
    if (error) console.error('[admin-auth] code exchange failed', { message: error.message })
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    ok = !error
    if (error) console.error('[admin-auth] verifyOtp failed', { message: error.message })
  }

  redirect(ok ? next : '/admin/login?error=link')
}
