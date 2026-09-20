// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Which Supabase project the server writes to. Getting this wrong writes real
// customer rows into the dev project, or — far worse — writes test data into
// production. The rule is: PROD_* only on Vercel Production, DEV_* everywhere
// else, and fail closed (null) when unconfigured rather than guessing.

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({ createClient }))

/** Fresh module per case — the clients are memoised at module scope. */
async function load() {
  vi.resetModules()
  return import('./supabase')
}

beforeEach(() => {
  vi.clearAllMocks()
  createClient.mockImplementation((url: string) => ({ url }))
  vi.stubEnv('PROD_SUPABASE_URL', 'https://prod.supabase.co')
  vi.stubEnv('PROD_SUPABASE_SECRET_KEY', 'prod-key')
  vi.stubEnv('DEV_SUPABASE_URL', 'https://dev.supabase.co')
  vi.stubEnv('DEV_SUPABASE_SECRET_KEY', 'dev-key')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://auth.supabase.co')
})

afterEach(() => vi.unstubAllEnvs())

describe('getSupabaseAdmin', () => {
  it('uses the PROD project on Vercel Production', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    const { getSupabaseAdmin } = await load()
    getSupabaseAdmin()
    expect(createClient).toHaveBeenCalledWith(
      'https://prod.supabase.co',
      'prod-key',
      expect.anything(),
    )
  })

  it.each(['preview', 'development', undefined])(
    'uses the DEV project when VERCEL_ENV is %s',
    async (env) => {
      // Preview deploys and local dev must keep real customer data out.
      if (env === undefined) vi.stubEnv('VERCEL_ENV', '')
      else vi.stubEnv('VERCEL_ENV', env)
      const { getSupabaseAdmin } = await load()
      getSupabaseAdmin()
      expect(createClient).toHaveBeenCalledWith(
        'https://dev.supabase.co',
        'dev-key',
        expect.anything(),
      )
    },
  )

  it('returns null when the URL is missing rather than guessing', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    vi.stubEnv('DEV_SUPABASE_URL', '')
    const { getSupabaseAdmin } = await load()
    expect(getSupabaseAdmin()).toBeNull()
    expect(createClient).not.toHaveBeenCalled()
  })

  it('returns null when the secret key is missing', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    vi.stubEnv('DEV_SUPABASE_SECRET_KEY', '')
    const { getSupabaseAdmin } = await load()
    expect(getSupabaseAdmin()).toBeNull()
  })

  it('does not fall back to the PROD project when DEV is unset', async () => {
    // A fallback here would silently point local dev at production.
    vi.stubEnv('VERCEL_ENV', 'preview')
    vi.stubEnv('DEV_SUPABASE_URL', '')
    vi.stubEnv('DEV_SUPABASE_SECRET_KEY', '')
    const { getSupabaseAdmin } = await load()
    expect(getSupabaseAdmin()).toBeNull()
  })

  it('creates the client once and reuses it', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    const { getSupabaseAdmin } = await load()
    const a = getSupabaseAdmin()
    const b = getSupabaseAdmin()
    expect(a).toBe(b)
    expect(createClient).toHaveBeenCalledTimes(1)
  })

  it('disables session persistence — this is a server-side client', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    const { getSupabaseAdmin } = await load()
    getSupabaseAdmin()
    expect(createClient.mock.calls[0][2]).toEqual({
      auth: { persistSession: false, autoRefreshToken: false },
    })
  })
})

describe('getSupabaseAuthAdmin', () => {
  it('binds to the project the login flow authenticates against', async () => {
    // An invite must land in the SAME project /admin/login uses, which is
    // keyed off the public URL rather than the PROD_/DEV_ names.
    vi.stubEnv('VERCEL_ENV', 'production')
    const { getSupabaseAuthAdmin } = await load()
    getSupabaseAuthAdmin()
    expect(createClient).toHaveBeenCalledWith(
      'https://auth.supabase.co',
      'prod-key',
      expect.anything(),
    )
  })

  it('pairs the public URL with the DEV secret outside production', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    const { getSupabaseAuthAdmin } = await load()
    getSupabaseAuthAdmin()
    expect(createClient).toHaveBeenCalledWith(
      'https://auth.supabase.co',
      'dev-key',
      expect.anything(),
    )
  })

  it('returns null when the public URL is unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    const { getSupabaseAuthAdmin } = await load()
    expect(getSupabaseAuthAdmin()).toBeNull()
  })

  it('is memoised separately from the data client', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    const { getSupabaseAdmin, getSupabaseAuthAdmin } = await load()
    expect(getSupabaseAdmin()).not.toBe(getSupabaseAuthAdmin())
    expect(createClient).toHaveBeenCalledTimes(2)
  })
})
