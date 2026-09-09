import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    alias: {
      'virtual:pwa-register/react': fileURLToPath(
        new URL('./tests/mocks/virtual-pwa.js', import.meta.url)
      )
    },
    environment: 'node',
    include: ['tests/utils/scenario-seeds.test.js']
  }
})
