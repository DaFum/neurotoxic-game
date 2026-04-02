import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/vitest.setup.js'],
    // Include the refactored .js directories, leaving the rest for node:test
    include: [
      'tests/**/*.test.jsx',
      'tests/**/*.spec.jsx',
      'tests/api/**/*.test.js',
      'tests/api/**/*.spec.js',
      'tests/utils/**/*.test.js',
      'tests/utils/**/*.spec.js',
      'tests/data/**/*.test.js',
      'tests/data/**/*.spec.js',
      'tests/security/**/*.test.js',
      'tests/security/**/*.spec.js',
      'tests/logic/**/*.test.js',
      'tests/logic/**/*.spec.js',
      'tests/social/**/*.test.js',
      'tests/social/**/*.spec.js'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    },
    // Keep test timeout at the vitest 5s default (fail fast on slow tests)
    testTimeout: 5000,
    // Isolate each test to prevent state pollution
    isolate: true
  }
})
