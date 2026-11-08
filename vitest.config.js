import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const testAliases = {
  'virtual:pwa-register/react': fileURLToPath(
    new URL('./tests/mocks/virtual-pwa.js', import.meta.url)
  )
}

/** @type {import('vitest/config').TestProjectInlineConfiguration['test']} */
const commonTestSettings = {
  alias: testAliases,
  // Keep the Vitest 5s default and isolate suites to prevent state pollution.
  testTimeout: 5000,
  isolate: true,
  pool: 'threads'
}

/** @type {import('vitest/config').TestProjectInlineConfiguration['test']} */
const jsdomTestSettings = {
  ...commonTestSettings,
  globals: true, // Need this for jest-dom expect to work
  environment: 'jsdom',
  setupFiles: ['./tests/vitest.setup.js']
}

// One config, four projects. Every script selects its project with
// `--project <name>`; a bare file filter runs the file in whichever project
// includes it. The include globs are disjoint, so no file runs twice.
export default defineConfig({
  test: {
    // Root-only options (Vitest rejects them inside projects).
    silent: 'passed-only',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    },
    projects: [
      {
        // JSDOM-only Vitest suites (React/DOM-facing tests).
        plugins: [react()],
        test: {
          ...jsdomTestSettings,
          name: 'ui',
          include: [
            'tests/ui/**/*.test.jsx',
            'tests/ui/**/*.spec.jsx',
            'tests/ui/**/*.test.tsx',
            'tests/ui/**/*.spec.tsx',
            'tests/integration/**/*.test.jsx',
            'tests/integration/**/*.spec.jsx',
            'tests/hooks/**/*.test.jsx',
            'tests/hooks/**/*.test.tsx',
            'tests/hooks/**/*.spec.jsx',
            'tests/hooks/**/*.spec.tsx',
            'tests/security/**/*.test.jsx',
            'tests/security/**/*.spec.jsx',
            'tests/utils/**/*.test.jsx',
            'tests/utils/**/*.spec.jsx',
            'tests/logic/AmpStageController.test.js',
            'tests/ui/**/*.test.js',
            'tests/ui/**/*.spec.js',
            'tests/integration/**/*.test.js',
            'tests/integration/**/*.spec.js',
            'tests/context/**/*.test.tsx',
            'tests/context/**/*.spec.tsx'
          ]
        }
      },
      {
        // Node-environment logic/API/data/utils suites (no DOM setup).
        test: {
          ...commonTestSettings,
          name: 'node',
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
      },
      {
        // Performance suites; only `pnpm run test:perf` selects them.
        plugins: [react()],
        test: {
          ...jsdomTestSettings,
          name: 'perf',
          include: [
            'tests/performance/**/*.test.js',
            'tests/performance/**/*.spec.js',
            'tests/performance/**/*.test.jsx',
            'tests/performance/**/*.spec.jsx'
          ]
        }
      },
      {
        // Repository-tooling suites; only `pnpm run test:tooling` selects them.
        test: {
          name: 'tooling',
          alias: testAliases,
          environment: 'node',
          include: ['tests/utils/scenario-seeds.test.js']
        }
      }
    ]
  }
})
