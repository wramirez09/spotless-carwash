import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('renders hero and key sections', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.ok()).toBeTruthy()

    await expect(page).toHaveTitle(/spotless/i)

    await expect(page.getByRole('heading', { level: 1 })).toContainText(/spotless/i)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/carwash/i)

    for (const id of ['washes', 'bays', 'locations', 'tokens']) {
      await expect(page.locator(`section#${id}`)).toBeVisible()
    }
  })

  test('hero primary CTA scrolls to washes section', async ({ page }) => {
    await page.goto('/')
    await page.locator('header a[href="#washes"]').first().click()
    await expect(page).toHaveURL(/#washes$/)
  })
})

test.describe('Wash card → checkout', () => {
  // Each wash card goes straight to /buy-tokens with that wash's 4-pack
  // already in the order. Reads the card's own link rather than assuming
  // the lineup, so it holds whatever the wash packages are.
  test('a wash card opens checkout with its pack in the order', async ({ page }) => {
    await page.goto('/')
    const cta = page.locator('#washes article a[href^="/buy-tokens?wash="]').first()
    const href = (await cta.getAttribute('href')) ?? ''
    const wash = href.split('wash=')[1]

    await cta.click()
    await expect(page).toHaveURL(new RegExp('/buy-tokens\\?wash=' + wash + '$'))

    const radio = page.locator('input[name="package"][value="spotless_pack_' + wash + '"]')
    await expect(radio).toBeChecked()
    await expect(page.getByText('Added to your order')).toBeVisible()
    // The order summary (the sale banner at the top is an <aside> too).
    const summary = page.locator('aside').filter({ hasText: 'Pay with Stripe' })
    await expect(summary).toContainText('$' + wash + ' wash · 4-pack')
  })

  test('every wash card links into checkout', async ({ page }) => {
    await page.goto('/')
    const hrefs = await page
      .locator('#washes article a')
      .evaluateAll((els) => els.map((e) => e.getAttribute('href')))
    expect(hrefs.length).toBeGreaterThan(0)
    for (const h of hrefs) expect(h).toMatch(/^\/buy-tokens\?wash=\d+$/)
  })
})
