// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'

const { getSupabaseAdmin } = vi.hoisted(() => ({ getSupabaseAdmin: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin }))
vi.mock('server-only', () => ({}))

import { parseSignupQuery, fetchSignups, DEFAULT_PAGE_SIZE } from './signups'

afterEach(() => vi.clearAllMocks())

// --- parseSignupQuery -----------------------------------------------------

describe('parseSignupQuery', () => {
  it('applies sensible defaults for an empty input', () => {
    expect(parseSignupQuery({})).toEqual({
      status: 'all',
      source: null,
      q: '',
      sort: 'created_at',
      dir: 'desc',
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    })
  })

  it('accepts valid status/sort/dir and trims search', () => {
    const q = parseSignupQuery({ status: 'unsubscribed', sort: 'email', dir: 'asc', q: '  jo  ' })
    expect(q.status).toBe('unsubscribed')
    expect(q.sort).toBe('email')
    expect(q.dir).toBe('asc')
    expect(q.q).toBe('jo')
  })

  it('falls back on invalid enum values', () => {
    const q = parseSignupQuery({ status: 'bogus', sort: 'ssn', dir: 'sideways' })
    expect(q.status).toBe('all')
    expect(q.sort).toBe('created_at')
    expect(q.dir).toBe('desc')
  })

  it('treats source "all"/empty as no filter', () => {
    expect(parseSignupQuery({ source: 'all' }).source).toBeNull()
    expect(parseSignupQuery({ source: '  ' }).source).toBeNull()
    expect(parseSignupQuery({ source: 'home' }).source).toBe('home')
  })

  it('clamps page and pageSize to valid bounds', () => {
    expect(parseSignupQuery({ page: '0' }).page).toBe(1)
    expect(parseSignupQuery({ page: '-5' }).page).toBe(1)
    expect(parseSignupQuery({ page: '3' }).page).toBe(3)
    expect(parseSignupQuery({ pageSize: '9999' }).pageSize).toBe(200)
    expect(parseSignupQuery({ pageSize: '0' }).pageSize).toBe(1)
    expect(parseSignupQuery({ pageSize: 'abc' }).pageSize).toBe(DEFAULT_PAGE_SIZE)
  })

  it('reads the first value from array-shaped params', () => {
    expect(parseSignupQuery({ status: ['subscribed', 'unsubscribed'] }).status).toBe('subscribed')
  })

  it('accepts a URLSearchParams instance', () => {
    const q = parseSignupQuery(new URLSearchParams('status=subscribed&sort=name&dir=asc&page=2'))
    expect(q).toMatchObject({ status: 'subscribed', sort: 'name', dir: 'asc', page: 2 })
  })
})

// --- fetchSignups (filter/sort/pagination translation) --------------------

function makeQueryBuilder(result: unknown) {
  const calls: Record<string, unknown[][]> = { select: [], eq: [], or: [], order: [], range: [] }
  const builder: Record<string, unknown> = {
    then: (onFulfilled: (v: unknown) => unknown) => Promise.resolve(result).then(onFulfilled),
  }
  for (const m of ['select', 'eq', 'or', 'order', 'range', 'gte']) {
    builder[m] = vi.fn((...args: unknown[]) => {
      ;(calls[m] ??= []).push(args)
      return builder
    })
  }
  const from = vi.fn(() => builder)
  return { client: { from }, calls, builder }
}

describe('fetchSignups', () => {
  it('reports not-configured when there is no admin client', async () => {
    getSupabaseAdmin.mockReturnValue(null)
    const res = await fetchSignups(parseSignupQuery({}))
    expect(res.configured).toBe(false)
    expect(res.rows).toEqual([])
  })

  it('translates filters, search, sort and pagination into query calls', async () => {
    const rows = [{ id: '1' }]
    const sb = makeQueryBuilder({ data: rows, count: 51, error: null })
    getSupabaseAdmin.mockReturnValue(sb.client)

    const res = await fetchSignups(
      parseSignupQuery({ status: 'subscribed', source: 'home', q: 'jo', sort: 'email', dir: 'asc', page: '3', pageSize: '25' }),
    )

    // status + source become .eq filters
    expect(sb.calls.eq).toContainEqual(['status', 'subscribed'])
    expect(sb.calls.eq).toContainEqual(['source', 'home'])
    // search becomes an ilike OR across email + name
    expect(sb.calls.or[0][0]).toBe('email.ilike.%jo%,name.ilike.%jo%')
    // primary sort + created_at tiebreaker
    expect(sb.calls.order[0]).toEqual(['email', { ascending: true }])
    expect(sb.calls.order[1]).toEqual(['created_at', { ascending: false }])
    // page 3 @ size 25 → rows 50..74
    expect(sb.calls.range[0]).toEqual([50, 74])

    expect(res.total).toBe(51)
    expect(res.pageCount).toBe(3)
    expect(res.rows).toEqual(rows)
  })

  it('strips PostgREST operator chars from the search term', async () => {
    const sb = makeQueryBuilder({ data: [], count: 0, error: null })
    getSupabaseAdmin.mockReturnValue(sb.client)
    await fetchSignups(parseSignupQuery({ q: 'a,b(c)*' }))
    expect(sb.calls.or[0][0]).toBe('email.ilike.%a b c%,name.ilike.%a b c%')
  })
})
