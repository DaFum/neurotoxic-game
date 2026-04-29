import { spawn } from 'node:child_process'
import { availableParallelism } from 'node:os'

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

const command = process.platform === 'win32' ? 'cmd.exe' : 'pnpm'
const mkArgs = script =>
  process.platform === 'win32' ? ['/c', 'pnpm', 'run', script] : ['run', script]

const runScript = script =>
  new Promise(resolve => {
    const child = spawn(command, mkArgs(script), {
      stdio: 'inherit',
      env: baseEnv
    })

    child.on('error', error => resolve({ script, code: 1, error }))
    child.on('close', code => resolve({ script, code: code ?? 1 }))
  })

const [nodeResult, vitestResult] = await Promise.all([
  runScript('test:node:quick'),
  runScript('test:vitest:logic')
])

if (nodeResult.error) {
  console.error(nodeResult.error)
}
if (vitestResult.error) {
  console.error(vitestResult.error)
}

if (nodeResult.code !== 0 || vitestResult.code !== 0) {
  process.exit(1)
}
