import { availableParallelism } from 'node:os'
import { spawnSync } from 'node:child_process'

const rawArgs = process.argv.slice(2)
const nodeTestArgs = rawArgs[0] === '--' ? rawArgs.slice(1) : rawArgs

const hasExplicitConcurrency = nodeTestArgs.some((arg) =>
  arg.startsWith('--test-concurrency')
)

const defaultConcurrency = Math.max(1, availableParallelism() - 1)
const configuredConcurrency = Number.parseInt(
  process.env.NODE_TEST_CONCURRENCY ?? `${defaultConcurrency}`,
  10
)
const testConcurrency = Number.isFinite(configuredConcurrency)
  ? Math.max(1, configuredConcurrency)
  : defaultConcurrency

const commandArgs = [
  '--test',
  '--import',
  'tsx',
  '--experimental-test-module-mocks',
  '--import',
  './tests/setup.mjs',
  ...(hasExplicitConcurrency
    ? []
    : [`--test-concurrency=${testConcurrency}`]),
  ...nodeTestArgs
]

const result = spawnSync('node', commandArgs, {
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
