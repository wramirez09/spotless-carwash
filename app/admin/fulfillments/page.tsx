import type { Metadata } from 'next'
import {
  fetchFulfillmentStats,
  fetchFulfillments,
  parseFulfillmentQuery,
} from '@/lib/fulfillments'
import { getSessionUser } from '@/lib/supabase/authServer'
import { signOut } from '../login/actions'
import FulfillmentsTable from './FulfillmentsTable'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Shipping queue · Spotless Admin',
  robots: { index: false, follow: false },
}

function Card({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: string | number
  hint?: string
  accent?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        accent ? 'border-blue-700 bg-blue-700 text-white' : 'border-line bg-white text-ink'
      }`}
    >
      <p
        className={`font-mono text-[11px] uppercase tracking-[0.18em] ${
          accent ? 'text-sky-400' : 'text-blue-500'
        }`}
      >
        {label}
      </p>
      <p className="mt-2 display text-[40px] leading-none">{value}</p>
      {hint && (
        <p
          className={`mt-1 text-xs font-semibold ${accent ? 'text-white/70' : 'text-slate-400'}`}
        >
          {hint}
        </p>
      )}
    </div>
  )
}

export default async function FulfillmentsDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const query = parseFulfillmentQuery(params)

  const [pageData, stats, user] = await Promise.all([
    fetchFulfillments(query),
    fetchFulfillmentStats(),
    getSessionUser(),
  ])

  const exportQs = new URLSearchParams()
  if (query.status !== 'all') exportQs.set('status', query.status)
  if (query.q) exportQs.set('q', query.q)
  exportQs.set('sort', query.sort)
  exportQs.set('dir', query.dir)
  const exportHref = `/admin/fulfillments/export?${exportQs.toString()}`

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-5 py-6 md:px-7">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-blue-500">
              Spotless Admin
            </p>
            <h1 className="display text-[32px] leading-none text-blue-700 md:text-[40px]">
              Shipping queue
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/admin/signups"
              className="rounded-full border border-line px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:border-blue-500"
            >
              Sign-ups
            </a>
            <a
              href={exportHref}
              className="inline-flex items-center gap-2 rounded-full bg-blue-700 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-blue-500"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Pick list
            </a>
            {user?.email && (
              <div className="flex items-center gap-2 border-l border-line pl-3">
                <span
                  className="hidden text-xs font-semibold text-slate-500 sm:inline"
                  title={user.email}
                >
                  {user.email}
                </span>
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
              The Supabase environment variables aren&apos;t set for this deployment, so
              there are no shipments to show.
            </p>
          </div>
        ) : (
          <>
            <section aria-label="Summary" className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              <Card label="Waiting to ship" value={stats.pending.toLocaleString()} accent />
              <Card
                label="Tokens to mail"
                value={stats.tokensPending.toLocaleString()}
                hint="Across every pending shipment"
              />
              <Card label="Shipped to date" value={stats.shipped.toLocaleString()} />
            </section>
            <div className="mt-8">
              <FulfillmentsTable
                rows={pageData.rows}
                total={pageData.total}
                page={pageData.page}
                pageCount={pageData.pageCount}
                query={query}
              />
            </div>
          </>
        )}
      </main>
    </div>
  )
}
