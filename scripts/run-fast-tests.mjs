import { availableParallelism } from 'node:os'
import { runPnpmScript } from './utils/run-pnpm-script.mjs'

const totalWorkers = Math.max(1, availableParallelism())
const nodeWorkersDefault = Math.max(1, Math.floor(totalWorkers / 2))
const vitestWorkersDefault = Math.max(1, totalWorkers - nodeWorkersDefault)

const baseEnv = { ...process.env }
if (!baseEnv.NODE_TEST_CONCURRENCY) {
  baseEnv.NODE_TEST_CONCURRENCY = `${nodeWorkersDefault}`
}
if (!baseEnv.VITEST_MAX_WORKERS) {
  baseEnv.VITEST_MAX_WORKERS = `${vitestWorkersDefault}`
}

const [nodeResult, vitestResult] = await Promise.all([
  runPnpmScript('test:node:quick', baseEnv),
  runPnpmScript('test:vitest:logic', baseEnv)
])

if (nodeResult.error) {
  console.error(nodeResult.error)
}
if (vitestResult.error) {
  console.error(vitestResult.error)
}

if (nodeResult.code !== 0 || vitestResult.code !== 0) {
  process.exit(Math.max(nodeResult.code ?? 1, vitestResult.code ?? 1))
}
