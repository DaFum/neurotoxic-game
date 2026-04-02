import { spawnSync } from 'node:child_process'
import { computeWorkerCount } from './utils/parallelism.mjs'

const rawArgs = process.argv.slice(2)
const nodeTestArgs = rawArgs[0] === '--' ? rawArgs.slice(1) : rawArgs

const hasExplicitConcurrency = nodeTestArgs.some(arg =>
  arg.startsWith('--test-concurrency')
)

const testConcurrency = computeWorkerCount('NODE_TEST_CONCURRENCY')

const commandArgs = [
  '--test',
  '--import',
  'tsx',
  '--experimental-test-module-mocks',
  '--import',
  './tests/setup.mjs',
  ...(hasExplicitConcurrency ? [] : [`--test-concurrency=${testConcurrency}`])
]

import fs from 'node:fs'
import path from 'node:path'

// Exclude directories that have been migrated to vitest
const getRemainingTestFiles = () => {
  const allFiles = []
  const crawl = dir => {
    const items = fs.readdirSync(dir)
    for (const item of items) {
      const fullPath = path.join(dir, item)
      const normalizedPath = fullPath.replace(/\\/g, '/')
      if (fs.statSync(fullPath).isDirectory()) {
        crawl(fullPath)
      } else if (
        normalizedPath.endsWith('.test.js') ||
        normalizedPath.endsWith('.spec.js')
      ) {
        if (
          !normalizedPath.startsWith('tests/api/') &&
          !normalizedPath.startsWith('tests/utils/') &&
          !normalizedPath.startsWith('tests/data/') &&
          !normalizedPath.startsWith('tests/security/') &&
          !normalizedPath.startsWith('tests/logic/') &&
          !normalizedPath.startsWith('tests/social/')
        ) {
          allFiles.push(fullPath)
        }
      }
    }
  }
  crawl('tests')
  return allFiles
}

const EXCLUDED_TEST_DIRS = ['tests/api', 'tests/utils', 'tests/data', 'tests/security', 'tests/logic', 'tests/social']
const isPathInExcludedDir = testPath => {
  const resolved = path.resolve(testPath)
  const relative = path.relative(process.cwd(), resolved).replace(/\\/g, '/')
  return EXCLUDED_TEST_DIRS.some(
    dir => relative === dir || relative.startsWith(`${dir}/`)
  )
}

// Detect specific test file arguments (positional, non-flag JS test files)
const specificTestFileArgs = nodeTestArgs.filter(
  arg =>
    !arg.startsWith('--') &&
    (arg.endsWith('.js') || arg.endsWith('.mjs') || arg.endsWith('.cjs'))
)

// Prevent running Vitest-migrated tests with node:test
const hasExcludedSpecificFile = specificTestFileArgs.some(isPathInExcludedDir)
if (hasExcludedSpecificFile) {
  console.error(
    'Tests under the migrated directories are run with Vitest. Use the Vitest runner instead of node:test for these files.'
  )
  process.exit(1)
}

const isSpecificFile = specificTestFileArgs.length > 0

const finalArgs = isSpecificFile
  ? [...commandArgs, ...nodeTestArgs]
  : [...commandArgs, ...getRemainingTestFiles(), ...nodeTestArgs]

const result = spawnSync('node', finalArgs, {
  stdio: 'inherit',
  env: process.env
})

if (typeof result.status === 'number') {
  process.exit(result.status)
}

if (result.error) {
  throw result.error
}

process.exit(1)
