import { defineConfig } from 'vitest/config'
import { commonTestSettings } from './vitest.config.shared.js'

export default defineConfig({
  test: {
    ...commonTestSettings,
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
      'tests/utils/**/*.spec.js',
      'tests/utils/**/*.test.ts',
      'tests/utils/**/*.spec.ts'
    ],
    // Keep AmpStageController under jsdom (it touches DOM APIs).
    exclude: [
      'tests/logic/AmpStageController.test.js',
      'tests/utils/scenario-seeds.test.js'
    ]
  }
})
