import { fileURLToPath } from 'node:url'

export const testAliases = {
  'virtual:pwa-register/react': fileURLToPath(
    new URL('./tests/mocks/virtual-pwa.js', import.meta.url)
  )
}

/** @type {import('vitest/config').UserConfig['test']} */
export const commonTestSettings = {
  alias: testAliases,
  silent: 'passed-only',
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html']
  },
  // Keep the Vitest 5s default and isolate suites to prevent state pollution.
  testTimeout: 5000,
  isolate: true,
  pool: 'threads'
}
