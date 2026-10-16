import { defineConfig } from 'vitest/config'
import { testAliases } from './vitest.config.shared.js'

export default defineConfig({
  test: {
    alias: testAliases,
    environment: 'node',
    include: ['tests/utils/scenario-seeds.test.js']
  }
})
