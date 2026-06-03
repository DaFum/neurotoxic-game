/**
 * Parallel test:all runner.
 *
 * Execution model (4-core baseline):
 *
 *   Phase A (parallel):
 *     test:node           — 161 node:test files, full worker allotment
 *     test:vitest:logic   — 26 node-env vitest files, minimal workers (5 s)
 *
 *   Phase B (sequential, after Phase A):
 *     test:ui             — 131 jsdom vitest files, capped worker allotment
 *
 * test:vitest:logic is node-env only (no jsdom), draws ~1 extra worker from
 * the pool while test:node runs, and completes in ~5 s. By overlapping it
 * with test:node the 5 s disappears from the critical path entirely.
 *
 * test:ui is kept sequential after test:node because both are CPU-saturating;
 * running them simultaneously degrades both with no net gain.
 * If NODE_ALL_PARALLEL=1 is set, test:ui also runs in Phase A (useful on
 * machines with ≥8 cores).
 */
import { spawn } from 'node:child_process'
import { availableParallelism } from 'node:os'

// ---------------------------------------------------------------------------
// Worker allocation
// ---------------------------------------------------------------------------
const totalWorkers = Math.max(1, availableParallelism())

// test:node and test:ui each get the full worker count; they never run
// simultaneously so there is no contention.  test:vitest:logic is tiny
// (~5 s, node-env only) and is capped at 1 vitest worker so it doesn't
// compete with test:node's threads — the OS schedules it in the I/O gaps.
const nodeWorkersDefault = totalWorkers
const logicWorkers = 1
const vitestUiWorkerCap = 12
const uiWorkersDefault = Math.min(totalWorkers, vitestUiWorkerCap)

const baseEnv = { ...process.env }
if (!baseEnv.NODE_TEST_CONCURRENCY) {
  baseEnv.NODE_TEST_CONCURRENCY = `${nodeWorkersDefault}`
}
if (!baseEnv.VITEST_MAX_WORKERS) {
  baseEnv.VITEST_MAX_WORKERS = `${uiWorkersDefault}`
}

const logicEnv = {
  ...baseEnv,
  VITEST_MAX_WORKERS: `${logicWorkers}`
}
const nodeWorkers = baseEnv.NODE_TEST_CONCURRENCY
const uiWorkers = baseEnv.VITEST_MAX_WORKERS

// ---------------------------------------------------------------------------
// Spawn helper
// ---------------------------------------------------------------------------
const isWindows = process.platform === 'win32'
const command = isWindows ? 'cmd.exe' : 'pnpm'
const mkArgs = script =>
  isWindows ? ['/c', 'pnpm', 'run', script] : ['run', script]

const runScript = (script, env = baseEnv) =>
  new Promise(resolve => {
    const child = spawn(command, mkArgs(script), { stdio: 'inherit', env })
    child.on('error', error => resolve({ script, code: 1, error }))
    child.on('close', code => resolve({ script, code: code ?? 1 }))
  })

const bail = result => {
  if (result.error) console.error(result.error)
  if (result.code !== 0) {
    process.exitCode = result.code
    return true
  }
  return false
}

// ---------------------------------------------------------------------------
// Execution strategy
//
// Default (4-core): Phase A = test:node + test:vitest:logic in parallel.
//                   Phase B = test:ui sequential after Phase A.
//   Running test:node and test:ui simultaneously on 4 cores saturates both;
//   keeping them sequential gives each suite full worker allotment.
//
// NODE_ALL_PARALLEL=1: all three suites run concurrently in one Promise.all.
//   Intended for ≥8-core machines where the OS has headroom to schedule all
//   three without degradation.
// ---------------------------------------------------------------------------
const fullyParallel = process.env.NODE_ALL_PARALLEL === '1'

if (fullyParallel) {
  console.log(
    `[run-all-tests] Fully parallel (NODE_ALL_PARALLEL=1): test:node (${nodeWorkers}) + test:vitest:logic (${logicWorkers}) + test:ui (${uiWorkers})`
  )
  const [nodeResult, logicResult, uiResult] = await Promise.all([
    runScript('test:node', baseEnv),
    runScript('test:vitest:logic', logicEnv),
    runScript('test:ui', baseEnv)
  ])
  if (bail(nodeResult) | bail(logicResult) | bail(uiResult)) {
    process.exit(process.exitCode ?? 1)
  }
} else {
  // Phase A — test:node + test:vitest:logic
  console.log(
    `[run-all-tests] Phase A: test:node (${nodeWorkers} workers) + test:vitest:logic (${logicWorkers} vitest worker, overlapped)`
  )
  const [nodeResult, logicResult] = await Promise.all([
    runScript('test:node', baseEnv),
    runScript('test:vitest:logic', logicEnv)
  ])
  if (bail(nodeResult) | bail(logicResult)) {
    // bitwise OR intentional: report both failures before exiting
    process.exit(process.exitCode ?? 1)
  }

  // Phase B — test:ui (full workers, after Phase A completes)
  console.log(
    `[run-all-tests] Phase B: test:ui (${uiWorkers} workers, sequential)`
  )
  const uiResult = await runScript('test:ui', baseEnv)
  if (bail(uiResult)) {
    process.exit(process.exitCode ?? 1)
  }
}

console.log('[run-all-tests] All suites passed.')
