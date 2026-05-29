import { test, expect } from '@playwright/test'

const LOCATIONS = [
  { slug: 'roosevelt-rd', name: 'Roosevelt Rd', street: /Roosevelt Road/i },
  { slug: 'madison-st', name: 'Madison St', street: /Madison Street/i },
] as const

for (const { slug, name, street } of LOCATIONS) {
  test.describe(`Location: ${slug}`, () => {
    test('renders heading and street', async ({ page }) => {
      const response = await page.goto(`/locations/${slug}`)
      expect(response?.ok()).toBeTruthy()

      await expect(page.getByRole('heading', { level: 1 })).toContainText(new RegExp(`spotless\\s*carwash.*${name}`, 'i'))
      await expect(page.locator('header').getByText(street).first()).toBeVisible()
    })

    test('logo link returns home', async ({ page }) => {
      await page.goto(`/locations/${slug}`)
      await page.locator('nav a[href="/"]').first().click()
      await expect(page).toHaveURL(/\/$/)
    })
  })
}
