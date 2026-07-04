import 'server-only'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// Server-side Supabase auth client bound to the request cookies. Used in server
// components, route handlers, and server actions to read the current session
// and to sign in/out. Returns null when the public env isn't configured so
// callers can fail closed instead of throwing.
export async function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null

  const cookieStore = await cookies()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        // In Server Components cookies are read-only; the middleware refreshes
        // the session cookies, so swallow the error there. In route handlers /
        // server actions this write succeeds.
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          /* called from a Server Component — safe to ignore */
        }
      },
    },
  })
}

/** Current signed-in user (or null). Uses getUser() which re-validates the JWT. */
export async function getSessionUser() {
  const supabase = await createServerSupabase()
  if (!supabase) return null
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
