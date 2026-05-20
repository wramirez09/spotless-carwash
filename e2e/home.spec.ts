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
