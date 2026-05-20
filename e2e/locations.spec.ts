import { test, expect } from '@playwright/test'

const LOCATIONS = [
  { slug: 'roosevelt-rd', street: /Roosevelt Road/i },
  { slug: 'madison-st', street: /Madison Street/i },
] as const

for (const { slug, street } of LOCATIONS) {
  test.describe(`Location: ${slug}`, () => {
    test('renders heading and street', async ({ page }) => {
      const response = await page.goto(`/locations/${slug}`)
      expect(response?.ok()).toBeTruthy()

      await expect(page.getByRole('heading', { level: 1 })).toContainText(/spotless carwash/i)
      await expect(page.locator('header').getByText(street).first()).toBeVisible()
    })

    test('logo link returns home', async ({ page }) => {
      await page.goto(`/locations/${slug}`)
      await page.locator('a.logo-mark').first().click()
      await expect(page).toHaveURL(/\/$/)
    })
  })
}
