import type { Metadata } from 'next'
import ResetForm from './ResetForm'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Reset password · Spotless Admin',
  robots: { index: false, follow: false },
}

// Reached only with an active session — the middleware bounces anyone without
// one to /admin/login. The password-reset email lands on /admin/auth/confirm,
// which establishes the recovery session and forwards here.
export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5 text-ink">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-blue-500">
            Spotless Admin
          </p>
          <h1 className="display text-[36px] leading-none text-blue-700">Set a new password</h1>
          <p className="mt-2 text-sm text-slate-500">
            Choose a new password for your admin account.
          </p>
        </div>
        <div className="rounded-[28px] border border-line bg-white p-6 shadow-[0_30px_60px_-40px_rgba(8,24,63,0.4)]">
          <ResetForm />
        </div>
      </div>
    </div>
  )
}
