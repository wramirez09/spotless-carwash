import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FlatCompat } from '@eslint/eslintrc'

// ESLint 9 flat config. `eslint-config-next` still ships as an eslintrc-style
// config, so FlatCompat is what bridges it — this is the setup `next lint`
// would have scaffolded, written out explicitly so linting runs from the
// ESLint CLI instead (next lint is removed in Next 16).
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) })

const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      '.sanity-snapshot/**',
      'next-env.d.ts',
      '**/*.tsbuildinfo',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Unused values are a real signal in this codebase — a resolved price or
      // coupon that nothing reads is usually a wiring mistake. Args prefixed
      // with _ stay exempt for deliberate signature padding.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },
  {
    // Tests lean on `any` for mock shapes and on non-null assertions for
    // fixtures that are known-present; neither is worth contorting.
    files: ['**/*.test.ts', '**/*.test.tsx', 'e2e/**', 'test/**', 'scripts/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
]

export default config
