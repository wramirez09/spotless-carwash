import { test, expect, type Page } from '@playwright/test'

// The Wash Token Subscription page at /buy-tokens/subscribe.
//
// Plan prices come from the client proposal (Section 3.1) and are asserted
// here as customer-facing figures — the same guard the pack prices get in
// seasonalSale.spec.ts. If Stripe is unreachable the page falls back to these
// exact numbers, so the assertions hold with or without a configured account.
//
// Everything stops at the Stripe redirect; no test ever leaves the site.

const PLANS = [
  { name: 'Weekly', monthly: '$40', tokens: 4 },
  { name: 'Frequent', monthly: '$76', tokens: 8 },
  { name: 'Family / Fleet', monthly: '$108', tokens: 12 },
]

async function visitSubscribe(page: Page) {
  const response = await page.goto('/buy-tokens/subscribe')
  expect(response?.ok()).toBeTruthy()
  await expect(page.getByRole('radiogroup')).toBeVisible()
}

test.describe('subscription page', () => {
  test('renders all three plans at the proposal prices', async ({ page }) => {
    await visitSubscribe(page)
    const group = page.getByRole('radiogroup')

    for (const plan of PLANS) {
      const card = group.getByRole('radio').filter({ hasText: plan.name })
      await expect(card).toBeVisible()
      await expect(card).toContainText(plan.monthly)
      await expect(card).toContainText(`${plan.tokens} tokens a month`)
    }
  })

  test('defaults to the featured Frequent plan', async ({ page }) => {
    await visitSubscribe(page)
    const frequent = page
      .getByRole('radiogroup')
      .getByRole('radio')
      .filter({ hasText: 'Frequent' })
    await expect(frequent).toHaveAttribute('aria-checked', 'true')
    await expect(frequent).toContainText('Most Popular')
  })

  test('selecting a plan updates the summary total', async ({ page }) => {
    await visitSubscribe(page)
    const summary = page.getByRole('complementary')

    await expect(summary).toContainText('$76')

    await page
      .getByRole('radiogroup')
      .getByRole('radio')
      .filter({ hasText: 'Family / Fleet' })
      .click()

    await expect(summary).toContainText('$108')
    await expect(summary).toContainText('12 tokens a month')
  })

  test('blocks submission until the required details are filled in', async ({ page }) => {
    await visitSubscribe(page)

    await page.getByRole('button', { name: 'Start subscription' }).click()

    // Native required-field validation keeps us on the page; nothing navigates
    // to Stripe.
    await expect(page).toHaveURL(/\/buy-tokens\/subscribe$/)
    await expect(page.getByRole('radiogroup')).toBeVisible()
  })

  test('rejects a malformed phone number before contacting Stripe', async ({ page }) => {
    await visitSubscribe(page)

    await page.getByLabel(/Email/).first().fill('pat@example.com')
    await page.getByLabel(/Full name/).fill('Pat Driver')
    await page.getByLabel(/Phone/).fill('123')
    await page.getByRole('button', { name: 'Start subscription' }).click()

    // Scoped to the summary panel: Next renders its own role="alert" route
    // announcer on every page, so an unscoped alert lookup is ambiguous.
    await expect(page.getByRole('complementary').getByRole('alert')).toContainText(
      'valid US phone number',
    )
    await expect(page).toHaveURL(/\/buy-tokens\/subscribe$/)
  })

  test('formats the phone number as it is typed', async ({ page }) => {
    await visitSubscribe(page)
    const phone = page.getByLabel(/Phone/)
    await phone.fill('7085550100')
    await expect(phone).toHaveValue('(708) 555-0100')
  })

  test('is reachable from the buy-tokens page', async ({ page }) => {
    await page.goto('/buy-tokens')
    await page.getByRole('link', { name: /Subscribe and we'll mail your tokens/ }).click()
    await expect(page).toHaveURL(/\/buy-tokens\/subscribe$/)
  })
})
