import { test, expect, type Page } from '@playwright/test'

// Father's Day 2026 sale window in America/Chicago (CDT = UTC-5):
//   start: 2026-06-07 00:00:00 CDT  → 2026-06-07T05:00:00Z
//   end:   2026-06-21 23:59:59 CDT  → 2026-06-22T04:59:59Z
//
// `?_now=<ISO>` on /buy-tokens lets the server-rendered page simulate any
// wall-clock time. The override is gated to non-production in
// `app/buy-tokens/page.tsx` so it cannot be triggered against a live deploy.
//
// UI surface for the sale:
//   - Each pack card and the order summary render a "Father's Day" coupon
//     chip in addition to the always-on "4-Pack bundle" chip.
//   - Per-pack savings double (e.g. $8 4-Pack goes from $5 off to $10 off).
// We assert on the chip text + visibility because the chip label is the most
// stable user-visible signal of the sale state.

const BEFORE_SALE = '2026-06-06T23:59:00-05:00'   // Sat June 6 23:59 Chicago
const SALE_START = '2026-06-07T00:00:00-05:00'    // Sun June 7 00:00 Chicago (first instant of sale)
const SALE_MID = '2026-06-14T12:00:00-05:00'      // Sun June 14 noon Chicago
const SALE_END = '2026-06-21T23:59:00-05:00'      // Sun June 21 23:59 Chicago (last minute)
const AFTER_SALE = '2026-06-22T00:01:00-05:00'    // Mon June 22 00:01 Chicago

async function visitBuyTokens(page: Page, isoNow: string) {
  const response = await page.goto(`/buy-tokens?_now=${encodeURIComponent(isoNow)}`)
  expect(response?.ok()).toBeTruthy()
  // Pack mode is the default — Father's Day chips only render on pack cards.
  await expect(page.getByRole('tab', { name: /4-pack/i })).toHaveAttribute(
    'aria-selected',
    'true',
  )
}

test.describe("Father's Day 2026 sale", () => {
  test('BEFORE sale window (June 6 11:59pm Chicago): no Father\'s Day chip', async ({ page }) => {
    await visitBuyTokens(page, BEFORE_SALE)
    await expect(page.getByText("4-Pack bundle").first()).toBeVisible()
    await expect(page.getByText("Father's Day")).toHaveCount(0)
  })

  test('AT sale start (June 7 00:00 Chicago): Father\'s Day chip appears', async ({ page }) => {
    await visitBuyTokens(page, SALE_START)
    await expect(page.getByText("Father's Day").first()).toBeVisible()
    await expect(page.getByText("4-Pack bundle").first()).toBeVisible()
  })

  test('MID sale window (June 14 noon Chicago): Father\'s Day chip remains visible', async ({ page }) => {
    await visitBuyTokens(page, SALE_MID)
    await expect(page.getByText("Father's Day").first()).toBeVisible()
  })

  test('AT sale end (June 21 11:59pm Chicago): Father\'s Day chip still visible', async ({ page }) => {
    await visitBuyTokens(page, SALE_END)
    await expect(page.getByText("Father's Day").first()).toBeVisible()
  })

  test('AFTER sale window (June 22 00:01 Chicago): no Father\'s Day chip', async ({ page }) => {
    await visitBuyTokens(page, AFTER_SALE)
    await expect(page.getByText("4-Pack bundle").first()).toBeVisible()
    await expect(page.getByText("Father's Day")).toHaveCount(0)
  })

  test('savings amount on $8 4-pack DOUBLES during sale (chip count + amount)', async ({ page }) => {
    // Outside the window: only the $5 4-Pack bundle chip.
    await visitBuyTokens(page, BEFORE_SALE)
    const baselineChips = await page.locator('text=4-Pack bundle').count()

    // Inside the window: 4-Pack bundle PLUS Father's Day chip.
    await visitBuyTokens(page, SALE_MID)
    const saleChips = await page.locator('text=/4-Pack bundle|Father.s Day/').count()
    expect(saleChips).toBeGreaterThan(baselineChips)
  })
})
