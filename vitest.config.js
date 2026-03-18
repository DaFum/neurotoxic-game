import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/vitest.setup.js'],
    // ONLY include .jsx files for now, as .js files remain with node:test
    include: ['tests/**/*.test.jsx', 'tests/**/*.spec.jsx'],
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
