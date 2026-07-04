import 'server-only'
import { getSupabaseAdmin } from './supabase'

// Read-side of the promotions list, for the /admin dashboard. Uses the same
// service-role admin client as lib/promotions (PROD project on Vercel
// Production, DEV project everywhere else), so it reads whichever database the
// signup writes land in.

const TABLE = 'promotion_signups'

export type SignupStatus = 'subscribed' | 'unsubscribed'

export type Signup = {
  id: string
  email: string
  name: string | null
  phone: string | null
  source: string | null
  marketing_consent: boolean
  status: SignupStatus
  unsubscribed_at: string | null
  customer_id: string | null
  created_at: string
  updated_at: string
}

export type StatusFilter = 'all' | SignupStatus
export type SortField = 'created_at' | 'email' | 'name' | 'source' | 'status'
export type SortDir = 'asc' | 'desc'

export type SignupQuery = {
  status: StatusFilter
  source: string | null // null = any source
  q: string // free-text search over email/name (trimmed, may be empty)
  sort: SortField
  dir: SortDir
  page: number // 1-based
  pageSize: number
}

export const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 200
const SORT_FIELDS: SortField[] = ['created_at', 'email', 'name', 'source', 'status']

// The columns pulled for the table + CSV. Kept explicit so a schema change is a
// deliberate edit here rather than an accidental `select('*')` leak.
const SELECT_COLS =
  'id, email, name, phone, source, marketing_consent, status, unsubscribed_at, customer_id, created_at, updated_at'

function toInt(value: string | null | undefined, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) ? Math.floor(n) : fallback
}

/**
 * Normalize raw URL search params into a validated SignupQuery. Shared by the
 * dashboard page and the CSV export route so their filters always agree.
 * Accepts a plain record (Next server `searchParams`) or a URLSearchParams.
 */
export function parseSignupQuery(
  input: URLSearchParams | Record<string, string | string[] | undefined>,
): SignupQuery {
  const get = (key: string): string | undefined => {
    if (input instanceof URLSearchParams) return input.get(key) ?? undefined
    const v = input[key]
    return Array.isArray(v) ? v[0] : v
  }

  const statusRaw = get('status')
  const status: StatusFilter =
    statusRaw === 'subscribed' || statusRaw === 'unsubscribed' ? statusRaw : 'all'

  const sortRaw = get('sort') as SortField | undefined
  const sort: SortField = sortRaw && SORT_FIELDS.includes(sortRaw) ? sortRaw : 'created_at'

  const dir: SortDir = get('dir') === 'asc' ? 'asc' : 'desc'

  const sourceRaw = (get('source') ?? '').trim()
  const source = sourceRaw && sourceRaw !== 'all' ? sourceRaw : null

  const page = Math.max(1, toInt(get('page'), 1))
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, toInt(get('pageSize'), DEFAULT_PAGE_SIZE)))

  return {
    status,
    source,
    q: (get('q') ?? '').trim(),
    sort,
    dir,
    page,
    pageSize,
  }
}

// PostgREST `or` filters treat commas/parens as syntax; a search term
// containing them would corrupt the filter. Strip them defensively — the search
// is a convenience, not a place for raw operators.
function sanitizeSearch(q: string): string {
  return q.replace(/[,()*]/g, ' ').trim()
}

export type SignupsPage = {
  rows: Signup[]
  total: number // total rows matching the filters (ignoring pagination)
  page: number
  pageSize: number
  pageCount: number
  configured: boolean // false when Supabase env is missing
}

