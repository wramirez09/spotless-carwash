// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Adding a wash package from the admin: write it to the CMS, then put its
// tokens on sale. The CMS client and the sync are faked.

const h = vi.hoisted(() => ({
  fetch: vi.fn(),
  create: vi.fn(),
  withConfig: vi.fn(),
  sync: vi.fn(),
  audit: vi.fn(),
}))

vi.mock('./sanity', () => ({
  sanityClient: {
    withConfig: (cfg: unknown) => {
      h.withConfig(cfg)
      return { fetch: h.fetch, create: h.create }
    },
  },
}))
vi.mock('./pricingAdmin', () => ({ syncCatalogToWashPackages: h.sync, audit: h.audit }))

import { createWashPackage, washPackageWritesEnabled } from './washPackagesAdmin'

const LIVE = [
  { _id: 'washPackage-09', name: 'Deluxe', priceNumber: 10, order: 1 },
  { _id: 'washPackage-10', name: 'Ultimate', priceNumber: 12, order: 2 },
  { _id: 'washPackage-12', name: 'Lustre', priceNumber: 14, order: 3 },
]
const input = {
  name: 'Platinum',
  priceNumber: 16,
  color: 'red',
  features: ['Ceramic sealant', 'Air cannon dryer'],
  actorEmail: 'will@example.com',
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('SANITY_WRITE_TOKEN', 'sk_write')
  h.fetch.mockResolvedValue(LIVE)
  h.create.mockImplementation(async (doc: unknown) => doc)
  h.sync.mockResolvedValue({ ok: true, message: 'Token prices now match the wash packages (2 changes).' })
})

describe('createWashPackage', () => {
  it('writes the package to the CMS with the write token, then puts its tokens on sale', async () => {
    const result = await createWashPackage(input)

    expect(result.ok).toBe(true)
    expect(h.withConfig).toHaveBeenCalledWith(expect.objectContaining({ token: 'sk_write', useCdn: false }))
    expect(h.create).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: 'washPackage-platinum',
        _type: 'washPackage',
        name: 'Platinum',
        priceNumber: 16,
        order: 4,
      }),
    )
    // Sync runs AFTER the write, so it sees the new package.
    expect(h.sync).toHaveBeenCalledWith('will@example.com')
    expect(h.create.mock.invocationCallOrder[0]).toBeLessThan(h.sync.mock.invocationCallOrder[0])
    expect(result.message).toMatch(/"Platinum" \(\$16\) is on the site\. Its tokens are on sale/)
    expect(h.audit).toHaveBeenCalledWith(
      'will@example.com',
      'washPackage.create',
      expect.objectContaining({ id: 'washPackage-platinum' }),
    )
  })

  it('gives a second package with the same slug its own id', async () => {
    h.fetch.mockResolvedValue([...LIVE, { _id: 'washPackage-platinum', name: 'Old', priceNumber: 30, order: 9 }])
    await createWashPackage(input)
    expect(h.create.mock.calls[0][0]._id).toBe('washPackage-platinum-2')
  })

  it('refuses a duplicate price before writing anything', async () => {
    const result = await createWashPackage({ ...input, priceNumber: 14 })
    expect(result.ok).toBe(false)
    expect(result.message).toMatch(/Lustre is already \$14/)
    expect(h.create).not.toHaveBeenCalled()
    expect(h.sync).not.toHaveBeenCalled()
  })

  it('still reports the package as added when the token sync falls short', async () => {
    h.sync.mockResolvedValue({ ok: false, message: 'Stripe could not be reached' })
    const result = await createWashPackage(input)
    expect(result.ok).toBe(true)
    expect(result.message).toMatch(/not on sale yet/)
    expect(result.message).toMatch(/Sync to wash packages/)
  })

  it('reports a CMS rejection and does not sync', async () => {
    h.create.mockRejectedValue(new Error('Insufficient permissions'))
    const result = await createWashPackage(input)
    expect(result.ok).toBe(false)
    expect(result.message).toMatch(/Insufficient permissions/)
    expect(h.sync).not.toHaveBeenCalled()
  })

  it('reports an unreachable CMS without writing', async () => {
    h.fetch.mockRejectedValue(new Error('timeout'))
    const result = await createWashPackage(input)
    expect(result.ok).toBe(false)
    expect(h.create).not.toHaveBeenCalled()
  })

  it('is off, and says how to add one instead, without a write token', async () => {
    vi.stubEnv('SANITY_WRITE_TOKEN', '')
    expect(washPackageWritesEnabled()).toBe(false)
    const result = await createWashPackage(input)
    expect(result.ok).toBe(false)
    expect(result.message).toMatch(/SANITY_WRITE_TOKEN/)
    expect(h.create).not.toHaveBeenCalled()
  })
})
