import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('desktop: section link scrolls to anchor', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop nav only')
    await page.goto('/')
    await page.locator('nav a[href="/#washes"]').first().click()
    await expect(page).toHaveURL(/#washes$/)
  })

  test('desktop: page link routes to FAQ', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop nav only')
    await page.goto('/')
    await page.locator('nav a[href="/faq"]').first().click()
    await expect(page).toHaveURL(/\/faq$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('desktop: page link routes to a location', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop nav only')
    await page.goto('/')
    await page.locator('nav a[href="/locations/roosevelt-rd"]').first().click()
    await expect(page).toHaveURL(/\/locations\/roosevelt-rd$/)
  })

  test('mobile: open menu and navigate to FAQ', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile nav only')
    await page.goto('/')
    await page.getByRole('button', { name: /open menu/i }).click()
    const mobileMenu = page.locator('#mobile-menu')
    await expect(mobileMenu).toBeVisible()
    await mobileMenu.locator('a[href="/faq"]').first().click()
    await expect(page).toHaveURL(/\/faq$/)
  })
})
