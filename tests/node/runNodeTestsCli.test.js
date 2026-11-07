// Characterization of `scripts/run-node-tests.mjs` (issue #3580). Each case
// pins CURRENT behaviour, including grammar quirks that look unintended (they
// are labelled "quirk"). Changing an expectation here is a CLI grammar change
// and needs its own approval, not a refactor.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mock, test } from 'node:test'
import {
  NODE_TEST_DIRS,
  TOOLING_NODE_TESTS
} from '../../scripts/utils/node-test-dirs.mjs'

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
)
const WORKERS = 3

let spawnImpl = () => {
  throw new Error('spawnSync called without a configured case')
}
let importId = 0

mock.module('node:os', {
  namedExports: { availableParallelism: () => WORKERS }
})
mock.module('node:child_process', {
  namedExports: { spawnSync: (...args) => spawnImpl(...args) }
})

const B = concurrency => [
  '--test',
  '--no-warnings=ExperimentalWarning',
  '--import',
  'tsx',
  '--experimental-test-module-mocks',
  '--import',
  './tests/setup.mjs',
  `--test-concurrency=${concurrency}`
]

const HEAVY = [
  'tests/node/game-balance-cadence-probe.test.js',
  'tests/node/game-balance-tension-report.test.js',
  'tests/node/updateSymbols.test.js',
  'tests/node/CrowdManager.test.js',
  'tests/node/LaneManager.test.js',
  'tests/node/NoteManager.test.js',
  'tests/node/useGigEffects.test.js',
  'tests/node/useGigInput.test.js',
  'tests/node/usePurchaseLogic.test.js'
]

// Independent crawl of the six node roots, as absolute native paths.
const crawl = relDir => {
  const abs = path.join(REPO_ROOT, relDir)
  if (!fs.existsSync(abs)) return []
  return fs.readdirSync(abs, { withFileTypes: true }).flatMap(entry => {
    const rel = `${relDir}/${entry.name}`
    if (entry.isDirectory()) return crawl(rel)
    return /\.(?:test|spec)\.js$/.test(entry.name)
      ? [path.join(REPO_ROOT, rel)]
      : []
  })
}
const toRel = abs => path.relative(REPO_ROOT, abs).replaceAll('\\', '/')
const DISCOVERED = NODE_TEST_DIRS.flatMap(crawl)
const toolingSet = new Set(TOOLING_NODE_TESTS)
const heavySet = new Set(HEAVY)
const NON_TOOLING = DISCOVERED.filter(f => !toolingSet.has(toRel(f)))
const TOOLING = DISCOVERED.filter(f => toolingSet.has(toRel(f)))
const sorted = list => [...list].sort()

const SHARD_ERROR = token =>
  `Invalid --shard value "${token}"; expected --shard=<index>/<total> with 1 <= index <= total.`
const CONFLICT_ERROR =
  'Invalid node-test selection: --only-tooling, --only-heavy, and --skip-heavy cannot be combined.'
const NOT_NODE_ERROR =
  'Node runner only supports node:test directories under tests/. Use the Vitest runner for UI/integration and vitest-owned suites.'

const runRunner = async (
  t,
  { args = [], env = {}, cwd = REPO_ROOT, result = { status: 0 } } = {}
) => {
  const originalArgv = process.argv
  const originalEnv = process.env
  const originalCwd = process.cwd()
  process.argv = ['node', 'run-node-tests.mjs', ...args]
  process.env = { ...originalEnv }
  for (const key of [
    'NODE_TEST_ONLY_HEAVY',
    'NODE_TEST_SKIP_HEAVY',
    'NODE_TEST_CONCURRENCY'
  ]) {
    delete process.env[key]
  }
  Object.assign(process.env, env)
  process.chdir(cwd)
  t.after(() => {
    process.argv = originalArgv
    process.env = originalEnv
    process.chdir(originalCwd)
  })

  const calls = []
  const errors = []
  const exits = []
  const exitSignal = new Error('runner exited')
  t.mock.method(console, 'error', message => errors.push(message))
  t.mock.method(process, 'exit', code => {
    exits.push(code)
    throw exitSignal
  })
  spawnImpl = (command, spawnArgs, options) => {
    calls.push({
      command,
      args: spawnArgs,
      options,
      envIsProcessEnv: options?.env === process.env
    })
    return result
  }

  let thrown
  try {
    await import(`../../scripts/run-node-tests.mjs?case=${importId++}`)
  } catch (error) {
    if (error !== exitSignal) thrown = error
  }
  return { calls, errors, exits, thrown }
}

