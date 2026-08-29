import { test, expect, type Page } from '@playwright/test'

// The wash-club feature block on the home page, its nav/footer links, and the
// sticky-nav ribbon that collapses on scroll.

const RIBBON = /Forest Park's car wash for 30 years/i

// Measure the collapsing wrapper: the yellow bar inside keeps its own height
// while clipped, so its bounding box never reaches zero.
function ribbon(page: Page) {
  return page.locator('nav [data-ribbon]')
}

test.describe('home subscription section', () => {
  test('renders the wash club block with all three plans', async ({ page }) => {
    await page.goto('/')
    const section = page.locator('#subscription')
    await expect(section).toBeVisible()

    // Plan names and prices come from lib/subscriptionPricing at the default
    // $12 token — the same figures the proposal quotes.
    for (const [name, price] of [
      ['Weekly', '$40'],
      ['Frequent', '$76'],
      ['Family / Fleet', '$108'],
    ]) {
      const row = section.getByRole('listitem').filter({ hasText: name })
      await expect(row).toContainText(price)
    }
  })

  test('its CTA goes to the subscribe page', async ({ page }) => {
    await page.goto('/')
    const cta = page
      .locator('#subscription')
      .getByRole('link', { name: /see the plans/i })
    await expect(cta).toBeVisible()
    // A click landing in the Next.js hydration window gets its default
    // navigation cancelled while the client router isn't ready, dropping the
    // navigation. Retry until one lands — same pattern as locations.spec.ts.
    await expect(async () => {
      await cta.click()
      await expect(page).toHaveURL(/\/buy-tokens\/subscribe$/, { timeout: 1000 })
    }).toPass({ timeout: 10000 })
  })
})

test.describe('subscription links', () => {
  test('the nav links to the subscribe page', async ({ page }) => {
    await page.goto('/')
    // Desktop nav; the mobile menu renders its own copy of the same links.
    const link = page
      .locator('nav')
      .getByRole('link', { name: 'Subscribe', exact: true })
      .first()
    await expect(link).toHaveAttribute('href', '/buy-tokens/subscribe')
  })

  test('the footer links to the subscribe page', async ({ page }) => {
    await page.goto('/')
    const link = page
      .locator('footer')
      .getByRole('link', { name: /token subscription/i })
    await expect(link).toHaveAttribute('href', '/buy-tokens/subscribe')
  })
})

test.describe('sticky nav ribbon', () => {
  test('is visible at the top of the page', async ({ page }) => {
    await page.goto('/')
    await expect(ribbon(page)).toBeVisible()
    expect((await ribbon(page).boundingBox())?.height ?? 0).toBeGreaterThan(10)
  })

  test('collapses once the page is scrolled', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.scrollTo(0, 600))

    // Height + opacity animate to zero rather than the node being removed, so
    // assert on the measured height, not visibility.
    await expect
      .poll(async () => (await ribbon(page).boundingBox())?.height ?? 0)
      .toBeLessThan(2)
    await expect(ribbon(page)).toHaveAttribute('aria-hidden', 'true')
  })

  test('comes back when scrolled to the top again', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.scrollTo(0, 600))
    await expect.poll(async () => (await ribbon(page).boundingBox())?.height ?? 0)
      .toBeLessThan(2)

    await page.evaluate(() => window.scrollTo(0, 0))
    await expect.poll(async () => (await ribbon(page).boundingBox())?.height ?? 0)
      .toBeGreaterThan(10)
    await expect(ribbon(page)).toHaveAttribute('aria-hidden', 'false')
  })

  test('does not cover the nav itself — the nav stays visible when scrolled', async ({
    page,
  }) => {
    await page.goto('/')
    await page.evaluate(() => window.scrollTo(0, 600))
    await expect(page.locator('nav').first()).toBeVisible()
  })
})
