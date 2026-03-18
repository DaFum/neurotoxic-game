import { spawnSync } from 'node:child_process'
import { computeWorkerCount } from './utils/parallelism.mjs'

const rawArgs = process.argv.slice(2)
const nodeTestArgs = rawArgs[0] === '--' ? rawArgs.slice(1) : rawArgs

const hasExplicitConcurrency = nodeTestArgs.some((arg) =>
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