// Asserts a single successful spawn and returns the args after the prefix.
const spawnedRest = (run, concurrency = WORKERS) => {
  assert.deepEqual(run.errors, [])
  assert.deepEqual(run.exits, [0])
  assert.equal(run.calls.length, 1)
  const { args } = run.calls[0]
  assert.deepEqual(args.slice(0, 8), B(concurrency))
  return args.slice(8)
}

// Discovery layout: reporters, then the discovered files, then forwarded args.
const assertDiscovery = (
  run,
  { files, reporters = [], forwarded = [], concurrency = WORKERS, ordered }
) => {
  const rest = spawnedRest(run, concurrency)
  assert.deepEqual(rest.slice(0, reporters.length), reporters)
  const spawnedFiles = rest.slice(
    reporters.length,
    reporters.length + files.length
  )
  if (ordered) assert.deepEqual(spawnedFiles, files)
  else assert.deepEqual(sorted(spawnedFiles), sorted(files))
  assert.deepEqual(rest.slice(reporters.length + files.length), forwarded)
  return spawnedFiles
}

const assertRejected = (run, message) => {
  assert.deepEqual(run.calls, [])
  assert.deepEqual(run.exits, [1])
  assert.deepEqual(run.errors, [message])
}

test('sanity: the independent crawl sees heavy, tooling and plain suites', () => {
  assert.ok(NON_TOOLING.length > 50)
  assert.ok(TOOLING.length === TOOLING_NODE_TESTS.length)
  assert.ok(DISCOVERED.some(f => heavySet.has(toRel(f))))
})

// ---------------------------------------------------------------- discovery

test('default discovery runs every non-tooling suite, heavy included', async t => {
  const run = await runRunner(t)
  assertDiscovery(run, { files: NON_TOOLING })
  assert.equal(run.calls[0].command, 'node')
  assert.deepEqual(Object.keys(run.calls[0].options).sort(), ['env', 'stdio'])
  assert.equal(run.calls[0].options.stdio, 'inherit')
  assert.equal(run.calls[0].envIsProcessEnv, true)
})

test('--only-tooling discovers only tooling suites', async t => {
  assertDiscovery(await runRunner(t, { args: ['--only-tooling'] }), {
    files: TOOLING
  })
})

test('--skip-heavy and NODE_TEST_SKIP_HEAVY=1 drop heavy suites', async t => {
  const files = NON_TOOLING.filter(f => !heavySet.has(toRel(f)))
  assertDiscovery(await runRunner(t, { args: ['--skip-heavy'] }), { files })
  assertDiscovery(await runRunner(t, { env: { NODE_TEST_SKIP_HEAVY: '1' } }), {
    files
  })
})

test('--only-heavy keeps heavy suites after the tooling filter', async t => {
  const files = NON_TOOLING.filter(f => heavySet.has(toRel(f)))
  assert.deepEqual(
    sorted(files.map(toRel)),
    sorted(HEAVY.filter(f => !toolingSet.has(f)))
  )
  assertDiscovery(await runRunner(t, { args: ['--only-heavy'] }), { files })
  assertDiscovery(await runRunner(t, { env: { NODE_TEST_ONLY_HEAVY: '1' } }), {
    files
  })
})

test('heavy env overrides only accept exactly "1"', async t => {
  assertDiscovery(
    await runRunner(t, {
      env: { NODE_TEST_ONLY_HEAVY: 'true', NODE_TEST_SKIP_HEAVY: 'yes' }
    }),
    { files: NON_TOOLING }
  )
})

// ---------------------------------------------------------------- sharding

test('--shard splits sorted discovery round-robin into disjoint shards', async t => {
  const order = [...NON_TOOLING].sort((a, b) =>
    a.replaceAll('\\', '/').localeCompare(b.replaceAll('\\', '/'))
  )
  const first = assertDiscovery(await runRunner(t, { args: ['--shard=1/2'] }), {
    files: order.filter((_, i) => i % 2 === 0),
    ordered: true
  })
  const second = assertDiscovery(
    await runRunner(t, { args: ['--shard=2/2'] }),
    { files: order.filter((_, i) => i % 2 === 1), ordered: true }
  )
  assert.deepEqual(sorted([...first, ...second]), sorted(NON_TOOLING))
})

