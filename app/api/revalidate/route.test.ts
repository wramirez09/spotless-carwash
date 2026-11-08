// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

// The Sanity publish webhook. A wash package change must reach token pricing
// without anyone opening /admin/pricing — and a failed sync must never break
// page revalidation.

const h = vi.hoisted(() => ({
  parseBody: vi.fn(),
  revalidatePath: vi.fn(),
  sync: vi.fn(),
}))

vi.mock('next-sanity/webhook', () => ({ parseBody: h.parseBody }))
vi.mock('next/cache', () => ({ revalidatePath: h.revalidatePath }))
vi.mock('@/lib/pricingAdmin', () => ({ syncCatalogToWashPackages: h.sync }))

import { POST } from './route'

const req = () => new Request('https://spotless.test/api/revalidate', { method: 'POST', body: '{}' }) as never

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('SANITY_WEBHOOK_SECRET', 'whsec')
  h.sync.mockResolvedValue({ ok: true, message: 'Token prices now match the wash packages (2 changes).' })
})

describe('POST /api/revalidate', () => {
  it('syncs token prices when a wash package is published', async () => {
    h.parseBody.mockResolvedValue({ isValidSignature: true, body: { _type: 'washPackage' } })
    const res = await POST(req())
    expect(res.status).toBe(200)
    expect(h.sync).toHaveBeenCalledWith('sanity-webhook')
    expect(h.revalidatePath).toHaveBeenCalledWith('/', 'layout')
    await expect(res.json()).resolves.toMatchObject({ sync: expect.stringMatching(/match the wash packages/) })
  })

  it('also syncs when the payload does not say what changed (the sync is idempotent)', async () => {
    h.parseBody.mockResolvedValue({ isValidSignature: true, body: {} })
    await POST(req())
    expect(h.sync).toHaveBeenCalled()
  })

  it('skips the sync for unrelated documents', async () => {
    h.parseBody.mockResolvedValue({ isValidSignature: true, body: { _type: 'faqEntry' } })
    await POST(req())
    expect(h.sync).not.toHaveBeenCalled()
    expect(h.revalidatePath).toHaveBeenCalled()
  })

  it('still revalidates and returns 200 when the sync throws', async () => {
    h.parseBody.mockResolvedValue({ isValidSignature: true, body: { _type: 'washPackage' } })
    h.sync.mockRejectedValue(new Error('stripe down'))
    const res = await POST(req())
    expect(res.status).toBe(200)
    expect(h.revalidatePath).toHaveBeenCalled()
  })

  it('rejects a bad signature without syncing', async () => {
    h.parseBody.mockResolvedValue({ isValidSignature: false, body: { _type: 'washPackage' } })
    const res = await POST(req())
    expect(res.status).toBe(401)
    expect(h.sync).not.toHaveBeenCalled()
  })
})
