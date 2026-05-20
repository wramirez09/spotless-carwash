import { test, expect } from '@playwright/test'

test.describe('FAQ page', () => {
  test('renders heading and at least one question', async ({ page }) => {
    const response = await page.goto('/faq')
    expect(response?.ok()).toBeTruthy()

    await expect(page).toHaveTitle(/faq/i)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    // Fallback FAQ entries always render at least one <dt> or <h2>/<h3>; assert any heading > h1 exists.
    const subHeadings = page.getByRole('heading').filter({ hasNotText: /^\s*$/ })
    expect(await subHeadings.count()).toBeGreaterThan(1)
  })
})
