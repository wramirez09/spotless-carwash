// Public Supabase config shared by the browser, server, and middleware auth
// clients. Accepts either the modern publishable key
// (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `sb_publishable_…`) or the legacy anon
// key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`). The literal `process.env.NEXT_PUBLIC_*`
// references here are what Next inlines into the client bundle — a `PROD_`-
// prefixed name would NOT be inlined, which is why these must be plain
// NEXT_PUBLIC names, set per Vercel environment.
export function supabasePublicEnv(): { url?: string; key?: string } {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }
}

export function isSupabaseAuthConfigured(): boolean {
  const { url, key } = supabasePublicEnv()
  return Boolean(url && key)
}
