import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createServerSupabase } from '@/lib/supabase/authServer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Landing point for the magic-link email. Establishes the session cookie from
// whichever flow Supabase used — PKCE `code` (default templates) or
// `token_hash` + `type` (custom templates) — then redirects into the dashboard.
// Only `/admin/...` destinations are honored, so the `next` param can't be used
// as an open redirect.
export async function GET(request: Request) {
  const url = new URL(request.url)
  const params = url.searchParams
  const nextParam = params.get('next')
  const next = nextParam && nextParam.startsWith('/admin') ? nextParam : '/admin/signups'

  const supabase = await createServerSupabase()
  if (!supabase) {
    return NextResponse.redirect(new URL('/admin/login?error=unconfigured', request.url))
  }

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

  if (!ok) {
    return NextResponse.redirect(new URL('/admin/login?error=link', request.url))
  }
  return NextResponse.redirect(new URL(next, request.url))
}