test('--shard=1/1 keeps crawl order; trailing segments are ignored', async t => {
  const unsharded = spawnedRest(await runRunner(t))
  assert.deepEqual(
    spawnedRest(await runRunner(t, { args: ['--shard=1/1'] })),
    unsharded
  )
  // quirk: only the first two "/" segments are read
  const order = [...NON_TOOLING].sort((a, b) =>
    a.replaceAll('\\', '/').localeCompare(b.replaceAll('\\', '/'))
  )
  assertDiscovery(await runRunner(t, { args: ['--shard=1/2/ignored'] }), {
    files: order.filter((_, i) => i % 2 === 0),
    ordered: true
  })
})

test('first --shard= wins and later ones are dropped unvalidated', async t => {
  const one = spawnedRest(await runRunner(t, { args: ['--shard=1/2'] }))
  assert.deepEqual(
    spawnedRest(
      await runRunner(t, { args: ['--shard=1/2', '--shard=not-a-shard'] })
    ),
    one
  )
})

test('invalid --shard values exit 1 without spawning', async t => {
  for (const token of [
    '--shard=0/2',
    '--shard=3/2',
    '--shard=a/b',
    '--shard='
  ]) {
    assertRejected(await runRunner(t, { args: [token] }), SHARD_ERROR(token))
  }
})

test('quirk: "--shard 1/2" is not a shard; both tokens are forwarded', async t => {
  assertDiscovery(await runRunner(t, { args: ['--shard', '1/2'] }), {
    files: NON_TOOLING,
    forwarded: ['--shard', '1/2']
  })
})

// ------------------------------------------------------------- concurrency

test('concurrency defaults to computeWorkerCount(NODE_TEST_CONCURRENCY)', async t => {
  spawnedRest(await runRunner(t), WORKERS)
  spawnedRest(await runRunner(t, { env: { NODE_TEST_CONCURRENCY: '5' } }), 5)
  spawnedRest(await runRunner(t, { env: { NODE_TEST_CONCURRENCY: '0' } }), 1)
  spawnedRest(
    await runRunner(t, { env: { NODE_TEST_CONCURRENCY: 'many' } }),
    WORKERS
  )
  spawnedRest(await runRunner(t, { env: { NODE_TEST_CONCURRENCY: '64' } }), 64)
})

test('--test-concurrency=N overrides the env; the first token wins', async t => {
  assertDiscovery(
    await runRunner(t, {
      args: ['--test-concurrency=2', '--test-concurrency=9'],
      env: { NODE_TEST_CONCURRENCY: '5' }
    }),
    { files: NON_TOOLING, concurrency: 2 }
  )
  // quirk: the raw text after the first "=" up to the next "=" is used
  assertDiscovery(
    await runRunner(t, { args: ['--test-concurrency=4=extra'] }),
    { files: NON_TOOLING, concurrency: 4 }
  )
  // quirk: any token with the prefix matches, and is consumed
  assertDiscovery(
    await runRunner(t, { args: ['--test-concurrency-extra=7'] }),
    { files: NON_TOOLING, concurrency: 7 }
  )
})

test('quirk: "--test-concurrency 4" spawns =undefined and forwards 4', async t => {
  assertDiscovery(await runRunner(t, { args: ['--test-concurrency', '4'] }), {
    files: NON_TOOLING,
    concurrency: 'undefined',
    forwarded: ['4']
  })
})

// --------------------------------------------------- grammar and forwarding

test('one leading "--" is stripped; a later "--" is forwarded', async t => {
  assertDiscovery(
    await runRunner(t, {
      args: ['--', '--only-tooling', '--', '--test-name-pattern=x']
    }),
    { files: TOOLING, forwarded: ['--', '--test-name-pattern=x'] }
  )
})

test('runner flags are recognised anywhere, even after a later "--"', async t => {
  assertDiscovery(
    await runRunner(t, { args: ['--test-only', '--', '--only-tooling'] }),
    { files: TOOLING, forwarded: ['--test-only', '--'] }
  )
})

