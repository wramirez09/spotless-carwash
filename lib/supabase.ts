import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

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
