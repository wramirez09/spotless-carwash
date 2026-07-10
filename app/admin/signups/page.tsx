import type { Metadata } from 'next'
import {
  fetchSignups,
  fetchSignupStats,
  fetchSignupSources,
  parseSignupQuery,
} from '@/lib/signups'
import { getSessionUser } from '@/lib/supabase/authServer'
import { signOut } from '../login/actions'
import SignupsTable from './SignupsTable'
import StatCards from './StatCards'
import InviteAdmin from './InviteAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Sign-ups · Spotless Admin',
  robots: { index: false, follow: false },
}

export default async function SignupsDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const query = parseSignupQuery(params)

  const [pageData, stats, sources, user] = await Promise.all([
    fetchSignups(query),
    fetchSignupStats(),
    fetchSignupSources(),
    getSessionUser(),
  ])

  const exportQs = new URLSearchParams()
  if (query.status !== 'all') exportQs.set('status', query.status)
  if (query.source) exportQs.set('source', query.source)
  if (query.q) exportQs.set('q', query.q)
  exportQs.set('sort', query.sort)
  exportQs.set('dir', query.dir)
  const exportHref = `/admin/signups/export?${exportQs.toString()}`

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto max-w-[1240px] px-5 py-6 md:px-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-blue-500">
              Spotless Admin
            </p>
            <h1 className="display text-[32px] leading-none md:text-[40px] text-blue-700">
              Email sign-ups
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={exportHref}
              className="inline-flex items-center gap-2 rounded-full bg-blue-700 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-blue-500"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Export CSV
            </a>
            {user?.email && (
              <div className="flex items-center gap-2 border-l border-line pl-3">
                <span className="hidden text-xs font-semibold text-slate-500 sm:inline" title={user.email}>
                  {user.email}
                </span>
                <InviteAdmin />
                <a
                  href="/admin/reset-password"
                  className="rounded-full border border-line px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:border-blue-500"
                >
                  Change password
                </a>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="rounded-full border border-line px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:border-blue-500"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-5 py-8 md:px-7">
        {!stats.configured ? (
          <div className="rounded-2xl border border-line bg-white p-8 text-center">
            <p className="text-lg font-bold text-blue-700">Database not configured</p>
            <p className="mt-2 text-sm text-slate-500">
              The Supabase environment variables aren&apos;t set for this deployment, so there are
              no sign-ups to show.
            </p>
          </div>
        ) : (
          <>
            <StatCards stats={stats} />
            <div className="mt-8">
              <SignupsTable
                rows={pageData.rows}
                total={pageData.total}
                page={pageData.page}
                pageSize={pageData.pageSize}
                pageCount={pageData.pageCount}
                query={query}
                sources={sources}
              />
            </div>
          </>
        )}
      </main>
    </div>
  )
}
