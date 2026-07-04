'use client'

import { createBrowserClient } from '@supabase/ssr'

// Browser-side Supabase client for the login page. Uses the PUBLIC anon key —
// these two vars must be real `NEXT_PUBLIC_` names so Next inlines them into the
// client bundle (a `PROD_NEXT_PUBLIC_…` prefix would NOT be inlined). Set them
// per Vercel environment so Production points at the prod project and Preview at
// the dev project.
export function createBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      'Supabase auth is not configured (missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).',
    )
  }
  return createBrowserClient(url, anonKey)
}
