'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { Signup, SignupQuery, SortField, StatusFilter } from '@/lib/signups'

type Props = {
  rows: Signup[]
  total: number
  page: number
  pageSize: number
  pageCount: number
  query: SignupQuery
  sources: string[]
}

const STATUS_TABS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'subscribed', label: 'Subscribed' },
  { value: 'unsubscribed', label: 'Unsubscribed' },
]

const COLUMNS: Array<{ key: SortField | 'phone' | 'consent'; label: string; sortable: boolean }> = [
  { key: 'email', label: 'Email', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'phone', label: 'Phone', sortable: false },
  { key: 'source', label: 'Source', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'consent', label: 'Consent', sortable: false },
  { key: 'created_at', label: 'Signed up', sortable: true },
]

const dateFmt = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

function formatDate(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : dateFmt.format(d)
}

export default function SignupsTable({
  rows,
  total,
  page,
  pageSize,
  pageCount,
  query,
  sources,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Local, controlled search box; committed to the URL after a short debounce.
  const [search, setSearch] = useState(query.q)
  useEffect(() => setSearch(query.q), [query.q])

  const pushParams = useCallback(
    (updates: Record<string, string | null>, resetPage = true) => {
      const next = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') next.delete(key)
        else next.set(key, value)
      }
      if (resetPage) next.delete('page')
      const qs = next.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  // Debounce search → URL.
  useEffect(() => {
    if (search === query.q) return
    const t = setTimeout(() => pushParams({ q: search.trim() || null }), 300)
    return () => clearTimeout(t)
  }, [search, query.q, pushParams])

  function toggleSort(field: SortField) {
    const dir = query.sort === field && query.dir === 'desc' ? 'asc' : 'desc'
    pushParams({ sort: field, dir })
  }

  const firstRow = total === 0 ? 0 : (page - 1) * pageSize + 1
  const lastRow = Math.min(page * pageSize, total)

  return (
    <section aria-label="Sign-ups">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-3">
        <div className="inline-flex rounded-full bg-paper p-1">
          {STATUS_TABS.map((tab) => {
            const active = query.status === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => pushParams({ status: tab.value === 'all' ? null : tab.value })}
                className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
                  active ? 'bg-blue-700 text-white' : 'text-slate-500 hover:text-blue-700'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {sources.length > 0 && (
          <select
            value={query.source ?? 'all'}
            onChange={(e) => pushParams({ source: e.target.value === 'all' ? null : e.target.value })}
            className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink outline-none focus:border-blue-500"
            aria-label="Filter by source"
          >
            <option value="all">All sources</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}

        <div className="relative ml-auto min-w-[200px] flex-1 sm:max-w-[320px]">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email or name…"
            className="w-full rounded-full border border-line bg-white px-4 py-2 pr-9 text-sm text-ink outline-none placeholder:text-slate-400 focus:border-blue-500"
            aria-label="Search sign-ups"
          />
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[820px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-paper">
              {COLUMNS.map((col) => {
                const isSorted = col.sortable && query.sort === col.key
                return (
                  <th
                    key={col.key}
                    className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500"
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key as SortField)}
                        className={`inline-flex items-center gap-1 transition hover:text-blue-700 ${
                          isSorted ? 'text-blue-700' : ''
                        }`}
                      >
                        {col.label}
                        <span aria-hidden className="text-[10px]">
                          {isSorted ? (query.dir === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-16 text-center text-slate-400">
                  No sign-ups match these filters.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0 hover:bg-paper/60">
                  <td className="px-4 py-3 font-semibold text-blue-700">
                    <a href={`mailto:${r.email}`} className="hover:underline">
                      {r.email}
                    </a>
                  </td>
                  <td className="px-4 py-3">{r.name || <span className="text-slate-300">—</span>}</td>
                  <td className="px-4 py-3">
                    {r.phone ? (
                      <a href={`tel:${r.phone}`} className="hover:underline">
                        {r.phone}
                      </a>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.source ? (
                      <span className="rounded-full bg-paper2 px-2.5 py-1 text-xs font-bold text-blue-700">
                        {r.source}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                        r.status === 'subscribed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          r.status === 'subscribed' ? 'bg-green-500' : 'bg-slate-400'
                        }`}
                      />
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.marketing_consent ? (
                      <span className="text-green-600" aria-label="Consented">
                        ✓
                      </span>
                    ) : (
                      <span className="text-slate-300" aria-label="No consent">
                        —
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                    {formatDate(r.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {total === 0 ? (
            'No results'
          ) : (
            <>
              Showing <span className="font-bold text-ink">{firstRow.toLocaleString()}</span>–
              <span className="font-bold text-ink">{lastRow.toLocaleString()}</span> of{' '}
              <span className="font-bold text-ink">{total.toLocaleString()}</span>
            </>
          )}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => pushParams({ page: String(page - 1) }, false)}
            className="rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-blue-700 transition hover:border-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Prev
          </button>
          <span className="px-2 text-sm font-semibold text-slate-500">
            Page {page} of {pageCount}
          </span>
          <button
            type="button"
            disabled={page >= pageCount}
            onClick={() => pushParams({ page: String(page + 1) }, false)}
            className="rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-blue-700 transition hover:border-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  )
}
