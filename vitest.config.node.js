import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    silent: 'passed-only',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    },
    testTimeout: 5000,
    isolate: true,
    pool: 'threads',
    environment: 'node',
    include: [
      'tests/api/**/*.test.js',
      'tests/api/**/*.spec.js',
      'tests/data/**/*.test.js',
      'tests/data/**/*.spec.js',
      'tests/hooks/**/*.test.js',
      'tests/hooks/**/*.spec.js',
      'tests/logic/**/*.test.js',
      'tests/logic/**/*.spec.js',
      'tests/security/**/*.test.js',
      'tests/security/**/*.spec.js',
      'tests/social/**/*.test.js',
      'tests/social/**/*.spec.js',
      'tests/utils/**/*.test.js',
      'tests/utils/**/*.spec.js'
    ],
    // Keep AmpStageController under jsdom (it touches DOM APIs).
    exclude: ['tests/logic/AmpStageController.test.js']
  }
})
