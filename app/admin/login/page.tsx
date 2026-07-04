import type { Metadata } from 'next'
import { isSupabaseAuthConfigured } from '@/lib/supabase/publicEnv'
import LoginForm from './LoginForm'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Sign in · Spotless Admin',
  robots: { index: false, follow: false },
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const nextRaw = params.next
  const next = (Array.isArray(nextRaw) ? nextRaw[0] : nextRaw) || undefined
  const notConfigured = !isSupabaseAuthConfigured()

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5 text-ink">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-blue-500">
            Spotless Admin
          </p>
          <h1 className="display text-[36px] leading-none text-blue-700">Sign in</h1>
          <p className="mt-2 text-sm text-slate-500">
            Enter your admin email and password, or request a secure sign-in link.
          </p>
        </div>
        <div className="rounded-[28px] border border-line bg-white p-6 shadow-[0_30px_60px_-40px_rgba(8,24,63,0.4)]">
          <LoginForm next={next} notConfigured={notConfigured} />
        </div>
      </div>
    </div>
  )
}
