/**
 * Single parse step for `scripts/run-node-tests.mjs` arguments.
 *
 * @remarks
 * Pure: reads nothing from `process`, the environment or the filesystem, so
 * the runner's grammar can be unit-tested without spawning. The grammar is
 * pinned, quirks included, by `tests/node/runNodeTestsCli.test.js`; changing
 * any stage below is a CLI change, not a refactor. The user-facing grammar is
 * summarised in the usage comment of `scripts/run-node-tests.mjs`.
 */

const RUNNER_FLAGS = new Set(['--skip-heavy', '--only-heavy', '--only-tooling'])

/** Runner options that take a value, as `--name=value` or `--name value`. */
const RUNNER_VALUE_OPTIONS = ['--shard', '--test-concurrency']

/** Node options whose next token is a module, never a test file. */
const VALUE_OPTIONS = new Set(['--import', '-r', '--require'])

const EXPLICIT_FILE_PATTERN = /\.(?:js|mjs|cjs)$/
const SHARD_VALUE_PATTERN = /^\d+\/\d+$/
const CONCURRENCY_VALUE_PATTERN = /^[1-9]\d*$/

/**
 * Upper bound for `--test-concurrency`. Keeps the value a small safe integer,
 * so it serialises back as plain digits (`1e+22` would not).
 */
export const MAX_TEST_CONCURRENCY = 1024

/**
 * @typedef {object} NodeTestShard
 * @property {string} token The option as given (`--shard=1/2`, or
 *   `--shard 1/2` for the separate form).
 * @property {number} index 1-based shard index.
 * @property {number} total Shard count.
 * @property {boolean} valid Whether the value is exactly `<index>/<total>`
 *   with integers `1 <= index <= total`.
 */

/**
 * @typedef {object} NodeTestConcurrency
 * @property {string} token The option as given.
 * @property {number} value The parsed worker count.
 * @property {boolean} valid Whether the value is a decimal integer with
 *   `1 <= value <= MAX_TEST_CONCURRENCY`.
 */

/**
 * @typedef {object} NodeTestArgs
 * @property {boolean} skipHeavy `--skip-heavy` was given.
 * @property {boolean} onlyHeavy `--only-heavy` was given.
 * @property {boolean} onlyTooling `--only-tooling` was given.
 * @property {NodeTestShard | null} shard The `--shard` option, if any.
 * @property {NodeTestConcurrency | null} concurrency The
 *   `--test-concurrency` option, if any.
 * @property {string[]} repeatedOptions Runner value options given more than
 *   once.
 * @property {string[]} unknownOptions Tokens that extend a runner value
 *   option's name (`--test-concurrency-foo`, `--shard-x=1/2`), in order.
 * @property {string[]} reporterArgs `--test-reporter*` tokens, in order.
 * @property {string[]} forwardedArgs Every other Node token, in order;
 *   explicit files stay at their positions.
 * @property {string[]} explicitFiles Operands detected as explicit test files.
 */

/**
 * Parses the runner's argv (without the node and script entries) once.
 *
 * @param {readonly string[]} rawArgs
 * @returns {NodeTestArgs}
 */
export const parseNodeTestArgs = rawArgs => {
  // Stage 1: strip exactly one leading `--` (the pnpm separator). A later
  // `--` is an ordinary token and is forwarded.
  const args = rawArgs[0] === '--' ? rawArgs.slice(1) : rawArgs

  // Stage 2: consume runner-owned tokens wherever they appear, including in
  // a value slot or after a later `--`. A runner value option is
  // `--name=value` or `--name value`; the separate form takes the next token
  // only when it does not start with `-`, otherwise the value is missing.
  // A repeated value option is reported, never silently dropped.
  const flags = new Set()
  /** @type {Map<string, { token: string, value: string }>} */
  const valueOptions = new Map()
  /** @type {string[]} */
  const repeatedOptions = []
  /** @type {string[]} */
  const unknownOptions = []
  const nodeArgs = []
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    const name = RUNNER_VALUE_OPTIONS.find(
      option => arg === option || arg.startsWith(`${option}=`)
    )
    if (RUNNER_FLAGS.has(arg)) {
      flags.add(arg)
    } else if (name) {
      let token = arg
      let value = arg.slice(name.length + 1)
      const next = args[i + 1]
      // Dash-leading operands are never consumed: valid only because both
      // options (--shard, --test-concurrency) take unsigned values.
      if (arg === name && next !== undefined && !next.startsWith('-')) {
        token = `${arg} ${next}`
        value = next
        i++
      }
      if (!valueOptions.has(name)) valueOptions.set(name, { token, value })
      else if (!repeatedOptions.includes(name)) repeatedOptions.push(name)
    } else if (RUNNER_VALUE_OPTIONS.some(option => arg.startsWith(option))) {
      // A longer name sharing a runner option's prefix is a typo, not a Node
      // option: report it instead of forwarding it to Node's vaguer error.
      unknownOptions.push(arg)
    } else {
      nodeArgs.push(arg)
    }
  }

  // Stage 3: explicit files are non-option operands with a JS extension,
  // skipping the value of --import/-r/--require. This runs over the tokens
  // left after stage 2, so a consumed runner flag vacates a value slot and
  // `-r --skip-heavy x.test.js` treats the file as the `-r` value. Values of
  // other options (`--test-reporter ./r.mjs`) still count as files.
  const explicitFiles = []
  for (let i = 0; i < nodeArgs.length; i++) {
    const arg = nodeArgs[i]
    if (VALUE_OPTIONS.has(arg)) i++
    else if (!arg.startsWith('-') && EXPLICIT_FILE_PATTERN.test(arg)) {
      explicitFiles.push(arg)
    }
  }

  // Stage 4: reporter tokens move to the front of the child args. Only the
  // `--test-reporter*` token moves; a separate value stays in place.
  const isReporter = arg => arg.startsWith('--test-reporter')

  let shard = null
  const shardOption = valueOptions.get('--shard')
  if (shardOption) {
    const [rawIndex, rawTotal] = shardOption.value.split('/')
    const index = Number(rawIndex)
    const total = Number(rawTotal)
    shard = {
      token: shardOption.token,
      index,
      total,
      valid:
        SHARD_VALUE_PATTERN.test(shardOption.value) &&
        total >= 1 &&
        index >= 1 &&
        index <= total
    }
  }

  let concurrency = null
  const concurrencyOption = valueOptions.get('--test-concurrency')
  if (concurrencyOption) {
    concurrency = {
      token: concurrencyOption.token,
      value: Number(concurrencyOption.value),
      valid:
        CONCURRENCY_VALUE_PATTERN.test(concurrencyOption.value) &&
        Number(concurrencyOption.value) <= MAX_TEST_CONCURRENCY
    }
  }

  return {
    skipHeavy: flags.has('--skip-heavy'),
    onlyHeavy: flags.has('--only-heavy'),
    onlyTooling: flags.has('--only-tooling'),
    shard,
    concurrency,
    repeatedOptions,
    unknownOptions,
    reporterArgs: nodeArgs.filter(isReporter),
    forwardedArgs: nodeArgs.filter(arg => !isReporter(arg)),
    explicitFiles
  }
}
