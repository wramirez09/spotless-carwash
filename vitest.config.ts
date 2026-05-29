import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: false,
    // Exclude Playwright e2e specs — those run under the separate `yarn test:e2e`.
    include: ['lib/**/*.test.ts', 'app/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'e2e'],
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
