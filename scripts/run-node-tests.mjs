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

const NODE_TEST_DIR = 'tests/node'

const isPathInNodeDir = testPath => {
  const resolved = path.resolve(testPath)
  const relative = path.relative(process.cwd(), resolved).replace(/\\/g, '/')
  return (
    relative === NODE_TEST_DIR || relative.startsWith(`${NODE_TEST_DIR}/`)
  )
}

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
        allFiles.push(fullPath)
      }
    }
  }
  crawl(NODE_TEST_DIR)
  return allFiles
}

// Detect specific test file arguments by filtering out options and their values
const filteredArgs = []
for (let i = 0; i < nodeTestArgs.length; i++) {
  const arg = nodeTestArgs[i]
  // If the argument is an option that expects a path (e.g. --import, -r, --require),
  // skip it and the following value.
  if (arg === '--import' || arg === '-r' || arg === '--require') {
    i++ // Skip the value
  } else if (!arg.startsWith('-')) {
    filteredArgs.push(arg)
  }
}

// Detect specific test file arguments (positional, non-flag JS test files)
const specificTestFileArgs = filteredArgs.filter(
  arg => arg.endsWith('.js') || arg.endsWith('.mjs') || arg.endsWith('.cjs')
)

// Prevent running tests outside tests/node/** with node:test
const hasNonNodeSpecificFile = specificTestFileArgs.some(
  arg => !isPathInNodeDir(arg)
)
if (hasNonNodeSpecificFile) {
  console.error(
    'Node runner only supports tests under tests/node/**. Use the Vitest runner for tests/ui/** and tests/integration/**.'
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
