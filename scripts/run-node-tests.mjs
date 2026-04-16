import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
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

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..')

const NODE_TEST_DIRS = [
  'tests/node',
  'tests/components',
  'tests/context',
  'tests/events',
  'tests/golden-path',
  'tests/reducers'
]

const isPathInNodeDirs = testPath => {
  const resolved = path.resolve(testPath)
  const relative = path.relative(REPO_ROOT, resolved).replace(/\\/g, '/')
  return NODE_TEST_DIRS.some(
    dir => relative === dir || relative.startsWith(`${dir}/`)
  )
}

const getRemainingTestFiles = () => {
  const allFiles = []
  const crawl = dir => {
    const absoluteDir = path.resolve(REPO_ROOT, dir)
    if (!fs.existsSync(absoluteDir)) return
    const items = fs.readdirSync(absoluteDir)
    for (const item of items) {
      const fullPath = path.join(absoluteDir, item)
      const normalizedPath = fullPath.replace(/\\/g, '/')
      if (fs.statSync(fullPath).isDirectory()) {
        crawl(path.relative(REPO_ROOT, fullPath))
      } else if (
        normalizedPath.endsWith('.test.js') ||
        normalizedPath.endsWith('.spec.js')
      ) {
        allFiles.push(fullPath)
      }
    }
  }
  for (const dir of NODE_TEST_DIRS) {
    crawl(dir)
  }
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
  arg => !isPathInNodeDirs(arg)
)
if (hasNonNodeSpecificFile) {
  console.error(
    'Node runner only supports node:test directories under tests/. Use the Vitest runner for UI/integration and vitest-owned suites.'
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
