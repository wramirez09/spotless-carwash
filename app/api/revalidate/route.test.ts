// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

// The Sanity publish webhook. A wash package change must reach token pricing
// without anyone opening /admin/pricing — and a failed sync must never break
// page revalidation.

const h = vi.hoisted(() => ({
  parseBody: vi.fn(),
  revalidatePath: vi.fn(),
  sync: vi.fn(),
  // Work scheduled with after() — run explicitly so ordering can be asserted.
  afterTasks: [] as (() => Promise<void>)[],
}))

vi.mock('next-sanity/webhook', () => ({ parseBody: h.parseBody }))
vi.mock('next/cache', () => ({ revalidatePath: h.revalidatePath }))
vi.mock('next/server', () => ({ after: (fn: () => Promise<void>) => h.afterTasks.push(fn) }))
const runAfter = async () => {
  for (const t of h.afterTasks.splice(0)) await t()
}
vi.mock('@/lib/pricingAdmin', () => ({ syncCatalogToWashPackages: h.sync }))

import { POST } from './route'

const req = () => new Request('https://spotless.test/api/revalidate', { method: 'POST', body: '{}' }) as never

beforeEach(() => {
  vi.clearAllMocks()
  h.afterTasks.length = 0
  vi.stubEnv('SANITY_WEBHOOK_SECRET', 'whsec')
  h.sync.mockResolvedValue({ ok: true, message: 'Token prices now match the wash packages (2 changes).' })
})

describe('POST /api/revalidate', () => {
  it('revalidates first, then syncs token prices after responding', async () => {
    h.parseBody.mockResolvedValue({ isValidSignature: true, body: { _type: 'washPackage' } })
    const res = await POST(req())
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({ syncing: true })
    // Pages are refreshed before any Stripe work starts…
    expect(h.revalidatePath).toHaveBeenCalledWith('/', 'layout')
    expect(h.sync).not.toHaveBeenCalled()
    // …and the sync runs once the response is out, then refreshes again.
    await runAfter()
    expect(h.sync).toHaveBeenCalledWith('sanity-webhook')
    expect(h.revalidatePath).toHaveBeenCalledTimes(2)
  })

  it('also syncs when the payload does not say what changed (the sync is idempotent)', async () => {
    h.parseBody.mockResolvedValue({ isValidSignature: true, body: {} })
    await POST(req())
    await runAfter()
    expect(h.sync).toHaveBeenCalled()
  })

  it('skips the sync for unrelated documents', async () => {
    h.parseBody.mockResolvedValue({ isValidSignature: true, body: { _type: 'faqEntry' } })
    await POST(req())
    await runAfter()
    expect(h.sync).not.toHaveBeenCalled()
    expect(h.revalidatePath).toHaveBeenCalled()
  })

  it('a sync that throws never affects the response or the page refresh', async () => {
    h.parseBody.mockResolvedValue({ isValidSignature: true, body: { _type: 'washPackage' } })
    h.sync.mockRejectedValue(new Error('stripe down'))
    const res = await POST(req())
    expect(res.status).toBe(200)
    expect(h.revalidatePath).toHaveBeenCalled()
    await expect(runAfter()).resolves.toBeUndefined()
  })

  it('rejects a bad signature without syncing', async () => {
    h.parseBody.mockResolvedValue({ isValidSignature: false, body: { _type: 'washPackage' } })
    const res = await POST(req())
    expect(res.status).toBe(401)
    expect(h.afterTasks).toHaveLength(0)
    expect(h.revalidatePath).not.toHaveBeenCalled()
  })
})
