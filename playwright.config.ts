import { defineConfig, devices } from '@playwright/test'

// Dedicated port so e2e never reuses another app squatting on the default 3000.
const PORT = 3209
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: `yarn dev --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // These specs assert the real site. Force the maintenance gate off so a
    // local UNDER_CONSTRUCTION=true in .env.local doesn't reroute every page
    // to /under-construction and fail the suite. A real env var wins over .env*.
    env: { UNDER_CONSTRUCTION: 'false' },
  },
})
