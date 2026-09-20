// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The auth clients behind /admin. Both fail closed when the public env is
// unset — the browser one loudly (a misconfigured login page should not
// silently do nothing), the server one quietly, because middleware and server
// components treat null as "no session" and redirect to login.

const { createServerClient, createBrowserClient, cookies } = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  createBrowserClient: vi.fn(),
  cookies: vi.fn(),
}))

vi.mock('@supabase/ssr', () => ({ createServerClient, createBrowserClient }))
vi.mock('next/headers', () => ({ cookies }))

import { supabasePublicEnv, isSupabaseAuthConfigured } from './publicEnv'
import { createServerSupabase, getSessionUser } from './authServer'
import { createBrowserSupabase } from './authBrowser'

const cookieStore = { getAll: vi.fn(() => []), set: vi.fn() }

beforeEach(() => {
  vi.clearAllMocks()
  cookies.mockResolvedValue(cookieStore)
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://proj.supabase.co')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_x')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
})

afterEach(() => vi.unstubAllEnvs())

describe('supabasePublicEnv', () => {
  it('prefers the modern publishable key', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'legacy-anon')
    expect(supabasePublicEnv().key).toBe('sb_publishable_x')
  })

  it('accepts the legacy anon key when no publishable key is set', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'legacy-anon')
    expect(supabasePublicEnv().key).toBe('legacy-anon')
  })

  it('reports configured only when both url and key are present', () => {
    expect(isSupabaseAuthConfigured()).toBe(true)
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    expect(isSupabaseAuthConfigured()).toBe(false)
  })

  it('is not configured when both keys are missing', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
    expect(isSupabaseAuthConfigured()).toBe(false)
  })
})

describe('createServerSupabase', () => {
  it('builds a client bound to the request cookies', async () => {
    createServerClient.mockReturnValue({ id: 'client' })
    const client = await createServerSupabase()
    expect(client).toEqual({ id: 'client' })
    expect(createServerClient).toHaveBeenCalledWith(
      'https://proj.supabase.co',
      'sb_publishable_x',
      expect.objectContaining({ cookies: expect.anything() }),
    )
  })

  it('returns null when unconfigured so callers can fail closed', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    expect(await createServerSupabase()).toBeNull()
    expect(createServerClient).not.toHaveBeenCalled()
  })

  it('reads cookies through the request store', async () => {
    createServerClient.mockReturnValue({})
    await createServerSupabase()
    const opts = createServerClient.mock.calls[0][2]
    opts.cookies.getAll()
    expect(cookieStore.getAll).toHaveBeenCalled()
  })

  it('writes refreshed session cookies when it can', async () => {
    createServerClient.mockReturnValue({})
    await createServerSupabase()
    const opts = createServerClient.mock.calls[0][2]
    opts.cookies.setAll([{ name: 'sb', value: 'v', options: {} }])
    expect(cookieStore.set).toHaveBeenCalledWith('sb', 'v', {})
  })

  it('swallows the cookie write that Server Components forbid', async () => {
    // Middleware refreshes the session, so a read-only context must not throw.
    cookieStore.set.mockImplementation(() => {
      throw new Error('Cookies can only be modified in a Server Action')
    })
    createServerClient.mockReturnValue({})
    await createServerSupabase()
    const opts = createServerClient.mock.calls[0][2]
    expect(() => opts.cookies.setAll([{ name: 'sb', value: 'v', options: {} }])).not.toThrow()
  })
})

describe('getSessionUser', () => {
  it('returns the re-validated user', async () => {
    createServerClient.mockReturnValue({
      auth: { getUser: async () => ({ data: { user: { email: 'joe@example.com' } } }) },
    })
    expect(await getSessionUser()).toEqual({ email: 'joe@example.com' })
  })

  it('returns null when there is no session', async () => {
    createServerClient.mockReturnValue({
      auth: { getUser: async () => ({ data: { user: null } }) },
    })
    expect(await getSessionUser()).toBeNull()
  })

  it('returns null when auth is unconfigured', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    expect(await getSessionUser()).toBeNull()
  })
})

describe('createBrowserSupabase', () => {
  it('builds a browser client from the public env', () => {
    createBrowserClient.mockReturnValue({ id: 'browser' })
    expect(createBrowserSupabase()).toEqual({ id: 'browser' })
  })

  it('throws a named error when unconfigured', () => {
    // Loud here on purpose: a login page that silently does nothing is worse
    // to diagnose than one that reports why.
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    expect(() => createBrowserSupabase()).toThrow(/not configured/i)
  })
})
