import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { mock, test } from 'node:test'

let availableWorkers = 4
let spawnChild
let importId = 0

mock.module('node:os', {
  namedExports: { availableParallelism: () => availableWorkers }
})
mock.module('node:child_process', {
  namedExports: { spawn: (...args) => spawnChild(...args) }
})

const runRunner = async (
  t,
  {
    runner = 'all',
    workers = 4,
    platform = 'linux',
    env = {},
    results = {}
  } = {}
) => {
  availableWorkers = workers
  const originalPlatform = process.platform
  const originalEnv = process.env
  const originalExitCode = process.exitCode
  process.env = { ...originalEnv, RUNNER_TEST_MARKER: 'inherited' }
  for (const key of [
    'NODE_TEST_CONCURRENCY',
    'VITEST_MAX_WORKERS',
    'NODE_ALL_PARALLEL'
  ]) {
    delete process.env[key]
  }
  Object.assign(process.env, env)
  Object.defineProperty(process, 'platform', { value: platform })
  t.after(() => {
    process.env = originalEnv
    process.exitCode = originalExitCode
    Object.defineProperty(process, 'platform', { value: originalPlatform })
  })

  const calls = []
  const events = []
  const errors = []
  const exits = []
  const exitSignal = new Error('runner exited')
  t.mock.method(console, 'log', () => {})
  t.mock.method(console, 'error', error => errors.push(error))
  t.mock.method(process, 'exit', code => {
    exits.push(code)
    throw exitSignal
  })
  spawnChild = (command, args, options) => {
    const script = args.at(-1)
    calls.push({ command, args, options, script })
    events.push(`spawn:${script}`)
    const child = new EventEmitter()
    queueMicrotask(() => {
      const result = results[script] ?? { code: 0 }
      if (result.error) child.emit('error', result.error)
      events.push(`close:${script}`)
      child.emit('close', result.code)
    })
    return child
  }

  try {
    await import(`../../scripts/run-${runner}-tests.mjs?case=${importId++}`)
  } catch (error) {
    if (error !== exitSignal) throw error
  }
  return { calls, events, errors, exits }
}

test('fast runner splits workers and starts both suites with inherited env', async t => {
  const { calls, events, exits } = await runRunner(t, {
    runner: 'fast',
    workers: 5
  })
  assert.deepEqual(
    calls.map(call => call.script),
    ['test:node:quick', 'test:vitest:logic']
  )
  assert.deepEqual(events.slice(0, 2), [
    'spawn:test:node:quick',
    'spawn:test:vitest:logic'
  ])
  for (const { command, args, options, script } of calls) {
    assert.equal(command, 'pnpm')
    assert.deepEqual(args, ['run', script])
    assert.equal(options.stdio, 'inherit')
    assert.equal(options.env.NODE_TEST_CONCURRENCY, '2')
    assert.equal(options.env.VITEST_MAX_WORKERS, '3')
    assert.equal(options.env.RUNNER_TEST_MARKER, 'inherited')
  }
  assert.deepEqual(exits, [])
})

test('fast runner preserves overrides, Windows spawning, and highest failure code', async t => {
  const { calls, exits } = await runRunner(t, {
    runner: 'fast',
    platform: 'win32',
    env: { NODE_TEST_CONCURRENCY: '7', VITEST_MAX_WORKERS: '9' },
    results: {
      'test:node:quick': { code: 2 },
      'test:vitest:logic': { code: 3 }
    }
  })
  for (const { command, args, options, script } of calls) {
    assert.equal(command, 'cmd.exe')
    assert.deepEqual(args, ['/c', 'pnpm', 'run', script])
    assert.equal(options.env.NODE_TEST_CONCURRENCY, '7')
    assert.equal(options.env.VITEST_MAX_WORKERS, '9')
  }
  assert.deepEqual(exits, [3])
})

test('all runner waits for phase A before starting UI with its full budget', async t => {
  const { calls, events, exits } = await runRunner(t, {
    env: { NODE_ALL_PARALLEL: '0' }
  })
  assert.deepEqual(events, [
    'spawn:test:node',
    'spawn:test:vitest:logic',
    'close:test:node',
    'close:test:vitest:logic',
    'spawn:test:ui',
    'close:test:ui'
  ])
  assert.deepEqual(
    calls.map(call => call.options.env.VITEST_MAX_WORKERS),
    ['4', '1', '4']
  )
  assert.ok(
    calls.every(call => call.options.env.NODE_TEST_CONCURRENCY === '16')
  )
  assert.deepEqual(exits, [])
})

test('all runner automatically overlaps three suites on high-core machines', async t => {
  const { calls, events } = await runRunner(t, { workers: 16 })
  assert.deepEqual(events.slice(0, 3), [
    'spawn:test:node',
    'spawn:test:vitest:logic',
    'spawn:test:ui'
  ])
  assert.ok(calls.every(call => call.options.env.NODE_TEST_CONCURRENCY === '8'))
  assert.deepEqual(
    calls.map(call => call.options.env.VITEST_MAX_WORKERS),
    ['7', '1', '7']
  )
})

test('all runner preserves explicit parallel and worker overrides on Windows', async t => {
  const { calls, events } = await runRunner(t, {
    platform: 'win32',
    env: {
      NODE_ALL_PARALLEL: '1',
      NODE_TEST_CONCURRENCY: '11',
      VITEST_MAX_WORKERS: '5'
    }
  })
  assert.ok(events.slice(0, 3).every(event => event.startsWith('spawn:')))
  for (const { command, args, options, script } of calls) {
    assert.equal(command, 'cmd.exe')
    assert.deepEqual(args, ['/c', 'pnpm', 'run', script])
    assert.equal(options.stdio, 'inherit')
    assert.equal(options.env.NODE_TEST_CONCURRENCY, '11')
    assert.equal(options.env.RUNNER_TEST_MARKER, 'inherited')
  }
  assert.deepEqual(
    calls.map(call => call.options.env.VITEST_MAX_WORKERS),
    ['5', '1', '5']
  )
})

test('all runner retains the phase split below the fully parallel worker floor', async t => {
  const { calls, events } = await runRunner(t, {
    workers: 2,
    env: { NODE_ALL_PARALLEL: '1' }
  })
  assert.equal(events.indexOf('spawn:test:ui'), 4)
  assert.equal(calls[0].options.env.NODE_TEST_CONCURRENCY, '8')
  assert.equal(calls[2].options.env.VITEST_MAX_WORKERS, '2')
})

test('all runner reports spawn errors and stops before UI after phase A fails', async t => {
  const error = new Error('spawn failed')
  const { calls, errors, exits } = await runRunner(t, {
    results: {
      'test:node': { error, code: null },
      'test:vitest:logic': { code: 4 }
    }
  })
  assert.deepEqual(
    calls.map(call => call.script),
    ['test:node', 'test:vitest:logic']
  )
  assert.deepEqual(errors, [error])
  assert.deepEqual(exits, [4])
})

test('fast runner treats a signal-only close as a failure', async t => {
  const { exits } = await runRunner(t, {
    runner: 'fast',
    results: { 'test:node:quick': { code: null } }
  })
  assert.deepEqual(exits, [1])
})