test('reporter tokens move to the front; other tokens keep their order', async t => {
  assertDiscovery(
    await runRunner(t, {
      args: [
        '--test-name-pattern=foo',
        '--test-reporter=spec',
        'operand',
        '--experimental-x',
        '--test-reporter-destination=stdout',
        'tests/node/foo.test.ts'
      ]
    }),
    {
      files: NON_TOOLING,
      reporters: ['--test-reporter=spec', '--test-reporter-destination=stdout'],
      forwarded: [
        '--test-name-pattern=foo',
        'operand',
        '--experimental-x',
        'tests/node/foo.test.ts'
      ]
    }
  )
})

test('quirk: a separate reporter value stays behind in the forwarded args', async t => {
  assertDiscovery(await runRunner(t, { args: ['--test-reporter', 'spec'] }), {
    files: NON_TOOLING,
    reporters: ['--test-reporter'],
    forwarded: ['spec']
  })
})

test('quirk: a separate .mjs reporter value is read as an explicit file', async t => {
  assertRejected(
    await runRunner(t, { args: ['--test-reporter', './dot-reporter.mjs'] }),
    NOT_NODE_ERROR
  )
})

test('quirk: a .js value of a non-import option is read as an explicit file', async t => {
  assertRejected(
    await runRunner(t, { args: ['--test-name-pattern', 'parser.js'] }),
    NOT_NODE_ERROR
  )
})

test('--import/-r/--require values are never explicit files', async t => {
  assertDiscovery(
    await runRunner(t, {
      args: ['--import', 'a.js', '-r', 'b.cjs', '--require', 'c.mjs']
    }),
    {
      files: NON_TOOLING,
      forwarded: ['--import', 'a.js', '-r', 'b.cjs', '--require', 'c.mjs']
    }
  )
})

test('quirk: --import skips a reporter token, which still moves to the front', async t => {
  const file = 'tests/node/actionCreators.test.js'
  assert.deepEqual(
    spawnedRest(
      await runRunner(t, { args: ['--import', '--test-reporter=spec', file] })
    ),
    ['--test-reporter=spec', '--import', file]
  )
})

test('quirk: wrapper flags vacate a value slot, so -r swallows the next file', async t => {
  const file = 'tests/node/actionCreators.test.js'
  assertDiscovery(await runRunner(t, { args: ['-r', '--skip-heavy', file] }), {
    files: NON_TOOLING.filter(f => !heavySet.has(toRel(f))),
    forwarded: ['-r', file]
  })
  assertRejected(
    await runRunner(t, { args: ['--require', '--shard=bad', file] }),
    SHARD_ERROR('--shard=bad')
  )
})

// --------------------------------------------------------- explicit files

test('explicit files keep their positions and nothing is discovered', async t => {
  assert.deepEqual(
    spawnedRest(
      await runRunner(t, {
        args: [
          '--test-name-pattern=a',
          'tests/node/actionCreators.test.js',
          '--test-reporter=dot',
          'tests/node/parallelism.test.js'
        ]
      })
    ),
    [
      '--test-reporter=dot',
      '--test-name-pattern=a',
      'tests/node/actionCreators.test.js',
      'tests/node/parallelism.test.js'
    ]
  )
})

test('explicit files bypass heavy filtering and sharding', async t => {
  const heavy = 'tests/node/CrowdManager.test.js'
  assert.deepEqual(
    spawnedRest(
      await runRunner(t, { args: ['--skip-heavy', '--shard=2/2', heavy] })
    ),
    [heavy]
  )
  assert.deepEqual(
    spawnedRest(
      await runRunner(t, {
        args: ['tests/node/actionCreators.test.js'],
        env: { NODE_TEST_ONLY_HEAVY: '1' }
      })
    ),
    ['tests/node/actionCreators.test.js']
  )
})

test('explicit .mjs/.cjs operands count as explicit files', async t => {
  assert.deepEqual(
    spawnedRest(
      await runRunner(t, {
        args: ['tests/node/x.test.mjs', 'tests/reducers/y.cjs']
      })
    ),
    ['tests/node/x.test.mjs', 'tests/reducers/y.cjs']
  )
})

