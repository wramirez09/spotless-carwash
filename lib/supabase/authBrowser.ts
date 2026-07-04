'use client'

import { createBrowserClient } from '@supabase/ssr'
import { supabasePublicEnv } from './publicEnv'

// Browser-side Supabase client for the login page. Uses the PUBLIC publishable/
// anon key (see publicEnv for the naming rules).
export function createBrowserSupabase() {
  const { url, key } = supabasePublicEnv()
  if (!url || !key) {
    throw new Error('Supabase auth is not configured (missing NEXT_PUBLIC_SUPABASE_URL / key).')
  }
  return createBrowserClient(url, key)
}
