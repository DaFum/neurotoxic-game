import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    silent: 'passed-only',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    },
    // Keep test timeout at the vitest 5s default (fail fast on slow tests)
    testTimeout: 5000,
    // Isolate each test to prevent state pollution
    isolate: true,
    pool: 'threads',
    globals: true, // Need this for jest-dom expect to work
    environment: 'jsdom',
    setupFiles: ['./tests/vitest.setup.js'],
    // JSDOM-only Vitest suites (React/DOM-facing tests).
    include: [
      'tests/ui/**/*.test.jsx',
      'tests/ui/**/*.spec.jsx',
      'tests/integration/**/*.test.jsx',
      'tests/integration/**/*.spec.jsx',
      'tests/hooks/**/*.test.jsx',
      'tests/hooks/**/*.spec.jsx',
      'tests/security/**/*.test.jsx',
      'tests/security/**/*.spec.jsx',
      'tests/utils/**/*.test.jsx',
      'tests/utils/**/*.spec.jsx',
      'tests/logic/AmpStageController.test.js',
      'tests/ui/**/*.test.js',
      'tests/ui/**/*.spec.js',
      'tests/integration/**/*.test.js',
      'tests/integration/**/*.spec.js',
      'tests/ui/bandhq/hooks/**/*.test.jsx',
      'tests/ui/bandhq/hooks/**/*.spec.jsx'
    ]
  }
})