/** Fetch one filtered/sorted/paginated page of signups plus the total count. */
export async function fetchSignups(query: SignupQuery): Promise<SignupsPage> {
  const empty: SignupsPage = {
    rows: [],
    total: 0,
    page: query.page,
    pageSize: query.pageSize,
    pageCount: 0,
    configured: true,
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) return { ...empty, configured: false }

  let q = supabase.from(TABLE).select(SELECT_COLS, { count: 'exact' })

  if (query.status !== 'all') q = q.eq('status', query.status)
  if (query.source) q = q.eq('source', query.source)

  const search = sanitizeSearch(query.q)
  if (search) q = q.or(`email.ilike.%${search}%,name.ilike.%${search}%`)

  q = q.order(query.sort, { ascending: query.dir === 'asc' })
  // Stable tiebreaker so pagination doesn't shuffle rows with equal sort keys.
  if (query.sort !== 'created_at') q = q.order('created_at', { ascending: false })

  const from = (query.page - 1) * query.pageSize
  q = q.range(from, from + query.pageSize - 1)

  const { data, count, error } = await q
  if (error) {
    console.error('[signups] fetch failed', { error })
    return empty
  }

  const total = count ?? 0
  return {
    rows: (data ?? []) as Signup[],
    total,
    page: query.page,
    pageSize: query.pageSize,
    pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
    configured: true,
  }
}

/** Fetch every row matching the filters (no pagination) — for CSV export. */
export async function fetchAllSignups(query: SignupQuery): Promise<Signup[]> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return []

  let q = supabase.from(TABLE).select(SELECT_COLS)
  if (query.status !== 'all') q = q.eq('status', query.status)
  if (query.source) q = q.eq('source', query.source)
  const search = sanitizeSearch(query.q)
  if (search) q = q.or(`email.ilike.%${search}%,name.ilike.%${search}%`)
  q = q.order(query.sort, { ascending: query.dir === 'asc' })

  const { data, error } = await q
  if (error) {
    console.error('[signups] export fetch failed', { error })
    return []
  }
  return (data ?? []) as Signup[]
}

export type SignupStats = {
  total: number
  subscribed: number
  unsubscribed: number
  newThisWeek: number
  sources: Array<{ source: string; count: number }>
  configured: boolean
}

// A narrow view of the query builder for count-only queries — just the filter
// methods we chain, plus an awaitable result. Avoids the deep generic
// instantiation of Supabase's full PostgrestFilterBuilder type.
type CountQuery = {
  eq(column: string, value: unknown): CountQuery
  gte(column: string, value: unknown): CountQuery
  then<R>(onFulfilled: (r: { count: number | null; error: unknown }) => R): Promise<R>
}

// A head+count query: returns the row count without transferring rows.
async function countWhere(build: (q: CountQuery) => CountQuery): Promise<number> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return 0
  const base = supabase.from(TABLE).select('id', { count: 'exact', head: true }) as unknown as CountQuery
  const { count, error } = await build(base)
  if (error) {
    console.error('[signups] count failed', { error })
    return 0
  }
  return count ?? 0
}

/** Aggregate figures for the dashboard's stat cards. */
export async function fetchSignupStats(): Promise<SignupStats> {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return { total: 0, subscribed: 0, unsubscribed: 0, newThisWeek: 0, sources: [], configured: false }
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [total, subscribed, unsubscribed, newThisWeek, sourcesRes] = await Promise.all([
    countWhere((q) => q),
    countWhere((q) => q.eq('status', 'subscribed')),
    countWhere((q) => q.eq('status', 'unsubscribed')),
    countWhere((q) => q.gte('created_at', weekAgo)),
    // Only the `source` column is transferred; grouped in JS (the list is small
    // and Supabase JS has no native GROUP BY without an RPC).
    supabase.from(TABLE).select('source'),
  ])

  const counts = new Map<string, number>()
  const rows = (sourcesRes.data ?? []) as Array<{ source: string | null }>
  for (const r of rows) {
    const key = r.source || 'unknown'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const sources = [...counts.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)

  return { total, subscribed, unsubscribed, newThisWeek, sources, configured: true }
}

/** Distinct source values, for the filter dropdown. */
export async function fetchSignupSources(): Promise<string[]> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return []
  const { data, error } = await supabase.from(TABLE).select('source')
  if (error) return []
  const set = new Set<string>()
  for (const r of (data ?? []) as Array<{ source: string | null }>) {
    if (r.source) set.add(r.source)
  }
  return [...set].sort()
}
