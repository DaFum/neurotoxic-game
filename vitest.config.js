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
    // Optimize worker pool: use all available parallelism for UI tests
    workers: {
      isolate: true,
      singleThread: false
    },
    // Reduce test timeout from default 10s to 5s (fail fast on slow tests)
    testTimeout: 5000,
    // Isolate each test to prevent state pollution
    isolation: true
  }
})
