import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { computeWorkerCount } from './utils/parallelism.mjs'
import {
  HEAVY_NODE_TESTS,
  NODE_TEST_DIRS,
  isToolingNodeTest
} from './utils/node-test-dirs.mjs'
import {
  MAX_TEST_CONCURRENCY,
  parseNodeTestArgs
} from './utils/node-test-args.mjs'

// Usage: node scripts/run-node-tests.mjs [--] [runner options] [node options]
//          [test files]
//
// Runner options (consumed here, never passed to Node):
//   --skip-heavy | --only-heavy | --only-tooling   Mutually exclusive modes.
//   --shard=<i>/<n> | --shard <i>/<n>   1-based; splits discovery round-robin
//       over the sorted file list. Ignored when test files are passed.
//   --test-concurrency=<n> | --test-concurrency <n>   1 <= n <= 1024; default is
//       computeWorkerCount('NODE_TEST_CONCURRENCY').
//   A value option given twice, a missing value, or a malformed one exits 1,
//   as does a longer name sharing its prefix (`--test-concurrency-foo`).
//
// Intentional grammar (pinned by tests/node/runNodeTestsCli.test.js):
// - One leading `--` (the pnpm separator) is stripped. Runner options are
//   recognised anywhere, including after a later `--`, which is forwarded.
// - NODE_TEST_ONLY_HEAVY / NODE_TEST_SKIP_HEAVY act only when exactly "1".
// - Explicit files are operands ending in .js/.mjs/.cjs. Only the values of
//   --import/-r/--require are skipped; pass any other Node option value that
//   ends in a JS extension in `=` form (`--test-reporter=./r.mjs`).
// - `--test-reporter*` tokens move to the front; a separate value does not
//   move with them, so pass reporter options in `=` form.
// - Runner options are removed before Node value slots are read, so a runner
//   option must not sit between a Node option and its value.
// - Run from the repository root: node-root ownership resolves paths against
//   cwd, the --only-tooling check against the repository root, and the
//   spawned `--import ./tests/setup.mjs` against cwd.
const {
  skipHeavy: flagSkipHeavy,
  onlyHeavy: flagOnlyHeavy,
  onlyTooling: flagOnlyTooling,
  shard,
  concurrency,
  repeatedOptions,
  unknownOptions,
  reporterArgs,
  forwardedArgs,
  explicitFiles
} = parseNodeTestArgs(process.argv.slice(2))

const fail = message => {
  console.error(message)
  process.exit(1)
}

if (repeatedOptions.length > 0) {
  fail(`Invalid node-test arguments: ${repeatedOptions[0]} was given twice.`)
}
if (unknownOptions.length > 0) {
  fail(`Invalid node-test arguments: unknown option "${unknownOptions[0]}".`)
}
if (shard && !shard.valid) {
  fail(
    `Invalid --shard value "${shard.token}"; expected --shard=<index>/<total> with 1 <= index <= total.`
  )
}
if (concurrency && !concurrency.valid) {
  fail(
    `Invalid --test-concurrency value "${concurrency.token}"; expected --test-concurrency=<n> with 1 <= n <= ${MAX_TEST_CONCURRENCY}.`
  )
}
const shardIndex = shard?.index ?? 0
const shardTotal = shard?.total ?? 0

const testConcurrency =
  concurrency?.value ?? computeWorkerCount('NODE_TEST_CONCURRENCY')

const commandArgs = [
  '--test',
  '--no-warnings=ExperimentalWarning',
  '--import',
  'tsx',
  '--experimental-test-module-mocks',
  '--import',
  './tests/setup.mjs',
  `--test-concurrency=${testConcurrency}`
]

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..')

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
      let stat
      try {
        stat = fs.statSync(fullPath)
      } catch {
        continue
      }
      if (stat.isDirectory()) {
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

if (
  (shouldOnlyHeavy && shouldSkipHeavy) ||
  (flagOnlyTooling && (shouldOnlyHeavy || shouldSkipHeavy))
) {
  fail(
    'Invalid node-test selection: --only-tooling, --only-heavy, and --skip-heavy cannot be combined.'
  )
}

const filterByToolingMode = testFiles =>
  testFiles.filter(testFile => {
    const relativePath = path
      .relative(REPO_ROOT, testFile)
      .replaceAll('\\', '/')
    return isToolingNodeTest(relativePath) === flagOnlyTooling
  })

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

// Explicit paths resolve against cwd here, but against REPO_ROOT for the
// tooling check below; both bases are pinned by the characterization test.
if (explicitFiles.some(arg => !isPathInNodeDirs(arg))) {
  fail(
    'Node runner only supports node:test directories under tests/. Use the Vitest runner for UI/integration and vitest-owned suites.'
  )
}

// Distribute a sorted file list across shards by round-robin on the sorted
// index. Sorting first makes the assignment stable regardless of readdir order,
// and round-robin keeps heavy/light files spread evenly across shards.
const applyShard = testFiles => {
  if (shardTotal < 2) return testFiles
  const sorted = [...testFiles].sort((a, b) =>
    normalizeTestPath(a).localeCompare(normalizeTestPath(b))
  )
  return sorted.filter((_, idx) => idx % shardTotal === shardIndex - 1)
}

// The one selection pipeline. Explicit files are already in `forwardedArgs` at
// their original positions, so that branch only validates and adds nothing;
// heavy filtering and sharding apply to discovery alone.
const selectDiscoveredFiles = () => {
  if (explicitFiles.length > 0) {
    // An explicit path is filtered by the same rule as a discovered one.
    // Without this, `--only-tooling tests/node/actionCreators.test.js` ran a
    // test the flag exists to exclude - the mode silently did not apply to the
    // one invocation that names its files.
    if (flagOnlyTooling) {
      const mismatched = explicitFiles.filter(testFile => {
        const relativePath = path
          .relative(REPO_ROOT, path.resolve(REPO_ROOT, testFile))
          .replaceAll('\\', '/')
        return !isToolingNodeTest(relativePath)
      })
      if (mismatched.length > 0) {
        fail(
          `Invalid node-test selection: ${mismatched.join(', ')} is not a tooling test.`
        )
      }
    }
    return []
  }

  const discovered = getRemainingTestFiles()
  // Checked on the unfiltered crawl, before the tooling filter applies.
  if (shouldOnlyHeavy && filterByHeavyMode(discovered).length === 0) {
    fail(
      'Invalid node-test heavy mode: --only-heavy selected but no heavy tests matched.'
    )
  }
  return applyShard(filterByHeavyMode(filterByToolingMode(discovered)))
}

const finalArgs = [
  ...commandArgs,
  ...reporterArgs,
  ...selectDiscoveredFiles(),
  ...forwardedArgs
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
