'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type {
  Fulfillment,
  FulfillmentQuery,
  SortField,
  StatusFilter,
} from '@/lib/fulfillments'
// Value import must come from the pure module — lib/fulfillments is server-only.
import { addressLines } from '@/lib/shipAddress'
import { markPending, markShipped } from './actions'

type Props = {
  rows: Fulfillment[]
  total: number
  page: number
  pageCount: number
  query: FulfillmentQuery
}

const STATUS_TABS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'pending', label: 'To ship' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'all', label: 'All' },
]

const COLUMNS: Array<{ key: SortField | 'subscriber' | 'address' | 'action'; label: string; sortable: boolean }> = [
  { key: 'subscriber', label: 'Subscriber', sortable: false },
  { key: 'address', label: 'Ship to', sortable: false },
  { key: 'tokens_count', label: 'Tokens', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'created_at', label: 'Due', sortable: true },
  { key: 'action', label: '', sortable: false },
]

const dateFmt = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : dateFmt.format(d)
}

function ShipCell({ row }: { row: Fulfillment }) {
  const [pending, startTransition] = useTransition()
  const [tracking, setTracking] = useState('')
  const [error, setError] = useState('')

  if (row.status === 'shipped') {
    return (
      <div className="flex flex-col items-end gap-1">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-400">
          {formatDate(row.shipped_at)}
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await markPending(row.id)
              if (!res.ok) setError(res.message)
            })
          }
          className="text-xs font-semibold text-blue-500 underline underline-offset-2 disabled:opacity-50"
        >
          Undo
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          // Letter-rate mail has no tracking, so this stays blank on most rows.
          placeholder="Tracking (optional)"
          aria-label={`Tracking number for ${row.subscriptions?.name || row.subscriptions?.email || 'subscriber'}`}
          className="w-[150px] rounded-full border border-line bg-white px-3 py-1.5 text-xs text-ink placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError('')
              const res = await markShipped(row.id, tracking)
              if (!res.ok) setError(res.message)
            })
          }
          className="whitespace-nowrap rounded-full bg-blue-700 px-4 py-1.5 text-xs font-extrabold text-white transition hover:bg-blue-500 disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Mark shipped'}
        </button>
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}

export default function FulfillmentsTable({ rows, total, page, pageCount, query }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

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
      router.push(`${pathname}?${next.toString()}`)
    },
    [pathname, router, searchParams],
  )

  // Debounce the search box so typing doesn't fire a request per keystroke.
  useEffect(() => {
    if (search === query.q) return
    const t = setTimeout(() => pushParams({ q: search }), 300)
    return () => clearTimeout(t)
  }, [search, query.q, pushParams])

  const toggleSort = (field: SortField) => {
    const dir = query.sort === field && query.dir === 'desc' ? 'asc' : 'desc'
    pushParams({ sort: field, dir }, false)
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={query.status === tab.value}
              onClick={() => pushParams({ status: tab.value === 'all' ? null : tab.value })}
              className={`rounded-full px-4 py-2 text-sm font-extrabold transition ${
                query.status === tab.value
                  ? 'bg-blue-700 text-white'
                  : 'border border-line bg-white text-blue-700 hover:border-blue-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or email"
          aria-label="Search subscribers"
          className="w-full max-w-[280px] rounded-full border border-line bg-white px-4 py-2 text-sm text-ink placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[820px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-400"
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key as SortField)}
                      className="uppercase tracking-[0.14em] hover:text-blue-500"
                    >
                      {col.label}
                      {query.sort === col.key ? (query.dir === 'asc' ? ' ↑' : ' ↓') : ''}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-slate-400">
                  Nothing to ship right now.
                </td>
              </tr>
            )}
            {rows.map((row) => {
              const sub = row.subscriptions
              const lines = addressLines(sub)
              return (
                <tr key={row.id} className="border-b border-line last:border-0 align-top">
                  <td className="px-4 py-4">
                    <div className="font-extrabold text-ink">{sub?.name || '—'}</div>
                    <div className="text-xs text-slate-400">{sub?.email ?? '—'}</div>
                    {sub?.plan && (
                      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-blue-500">
                        {sub.plan}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-ink">
                    {lines.length ? (
                      lines.map((l) => <div key={l}>{l}</div>)
                    ) : (
                      <span className="text-slate-400">No address on file</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className="display text-[24px] leading-none text-blue-700">
                      {row.tokens_count}
                    </span>
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">
                      ${row.wash_value} tokens
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-block rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] ${
                        row.status === 'shipped'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {row.status}
                    </span>
                    {row.tracking_number && (
                      <div className="mt-1 font-mono text-[10px] text-slate-400">
                        {row.tracking_number}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-slate-500">{formatDate(row.created_at)}</td>
                  <td className="px-4 py-4 text-right">
                    <ShipCell row={row} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
        <span>
          {total.toLocaleString()} shipment{total === 1 ? '' : 's'}
        </span>
        {pageCount > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => pushParams({ page: String(page - 1) }, false)}
              className="rounded-full border border-line bg-white px-4 py-2 font-extrabold text-blue-700 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="font-mono text-xs uppercase tracking-[0.14em]">
              {page} / {pageCount}
            </span>
            <button
              type="button"
              disabled={page >= pageCount}
              onClick={() => pushParams({ page: String(page + 1) }, false)}
              className="rounded-full border border-line bg-white px-4 py-2 font-extrabold text-blue-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
