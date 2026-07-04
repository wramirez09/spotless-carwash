// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Control the user returned by the mocked Supabase client per test.
const state = vi.hoisted(() => ({ user: null as { email: string } | null }))

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
  }),
}))

import { middleware } from '../middleware'

function req(path: string) {
  return new NextRequest(new URL(`https://spotless.test${path}`))
}

beforeEach(() => {
  state.user = null
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://proj.supabase.co')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key')
  vi.stubEnv('ADMIN_EMAILS', 'joe@spotlessautowash.com')
  vi.stubEnv('UNDER_CONSTRUCTION', 'false')
})
afterEach(() => vi.unstubAllEnvs())

describe('middleware — /admin Supabase gate', () => {
  it('redirects a signed-out visitor to the login page with a next param', async () => {
    const res = await middleware(req('/admin/signups'))
    expect(res.status).toBe(307)
    const loc = res.headers.get('location') ?? ''
    expect(loc).toContain('/admin/login')
    expect(loc).toContain('next=%2Fadmin%2Fsignups')
  })

  it('redirects a signed-in but non-allowlisted user to login', async () => {
    state.user = { email: 'stranger@evil.com' }
    const res = await middleware(req('/admin/signups'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/admin/login')
  })

  it('lets an allowlisted user through', async () => {
    state.user = { email: 'joe@spotlessautowash.com' }
    const res = await middleware(req('/admin/signups'))
    expect(res.status).not.toBe(307)
    expect(res.headers.get('x-middleware-next')).toBe('1')
  })

  it('keeps the login page reachable without a session', async () => {
    const res = await middleware(req('/admin/login'))
    expect(res.status).not.toBe(307)
    expect(res.headers.get('x-middleware-next')).toBe('1')
  })

  it('bounces an already-signed-in user away from the login page', async () => {
    state.user = { email: 'joe@spotlessautowash.com' }
    const res = await middleware(req('/admin/login'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/admin/signups')
  })

  it('keeps the magic-link callback reachable without a session', async () => {
    const res = await middleware(req('/admin/auth/confirm?code=abc'))
    expect(res.status).not.toBe(307)
  })

  it('fails closed to login when Supabase env is unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
    const res = await middleware(req('/admin/signups'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/admin/login')
  })
})

describe('middleware — public site', () => {
  it('passes public paths through when not under construction', async () => {
    const res = await middleware(req('/faq'))
    expect(res.headers.get('x-middleware-rewrite')).toBeNull()
    expect(res.headers.get('x-middleware-next')).toBe('1')
  })

  it('rewrites public paths to /under-construction when the flag is on', async () => {
    vi.stubEnv('UNDER_CONSTRUCTION', 'true')
    const res = await middleware(req('/faq'))
    expect(res.headers.get('x-middleware-rewrite')).toContain('/under-construction')
  })

  it('does not gate non-admin paths on a session', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    const res = await middleware(req('/faq'))
    expect(res.status).not.toBe(307)
  })
})
