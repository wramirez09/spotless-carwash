import { test, expect, type Page } from '@playwright/test'

// The Wash Token Subscription page at /buy-tokens/subscribe.
//
// Plan prices come from the client proposal (Section 3.1) and are asserted
// here as customer-facing figures — the same guard the pack prices get in
// seasonalSale.spec.ts. If Stripe is unreachable the page falls back to these
// exact numbers, so the assertions hold with or without a configured account.
//
// Everything stops at the Stripe redirect; no test ever leaves the site.

// Prices at the default $12 (Lustre) token — the proposal's headline figures.
const PLANS = [
  { name: 'Weekly', monthly: '$40', tokens: 4 },
  { name: 'Frequent', monthly: '$76', tokens: 8 },
  { name: 'Family / Fleet', monthly: '$108', tokens: 12 },
]

// Same plans priced at the $8 (Quick) token.
const PLANS_AT_8 = [
  { name: 'Weekly', monthly: '$24' },
  { name: 'Frequent', monthly: '$44' },
  { name: 'Family / Fleet', monthly: '$60' },
]

function planCard(page: Page, name: string) {
  return page.getByRole('radiogroup', { name: 'Pick your plan.' })
    .getByRole('radio')
    .filter({ hasText: name })
}

function tokenButton(page: Page, dollars: string) {
  return page.getByRole('radiogroup', { name: 'Which wash?' })
    .getByRole('radio')
    .filter({ hasText: new RegExp(`^\\$${dollars}`) })
}

/** Fill every required field so the form reaches its own validation. */
async function fillDetails(page: Page, { phone = '(708) 555-0100' } = {}) {
  await page.getByRole('textbox', { name: /^Email/ }).fill('pat@example.com')
  await page.getByLabel(/Full name/).fill('Pat Driver')
  await page.getByLabel(/Phone/).fill(phone)
  await page.getByLabel(/Street address/).fill('7802 Madison St')
  await page.getByLabel(/City/).fill('Forest Park')
  await page.getByLabel(/State/).fill('IL')
  await page.getByLabel(/ZIP code/).fill('60130')
}

async function visitSubscribe(page: Page) {
  const response = await page.goto('/buy-tokens/subscribe')
  expect(response?.ok()).toBeTruthy()
  await expect(page.getByRole('radiogroup', { name: 'Pick your plan.' })).toBeVisible()
}

test.describe('subscription page', () => {
  test('renders all three plans at the proposal prices', async ({ page }) => {
    await visitSubscribe(page)
    for (const plan of PLANS) {
      const card = planCard(page, plan.name)
      await expect(card).toBeVisible()
      await expect(card).toContainText(plan.monthly)
      await expect(card).toContainText(`${plan.tokens} tokens a month`)
    }
  })

  test('defaults to the featured Frequent plan', async ({ page }) => {
    await visitSubscribe(page)
    const frequent = planCard(page, 'Frequent')
    await expect(frequent).toHaveAttribute('aria-checked', 'true')
    await expect(frequent).toContainText('Most Popular')
  })

  test('selecting a plan updates the summary total', async ({ page }) => {
    await visitSubscribe(page)
    const summary = page.getByRole('complementary')

    await expect(summary).toContainText('$76')

    await planCard(page, 'Family / Fleet').click()

    await expect(summary).toContainText('$108')
    await expect(summary).toContainText('12 tokens a month')
  })

  test('blocks submission until the required details are filled in', async ({ page }) => {
    await visitSubscribe(page)

    await page.getByRole('button', { name: 'Start subscription' }).click()

    // Native required-field validation keeps us on the page; nothing navigates
    // to Stripe.
    await expect(page).toHaveURL(/\/buy-tokens\/subscribe$/)
    await expect(page.getByRole('radiogroup', { name: 'Pick your plan.' })).toBeVisible()
  })

  test('rejects a malformed phone number before contacting Stripe', async ({ page }) => {
    await visitSubscribe(page)

    await fillDetails(page, { phone: '123' })
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
  test('defaults to the $12 Lustre token', async ({ page }) => {
    await visitSubscribe(page)
    await expect(tokenButton(page, '12')).toHaveAttribute('aria-checked', 'true')
  })

  test('choosing a cheaper token re-prices every plan', async ({ page }) => {
    await visitSubscribe(page)

    await tokenButton(page, '8').click()

    for (const plan of PLANS_AT_8) {
      await expect(planCard(page, plan.name)).toContainText(plan.monthly)
    }
    // Token count is unchanged — only the price moves.
    await expect(planCard(page, 'Weekly')).toContainText('4 tokens a month')
  })

  test('the summary follows the chosen token', async ({ page }) => {
    await visitSubscribe(page)
    const summary = page.getByRole('complementary')

    await expect(summary).toContainText('$76')

    await tokenButton(page, '10').click()
    await expect(summary).toContainText('$60')
    await expect(summary).toContainText('8 × $10')
  })
  test('collects the mailing address on our own form', async ({ page }) => {
    await visitSubscribe(page)

    // Tokens ship by USPS, so the address is captured before the customer
    // leaves the site rather than on Stripe's hosted page.
    await expect(page.getByLabel(/Street address/)).toBeVisible()
    await expect(page.getByLabel(/City/)).toBeVisible()
    await expect(page.getByLabel(/State/)).toBeVisible()
    await expect(page.getByLabel(/ZIP code/)).toBeVisible()
  })

  test('will not submit without a mailing address', async ({ page }) => {
    await visitSubscribe(page)

    await page.getByRole('textbox', { name: /^Email/ }).fill('pat@example.com')
    await page.getByLabel(/Full name/).fill('Pat Driver')
    await page.getByRole('button', { name: 'Start subscription' }).click()

    // Required-field validation keeps us here; nothing goes to Stripe.
    await expect(page).toHaveURL(/\/buy-tokens\/subscribe$/)
  })

  test('uppercases the state as it is typed', async ({ page }) => {
    await visitSubscribe(page)
    const state = page.getByLabel(/State/)
    await state.fill('il')
    await expect(state).toHaveValue('IL')
  })
})
