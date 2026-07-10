import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { supabasePublicEnv } from './supabase/publicEnv'

// Service-role client for server-side persistence (the stripe-webhook). The
// service-role key bypasses RLS, so this must NEVER be imported into client
// code — `server-only` makes a client-side import a build error.
//
// Mirrors lib/stripeEnv: PROD_* is used only on Vercel Production (so the
// production tables are only ever written to from production). Preview deploys
// and local dev fall through to the DEV_* project, keeping real customer data
// out of the dev database.
function isProductionEnv(): boolean {
  return process.env.VERCEL_ENV === 'production'
}

let cached: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = isProductionEnv()
    ? process.env.PROD_SUPABASE_URL
    : process.env.DEV_SUPABASE_URL
  const key = isProductionEnv()
    ? process.env.PROD_SUPABASE_SECRET_KEY
    : process.env.DEV_SUPABASE_SECRET_KEY
  if (!url || !key) return null
  if (!cached) {
    cached = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    // Log once per runtime which project this writes to — makes "prod or dev?"
    // obvious in deploy logs without exposing the URL/keys.
    console.log(`[supabase] admin client → ${isProductionEnv() ? 'PROD' : 'DEV'} project`)
  }
  return cached
}

let cachedAuthAdmin: SupabaseClient | null = null

/**
 * Service-role client bound to the SAME project the auth flow uses
 * (`NEXT_PUBLIC_SUPABASE_URL`), paired with the env-appropriate secret key. Used
 * for privileged auth operations like `auth.admin.inviteUserByEmail` — the invite
 * must land in the exact project that `/admin/login` authenticates against, so we
 * key off the public auth URL rather than PROD_/DEV_ names (which could point at a
 * different project). `server-only` keeps the secret key out of client bundles.
 */
export function getSupabaseAuthAdmin(): SupabaseClient | null {
  const url = supabasePublicEnv().url
  const key = isProductionEnv()
    ? process.env.PROD_SUPABASE_SECRET_KEY
    : process.env.DEV_SUPABASE_SECRET_KEY
  if (!url || !key) return null
  if (!cachedAuthAdmin) {
    cachedAuthAdmin = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return cachedAuthAdmin
}
