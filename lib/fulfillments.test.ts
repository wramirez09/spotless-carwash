// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

// The shipping queue Joe works from. Query parsing comes straight off the URL,
// so it is the untrusted boundary here — a bad `page` or `pageSize` must clamp
// rather than produce a nonsense range, and the search string is interpolated
// into a PostgREST filter, so its sanitiser is load-bearing.

const { getSupabaseAdmin } = vi.hoisted(() => ({ getSupabaseAdmin: vi.fn() }))
vi.mock('./supabase', () => ({ getSupabaseAdmin }))

import {
  DEFAULT_PAGE_SIZE,
  fetchAllFulfillments,
  fetchFulfillmentStats,
  fetchFulfillments,
  parseFulfillmentQuery,
} from './fulfillments'

/** Records the builder calls so filters/order/range can be asserted. */
function makeSupabase({
  data = [] as unknown[],
  count = 0,
  error = null as unknown,
  headCount = 0,
} = {}) {
  const calls: Record<string, unknown[][]> = {}
  const record = (name: string, args: unknown[]) => {
    ;(calls[name] ??= []).push(args)
  }

  // A FRESH builder per from(): fetchFulfillmentStats issues two queries
  // concurrently, and a shared builder would let the second one's
  // `head: true` select decide what the first one resolves to.
  function newBuilder() {
    const builder: Record<string, unknown> = {}
    let head = false

    const chain =
      (name: string) =>
      (...args: unknown[]) => {
        record(name, args)
        if (name === 'select' && (args[1] as { head?: boolean } | undefined)?.head) {
          head = true
        }
        return builder
      }
    for (const m of ['select', 'eq', 'or', 'order']) builder[m] = chain(m)

    builder.range = (...args: unknown[]) => {
      record('range', args)
      return Promise.resolve({ data, count, error })
    }
    // Awaiting the builder directly — the export path has no .range().
    builder.then = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
      Promise.resolve(
        head ? { data: null, count: headCount, error } : { data, count, error },
      ).then(res, rej)

    return builder
  }

  return { calls, from: (...a: unknown[]) => (record('from', a), newBuilder()) }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('parseFulfillmentQuery', () => {
  it('defaults everything when the URL is bare', () => {
    expect(parseFulfillmentQuery({})).toEqual({
      status: 'all',
      q: '',
      sort: 'created_at',
      dir: 'desc',
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    })
  })

  it('reads a URLSearchParams the same as a plain object', () => {
    const params = new URLSearchParams('status=pending&sort=status&dir=asc&page=3')
    expect(parseFulfillmentQuery(params)).toMatchObject({
      status: 'pending',
      sort: 'status',
      dir: 'asc',
      page: 3,
    })
  })

  it('takes the first value of a repeated param', () => {
    expect(parseFulfillmentQuery({ status: ['shipped', 'pending'] }).status).toBe('shipped')
  })

  it.each(['everything', '', 'PENDING', 'drop table'])(
    'falls back to "all" for an unrecognised status (%s)',
    (status) => {
      expect(parseFulfillmentQuery({ status }).status).toBe('all')
    },
  )

  it('rejects a sort field that is not allowlisted', () => {
    // Sort goes straight into .order(); an arbitrary column would error at
    // PostgREST, so it is constrained to a known list.
    expect(parseFulfillmentQuery({ sort: 'email' }).sort).toBe('created_at')
    expect(parseFulfillmentQuery({ sort: 'tokens_count' }).sort).toBe('tokens_count')
  })

  it('treats any dir but "asc" as descending', () => {
    expect(parseFulfillmentQuery({ dir: 'asc' }).dir).toBe('asc')
    expect(parseFulfillmentQuery({ dir: 'sideways' }).dir).toBe('desc')
  })

  it('clamps a nonsense page to 1', () => {
    expect(parseFulfillmentQuery({ page: '0' }).page).toBe(1)
    expect(parseFulfillmentQuery({ page: '-5' }).page).toBe(1)
    expect(parseFulfillmentQuery({ page: 'abc' }).page).toBe(1)
  })

  it('clamps pageSize to the 1..200 band', () => {
    // An unbounded pageSize would let a URL pull the whole table in one query.
    expect(parseFulfillmentQuery({ pageSize: '99999' }).pageSize).toBe(200)
    expect(parseFulfillmentQuery({ pageSize: '0' }).pageSize).toBe(1)
    expect(parseFulfillmentQuery({ pageSize: '50' }).pageSize).toBe(50)
  })

  it('trims the search term', () => {
    expect(parseFulfillmentQuery({ q: '  joe  ' }).q).toBe('joe')
  })
})

describe('fetchFulfillments', () => {
  const query = parseFulfillmentQuery({})

  it('reports "not configured" instead of throwing when Supabase is unset', async () => {
    getSupabaseAdmin.mockReturnValue(null)
    const page = await fetchFulfillments(query)
    expect(page.configured).toBe(false)
    expect(page.rows).toEqual([])
  })

  it('returns rows with pagination metadata', async () => {
    getSupabaseAdmin.mockReturnValue(
      makeSupabase({ data: [{ id: 'f1' }], count: 51 }),
    )
    const page = await fetchFulfillments({ ...query, pageSize: 25, page: 1 })

    expect(page.rows).toHaveLength(1)
    expect(page.total).toBe(51)
    expect(page.pageCount).toBe(3)
    expect(page.configured).toBe(true)
  })

  it('always reports at least one page, even with no rows', async () => {
    getSupabaseAdmin.mockReturnValue(makeSupabase({ data: [], count: 0 }))
    expect((await fetchFulfillments(query)).pageCount).toBe(1)
  })

  it('requests the range for the page asked for', async () => {
    const sb = makeSupabase({ data: [], count: 0 })
    getSupabaseAdmin.mockReturnValue(sb)
    await fetchFulfillments({ ...query, page: 3, pageSize: 25 })
    expect(sb.calls.range[0]).toEqual([50, 74])
  })

  it('does not filter by status when showing all', async () => {
    const sb = makeSupabase()
    getSupabaseAdmin.mockReturnValue(sb)
    await fetchFulfillments({ ...query, status: 'all' })
    expect(sb.calls.eq).toBeUndefined()
  })

  it('filters by status when one is selected', async () => {
    const sb = makeSupabase()
    getSupabaseAdmin.mockReturnValue(sb)
    await fetchFulfillments({ ...query, status: 'pending' })
    expect(sb.calls.eq[0]).toEqual(['status', 'pending'])
  })

  it('searches the joined subscriber, not the fulfillment row', async () => {
    // Joe looks people up by name or email, never by invoice id.
    const sb = makeSupabase()
    getSupabaseAdmin.mockReturnValue(sb)
    await fetchFulfillments({ ...query, q: 'joe' })
    expect(sb.calls.or[0][0]).toContain('email.ilike.%joe%')
    expect(sb.calls.or[0][1]).toEqual({ referencedTable: 'subscriptions' })
  })

  it('strips PostgREST filter metacharacters from the search term', async () => {
    // `q` is interpolated into an .or() filter string, so a stray comma or
    // paren would change the filter's meaning rather than match literally.
    const sb = makeSupabase()
    getSupabaseAdmin.mockReturnValue(sb)
    await fetchFulfillments({ ...query, q: 'a,b(c)*' })
    expect(sb.calls.or[0][0]).not.toMatch(/[,()*]%/)
    expect(sb.calls.or[0][0]).toContain('a b c')
  })

  it('skips the search filter entirely when the term sanitises to nothing', async () => {
    const sb = makeSupabase()
    getSupabaseAdmin.mockReturnValue(sb)
    await fetchFulfillments({ ...query, q: '(((' })
    expect(sb.calls.or).toBeUndefined()
  })

  it('adds a stable tiebreaker when sorting by a non-unique column', async () => {
    // Without it, equal sort keys shuffle between pages and rows can be
    // shown twice or skipped.
    const sb = makeSupabase()
    getSupabaseAdmin.mockReturnValue(sb)
    await fetchFulfillments({ ...query, sort: 'status' })
    expect(sb.calls.order).toHaveLength(2)
    expect(sb.calls.order[1][0]).toBe('created_at')
  })

  it('does not double-order when already sorting by created_at', async () => {
    const sb = makeSupabase()
    getSupabaseAdmin.mockReturnValue(sb)
    await fetchFulfillments({ ...query, sort: 'created_at' })
    expect(sb.calls.order).toHaveLength(1)
  })

  it('returns an empty page on a query error rather than throwing', async () => {
    getSupabaseAdmin.mockReturnValue(makeSupabase({ error: { message: 'boom' } }))
    const page = await fetchFulfillments(query)
    expect(page.rows).toEqual([])
    expect(page.configured).toBe(true)
  })
})

describe('fetchAllFulfillments', () => {
  const query = parseFulfillmentQuery({})

  it('returns nothing when Supabase is unconfigured', async () => {
    getSupabaseAdmin.mockReturnValue(null)
    expect(await fetchAllFulfillments(query)).toEqual([])
  })

  it('does not paginate — the CSV needs every matching row', async () => {
    const sb = makeSupabase({ data: [{ id: 'a' }, { id: 'b' }] })
    getSupabaseAdmin.mockReturnValue(sb)
    const rows = await fetchAllFulfillments(query)
    expect(rows).toHaveLength(2)
    expect(sb.calls.range).toBeUndefined()
  })

  it('applies the same status and search filters as the table', async () => {
    const sb = makeSupabase()
    getSupabaseAdmin.mockReturnValue(sb)
    await fetchAllFulfillments({ ...query, status: 'shipped', q: 'joe' })
    expect(sb.calls.eq[0]).toEqual(['status', 'shipped'])
    expect(sb.calls.or[0][0]).toContain('joe')
  })

  it('returns an empty list on error', async () => {
    getSupabaseAdmin.mockReturnValue(makeSupabase({ error: { message: 'boom' } }))
    expect(await fetchAllFulfillments(query)).toEqual([])
  })
})

describe('fetchFulfillmentStats', () => {
  it('reports "not configured" when Supabase is unset', async () => {
    getSupabaseAdmin.mockReturnValue(null)
    expect(await fetchFulfillmentStats()).toEqual({
      pending: 0,
      shipped: 0,
      tokensPending: 0,
      configured: false,
    })
  })

  it('counts pending shipments and sums the tokens to mail', async () => {
    getSupabaseAdmin.mockReturnValue(
      makeSupabase({
        data: [{ tokens_count: 4 }, { tokens_count: 8 }],
        headCount: 12,
      }),
    )
    const stats = await fetchFulfillmentStats()
    expect(stats.pending).toBe(2)
    expect(stats.tokensPending).toBe(12)
    expect(stats.shipped).toBe(12)
  })

  it('treats a missing token count as zero rather than NaN', async () => {
    // A NaN would render as "NaN tokens to mail" on the dashboard.
    getSupabaseAdmin.mockReturnValue(
      makeSupabase({ data: [{ tokens_count: 4 }, {}] }),
    )
    const stats = await fetchFulfillmentStats()
    expect(stats.tokensPending).toBe(4)
  })

  it('still returns counters when the pending query errors', async () => {
    getSupabaseAdmin.mockReturnValue(makeSupabase({ error: { message: 'boom' } }))
    const stats = await fetchFulfillmentStats()
    expect(stats.configured).toBe(true)
    expect(stats.pending).toBe(0)
  })
})
