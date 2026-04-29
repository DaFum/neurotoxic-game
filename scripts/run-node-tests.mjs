import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { computeWorkerCount } from './utils/parallelism.mjs'

const rawArgs = process.argv.slice(2)
const normalizedArgs = rawArgs[0] === '--' ? rawArgs.slice(1) : rawArgs

const hasFlag = flag => normalizedArgs.includes(flag)

const flagSkipHeavy = hasFlag('--skip-heavy')
const flagOnlyHeavy = hasFlag('--only-heavy')
const nodeTestArgs = normalizedArgs.filter(
  arg => arg !== '--skip-heavy' && arg !== '--only-heavy'
)

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

const HEAVY_NODE_TESTS = [
  'tests/node/CrowdManager.test.js',
  'tests/node/LaneManager.test.js',
  'tests/node/NoteManager.test.js',
  'tests/node/useGigEffects.test.js',
  'tests/node/useGigInput.test.js',
  'tests/node/usePurchaseLogic.test.js'
]

const heavyTestSet = new Set(
  HEAVY_NODE_TESTS.map(testFile =>
    path.resolve(REPO_ROOT, testFile).replace(/\\/g, '/')
  )
)

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

const normalizeTestPath = testFile => path.resolve(testFile).replace(/\\/g, '/')

const shouldOnlyHeavy =
  process.env.NODE_TEST_ONLY_HEAVY === '1' || flagOnlyHeavy
const shouldSkipHeavy =
  process.env.NODE_TEST_SKIP_HEAVY === '1' || flagSkipHeavy

if (shouldOnlyHeavy && shouldSkipHeavy) {
  console.error(
    'Invalid node-test heavy mode: --only-heavy and --skip-heavy cannot be used together.'
  )
  process.exit(1)
}

const filterByHeavyMode = testFiles => {
  if (shouldOnlyHeavy) {
    return testFiles.filter(testFile =>
      heavyTestSet.has(normalizeTestPath(testFile))
    )
  }
  if (shouldSkipHeavy) {
    return testFiles.filter(
      testFile => !heavyTestSet.has(normalizeTestPath(testFile))
    )
  }
  return testFiles
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

if (!isSpecificFile && shouldOnlyHeavy) {
  const heavyOnlyFiles = filterByHeavyMode(getRemainingTestFiles())
  if (heavyOnlyFiles.length === 0) {
    console.error(
      'Invalid node-test heavy mode: --only-heavy selected but no heavy tests matched.'
    )
    process.exit(1)
  }
}

const finalArgs = isSpecificFile
  ? [...commandArgs, ...nodeTestArgs]
  : [
      ...commandArgs,
      ...filterByHeavyMode(getRemainingTestFiles()),
      ...nodeTestArgs
    ]

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
