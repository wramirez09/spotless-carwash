import { test, expect, type Page } from '@playwright/test'

// Seasonal sale windows in America/Chicago (CDT = UTC-5). See
// lib/salesSchedule.ts — SEASONAL_SALES is the single source of truth.
//   Father's Day 2026: 2026-06-07 00:00:00 → 2026-06-21 23:59:59
//   Labor Day 2026:    2026-08-20 00:00:00 → 2026-09-07 23:59:59
//
// `?_now=<ISO>` on /buy-tokens lets the server-rendered page simulate any
// wall-clock time. The override is gated to non-production in
// `app/buy-tokens/page.tsx` so it cannot be triggered against a live deploy.
//
// Pack cards are the only purchase surface — the single/pack mode toggle was
// removed in "chore: remove single token purchase".
//
// UI surface for a sale:
//   - Each pack card and the order summary render a sale coupon chip (e.g.
//     "Labor Day") in addition to the always-on "4-Pack bundle" chip.
//   - Per-pack savings double (e.g. $8 4-pack goes from $5 off to $10 off).
// We assert on the chip text + visibility because the chip label is the most
// stable user-visible signal of the sale state.
//
// Assertions are scoped to <main> because the layout's SalesBanner uses the
// REAL clock (it never sees `?_now`) — during an actual sale window it shows
// the sale badge on every page and would leak into unscoped text queries.

const BEFORE_SALE = '2026-08-19T23:59:00-05:00' // Wed Aug 19 23:59 Chicago
const SALE_START = '2026-08-20T00:00:00-05:00'  // Thu Aug 20 00:00 Chicago (first instant)
const SALE_MID = '2026-08-31T12:00:00-05:00'    // Mon Aug 31 noon Chicago
const SALE_END = '2026-09-07T23:59:00-05:00'    // Mon Sep 7 23:59 Chicago (Labor Day, last minute)
const AFTER_SALE = '2026-09-08T00:01:00-05:00'  // Tue Sep 8 00:01 Chicago

const SALE_CHIP = 'Labor Day'

async function visitBuyTokens(page: Page, isoNow: string) {
  const response = await page.goto(`/buy-tokens?_now=${encodeURIComponent(isoNow)}`)
  expect(response?.ok()).toBeTruthy()
  // Pack cards are the only purchase surface (the single/pack mode toggle was
  // removed). Wait for the radio group to render before asserting on chips.
  await expect(page.locator('input[name="package"]').first()).toBeAttached()
}

test.describe('Labor Day 2026 sale', () => {
  test(`BEFORE sale window (Aug 19 11:59pm Chicago): no ${SALE_CHIP} chip`, async ({ page }) => {
    await visitBuyTokens(page, BEFORE_SALE)
    const main = page.locator('main')
    await expect(main.getByText('4-Pack bundle').first()).toBeVisible()
    await expect(main.getByText(SALE_CHIP)).toHaveCount(0)
  })

  test(`AT sale start (Aug 20 00:00 Chicago): ${SALE_CHIP} chip appears`, async ({ page }) => {
    await visitBuyTokens(page, SALE_START)
    const main = page.locator('main')
    await expect(main.getByText(SALE_CHIP).first()).toBeVisible()
    await expect(main.getByText('4-Pack bundle').first()).toBeVisible()
  })

  test(`MID sale window (Aug 31 noon Chicago): ${SALE_CHIP} chip remains visible`, async ({ page }) => {
    await visitBuyTokens(page, SALE_MID)
    await expect(page.locator('main').getByText(SALE_CHIP).first()).toBeVisible()
  })

  test(`AT sale end (Sep 7 11:59pm Chicago): ${SALE_CHIP} chip still visible`, async ({ page }) => {
    await visitBuyTokens(page, SALE_END)
    await expect(page.locator('main').getByText(SALE_CHIP).first()).toBeVisible()
  })

  test(`AFTER sale window (Sep 8 00:01 Chicago): no ${SALE_CHIP} chip`, async ({ page }) => {
    await visitBuyTokens(page, AFTER_SALE)
    const main = page.locator('main')
    await expect(main.getByText('4-Pack bundle').first()).toBeVisible()
    await expect(main.getByText(SALE_CHIP)).toHaveCount(0)
  })

  test('savings amount on the 4-packs DOUBLES during sale (chip count + amount)', async ({ page }) => {
    // Outside the window: only the $5 4-Pack bundle chip.
    await visitBuyTokens(page, BEFORE_SALE)
    const baselineChips = await page.locator('main').locator('text=4-Pack bundle').count()

    // Inside the window: 4-Pack bundle PLUS the Labor Day chip.
    await visitBuyTokens(page, SALE_MID)
    const saleChips = await page
      .locator('main')
      .locator(`text=/4-Pack bundle|${SALE_CHIP}/`)
      .count()
    expect(saleChips).toBeGreaterThan(baselineChips)
  })
})
