import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import baseConfig from './vitest.config.js'

export default defineConfig({
  plugins: baseConfig.plugins,
  test: {
    alias: {
      'virtual:pwa-register/react': fileURLToPath(
        new URL('./tests/mocks/virtual-pwa.js', import.meta.url)
      )
    },
    ...baseConfig.test,
    include: [
      'tests/performance/**/*.test.js',
      'tests/performance/**/*.spec.js',
      'tests/performance/**/*.test.jsx',
      'tests/performance/**/*.spec.jsx'
    ]
  }
})
