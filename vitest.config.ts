import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: false,
    // Exclude Playwright e2e specs — those run under the separate `yarn test:e2e`.
    include: ['lib/**/*.test.{ts,tsx}', 'app/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'e2e'],
    coverage: {
      provider: 'v8',
      // Scoped to lib/: that is where the business logic lives — pricing,
      // sales, auth gating, fulfillment, email. The React page components
      // under app/ and src/ are covered by the Playwright e2e suite instead,
      // where rendering is actually exercised against a real browser.
      include: ['lib/**'],
      exclude: ['lib/**/*.test.{ts,tsx}'],
      reporter: ['text-summary', 'json-summary'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 85,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      // `server-only` is a Next.js marker that throws if imported in the browser
      // bundle. Tests run in jsdom but we want the imports to be no-ops.
      'server-only': path.resolve(__dirname, 'test/stubs/server-only.ts'),
    },
  },
})
