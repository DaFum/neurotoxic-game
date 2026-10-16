import { defineConfig } from 'vitest/config'
import baseConfig from './vitest.config.js'

export default defineConfig({
  plugins: baseConfig.plugins,
  test: {
    ...baseConfig.test,
    include: [
      'tests/performance/**/*.test.js',
      'tests/performance/**/*.spec.js',
      'tests/performance/**/*.test.jsx',
      'tests/performance/**/*.spec.jsx'
    ]
  }
})
