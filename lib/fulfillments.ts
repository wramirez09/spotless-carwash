import 'server-only'
import { getSupabaseAdmin } from './supabase'
import type { ShipTo } from './shipAddress'

// Re-exported so server-side callers (the CSV export) have one import site.
export { addressLines } from './shipAddress'
export type { ShipTo } from './shipAddress'

// Read-side of the subscription shipping queue, for /admin/fulfillments.
// Modelled on lib/signups.ts — same query-parsing, pagination and
// explicit-columns conventions, reading through the same service-role client.

const TABLE = 'fulfillments'

export type FulfillmentStatus = 'pending' | 'shipped'

/** Subscriber fields joined from `subscriptions` for the pick-and-pack list. */
export type FulfillmentSubscriber = ShipTo & {
  email: string
  name: string | null
  plan: string | null
}

export type Fulfillment = {
  id: string
  subscription_id: string | null
  stripe_invoice_id: string
  period_start: string | null
  period_end: string | null
  tokens_count: number
  wash_value: string
  status: FulfillmentStatus
  tracking_number: string | null
  shipped_at: string | null
  created_at: string
  subscriptions: FulfillmentSubscriber | null
}

export type StatusFilter = 'all' | FulfillmentStatus
export type SortField = 'created_at' | 'status' | 'tokens_count'
export type SortDir = 'asc' | 'desc'

export type FulfillmentQuery = {
  status: StatusFilter
  q: string
  sort: SortField
  dir: SortDir
  page: number
  pageSize: number
}

export const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 200
const SORT_FIELDS: SortField[] = ['created_at', 'status', 'tokens_count']

// Explicit columns, never select('*') — a schema change should be a deliberate
// edit here rather than an accidental data leak into the admin UI or CSV.
const SELECT_COLS = `
  id, subscription_id, stripe_invoice_id, period_start, period_end,
  tokens_count, wash_value, status, tracking_number, shipped_at, created_at,
  subscriptions ( email, name, plan, ship_line1, ship_line2, ship_city,
                  ship_state, ship_postal_code, ship_country )
`

function toInt(value: string | null | undefined, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) ? Math.floor(n) : fallback
}

/**
 * Normalize raw URL search params into a validated query. Shared by the
 * dashboard page and the CSV export so their filters can never disagree.
 */
export function parseFulfillmentQuery(
  input: URLSearchParams | Record<string, string | string[] | undefined>,
): FulfillmentQuery {
  const get = (key: string): string | undefined => {
    if (input instanceof URLSearchParams) return input.get(key) ?? undefined
    const v = input[key]
    return Array.isArray(v) ? v[0] : v
  }

  const statusRaw = get('status')
  const status: StatusFilter =
    statusRaw === 'pending' || statusRaw === 'shipped' ? statusRaw : 'all'

  const sortRaw = get('sort') as SortField | undefined
  const sort: SortField = sortRaw && SORT_FIELDS.includes(sortRaw) ? sortRaw : 'created_at'

  const dir: SortDir = get('dir') === 'asc' ? 'asc' : 'desc'

  return {
    status,
    q: (get('q') ?? '').trim(),
    sort,
    dir,
    page: Math.max(1, toInt(get('page'), 1)),
    pageSize: Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, toInt(get('pageSize'), DEFAULT_PAGE_SIZE)),
    ),
  }
}

// PostgREST `or` filters treat commas and parens as syntax, so a search term
// containing them would corrupt the filter. Same defensive strip as signups.
function sanitizeSearch(q: string): string {
  return q.replace(/[,()*]/g, ' ').trim()
}

export type FulfillmentsPage = {
  rows: Fulfillment[]
  total: number
  page: number
  pageSize: number
  pageCount: number
  configured: boolean
}

/** One filtered, sorted, paginated page of the shipping queue. */
export async function fetchFulfillments(
  query: FulfillmentQuery,
): Promise<FulfillmentsPage> {
  const empty: FulfillmentsPage = {
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

  // Search the joined subscriber, not the fulfillment row — Joe looks people up
  // by name or email, never by invoice id.
  const search = sanitizeSearch(query.q)
  if (search) {
    q = q.or(`email.ilike.%${search}%,name.ilike.%${search}%`, {
      referencedTable: 'subscriptions',
    })
  }

  q = q.order(query.sort, { ascending: query.dir === 'asc' })
  // Stable tiebreaker so pagination doesn't shuffle equal sort keys.
  if (query.sort !== 'created_at') q = q.order('created_at', { ascending: false })

  const from = (query.page - 1) * query.pageSize
  const { data, count, error } = await q.range(from, from + query.pageSize - 1)

  if (error) {
    console.error('[fulfillments] fetch failed', { error })
    return empty
  }

  const total = count ?? 0
  return {
    rows: (data ?? []) as unknown as Fulfillment[],
    total,
    page: query.page,
    pageSize: query.pageSize,
    pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
    configured: true,
  }
}

/** Every row matching the filters, unpaginated — for the pick-and-pack CSV. */
export async function fetchAllFulfillments(
  query: FulfillmentQuery,
): Promise<Fulfillment[]> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return []

  let q = supabase.from(TABLE).select(SELECT_COLS)

  if (query.status !== 'all') q = q.eq('status', query.status)
  const search = sanitizeSearch(query.q)
  if (search) {
    q = q.or(`email.ilike.%${search}%,name.ilike.%${search}%`, {
      referencedTable: 'subscriptions',
    })
  }
  q = q.order(query.sort, { ascending: query.dir === 'asc' })

  const { data, error } = await q
  if (error) {
    console.error('[fulfillments] export fetch failed', { error })
    return []
  }
  return (data ?? []) as unknown as Fulfillment[]
}

export type FulfillmentStats = {
  pending: number
  shipped: number
  tokensPending: number
  configured: boolean
}

/** Counters for the dashboard header — what's waiting, and how many tokens. */
export async function fetchFulfillmentStats(): Promise<FulfillmentStats> {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return { pending: 0, shipped: 0, tokensPending: 0, configured: false }
  }

  const [pendingRes, shippedRes] = await Promise.all([
    supabase.from(TABLE).select('tokens_count').eq('status', 'pending'),
    supabase
      .from(TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('status', 'shipped'),
  ])

  if (pendingRes.error) {
    console.error('[fulfillments] stats failed', { error: pendingRes.error })
  }

  const pendingRows = (pendingRes.data ?? []) as Array<{ tokens_count: number }>
  return {
    pending: pendingRows.length,
    shipped: shippedRes.count ?? 0,
    tokensPending: pendingRows.reduce((sum, r) => sum + (r.tokens_count ?? 0), 0),
    configured: true,
  }
}
