import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from './vitest.config.js'

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: [
        'tests/performance/**/*.test.js',
        'tests/performance/**/*.spec.js',
        'tests/performance/**/*.test.jsx',
        'tests/performance/**/*.spec.jsx'
      ]
    }
  })
)
