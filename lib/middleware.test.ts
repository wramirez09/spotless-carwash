// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from '../middleware'

function req(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(new URL(`https://spotless.test${path}`), { headers })
}

const basic = (user: string, pass: string) => `Basic ${btoa(`${user}:${pass}`)}`

beforeEach(() => {
  vi.stubEnv('ADMIN_USER', 'joe')
  vi.stubEnv('ADMIN_PASSWORD', 's3cret')
  vi.stubEnv('UNDER_CONSTRUCTION', 'false')
})
afterEach(() => vi.unstubAllEnvs())

describe('middleware — /admin Basic Auth', () => {
  it('challenges when no credentials are sent', () => {
    const res = middleware(req('/admin/signups'))
    expect(res.status).toBe(401)
    expect(res.headers.get('www-authenticate')).toMatch(/^Basic/)
  })

  it('rejects wrong credentials', () => {
    const res = middleware(req('/admin/signups', { authorization: basic('joe', 'wrong') }))
    expect(res.status).toBe(401)
  })

  it('rejects a malformed authorization header', () => {
    const res = middleware(req('/admin/signups', { authorization: 'Bearer abc' }))
    expect(res.status).toBe(401)
  })

  it('allows correct credentials through', () => {
    const res = middleware(req('/admin/signups', { authorization: basic('joe', 's3cret') }))
    expect(res.status).not.toBe(401)
    expect(res.headers.get('www-authenticate')).toBeNull()
    expect(res.headers.get('x-middleware-next')).toBe('1')
  })

  it('fails closed when admin env is not configured', () => {
    vi.stubEnv('ADMIN_USER', '')
    vi.stubEnv('ADMIN_PASSWORD', '')
    const res = middleware(req('/admin/signups', { authorization: basic('joe', 's3cret') }))
    expect(res.status).toBe(401)
  })

  it('stays Basic-Auth gated even while under construction (not rewritten)', () => {
    vi.stubEnv('UNDER_CONSTRUCTION', 'true')
    const res = middleware(req('/admin/signups', { authorization: basic('joe', 's3cret') }))
    expect(res.status).not.toBe(401)
    expect(res.headers.get('x-middleware-rewrite')).toBeNull()
  })
})

describe('middleware — public site', () => {
  it('passes public paths through when not under construction', () => {
    const res = middleware(req('/faq'))
    expect(res.status).not.toBe(401)
    expect(res.headers.get('x-middleware-rewrite')).toBeNull()
    expect(res.headers.get('x-middleware-next')).toBe('1')
  })

  it('rewrites public paths to /under-construction when the flag is on', () => {
    vi.stubEnv('UNDER_CONSTRUCTION', 'true')
    const res = middleware(req('/faq'))
    expect(res.headers.get('x-middleware-rewrite')).toContain('/under-construction')
  })
})