test('a plain explicit run may name a tooling suite', async t => {
  assert.deepEqual(
    spawnedRest(
      await runRunner(t, { args: ['tests/node/parallelism.test.js'] })
    ),
    ['tests/node/parallelism.test.js']
  )
})

test('--only-tooling accepts tooling files and rejects the rest', async t => {
  assert.deepEqual(
    spawnedRest(
      await runRunner(t, {
        args: ['--only-tooling', 'tests/node/parallelism.test.js']
      })
    ),
    ['tests/node/parallelism.test.js']
  )
  assertRejected(
    await runRunner(t, {
      args: [
        '--only-tooling',
        'tests/node/actionCreators.test.js',
        'tests/node/parallelism.test.js',
        'tests/node/CrowdManager.test.js'
      ]
    }),
    'Invalid node-test selection: tests/node/actionCreators.test.js, tests/node/CrowdManager.test.js is not a tooling test.'
  )
})

test('explicit files outside the node roots are rejected', async t => {
  assertRejected(
    await runRunner(t, { args: ['tests/ui/Foo.test.js'] }),
    NOT_NODE_ERROR
  )
  assertRejected(
    await runRunner(t, { args: ['tests/node/a.test.js', 'src/b.js'] }),
    NOT_NODE_ERROR
  )
})

test('quirk: root ownership resolves against cwd, tooling against the repo', async t => {
  const cwd = path.join(REPO_ROOT, 'tests')
  assert.deepEqual(
    spawnedRest(
      await runRunner(t, { cwd, args: ['node/actionCreators.test.js'] })
    ),
    ['node/actionCreators.test.js']
  )
  assertRejected(
    await runRunner(t, {
      cwd,
      args: ['--only-tooling', 'node/parallelism.test.js']
    }),
    'Invalid node-test selection: node/parallelism.test.js is not a tooling test.'
  )
  assertRejected(
    await runRunner(t, { cwd, args: ['tests/node/actionCreators.test.js'] }),
    NOT_NODE_ERROR
  )
})

// ------------------------------------------------------ error precedence

test('mode conflicts exit 1, including env-derived ones', async t => {
  for (const { args = [], env = {} } of [
    { args: ['--only-heavy', '--skip-heavy'] },
    { args: ['--only-tooling', '--skip-heavy'] },
    { args: ['--only-tooling', '--only-heavy'] },
    { args: ['--only-tooling'], env: { NODE_TEST_ONLY_HEAVY: '1' } },
    { env: { NODE_TEST_ONLY_HEAVY: '1', NODE_TEST_SKIP_HEAVY: '1' } },
    {
      args: ['tests/node/a.test.js'],
      env: { NODE_TEST_SKIP_HEAVY: '1', NODE_TEST_ONLY_HEAVY: '1' }
    }
  ]) {
    assertRejected(await runRunner(t, { args, env }), CONFLICT_ERROR)
  }
})

test('validation order: shard, then mode conflict, then roots, then tooling', async t => {
  assertRejected(
    await runRunner(t, {
      args: ['--shard=3/2', '--only-heavy', '--skip-heavy', 'src/x.js']
    }),
    SHARD_ERROR('--shard=3/2')
  )
  assertRejected(
    await runRunner(t, {
      args: ['--only-tooling', 'src/x.js'],
      env: { NODE_TEST_SKIP_HEAVY: '1' }
    }),
    CONFLICT_ERROR
  )
  assertRejected(
    await runRunner(t, {
      args: ['--only-tooling', 'tests/node/actionCreators.test.js', 'src/x.js']
    }),
    NOT_NODE_ERROR
  )
})

// ------------------------------------------------------------ exit status

test('the child status becomes the exit code; errors only without a status', async t => {
  const error = new Error('spawn failed')
  const cases = [
    [{ status: 0 }, [0]],
    [{ status: 3 }, [3]],
    [{ status: 2, error }, [2]],
    [{ status: null }, [1]]
  ]
  for (const [result, exits] of cases) {
    const run = await runRunner(t, { result })
    assert.equal(run.calls.length, 1)
    assert.deepEqual(run.exits, exits)
    assert.equal(run.thrown, undefined)
  }
  const thrownRun = await runRunner(t, { result: { status: null, error } })
  assert.deepEqual(thrownRun.exits, [])
  assert.equal(thrownRun.thrown, error)
})
