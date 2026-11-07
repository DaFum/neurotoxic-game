/**
 * Single parse step for `scripts/run-node-tests.mjs` arguments.
 *
 * @remarks
 * Pure: reads nothing from `process`, the environment or the filesystem, so
 * the runner's grammar can be unit-tested without spawning. The grammar is
 * pinned, quirks included, by `tests/node/runNodeTestsCli.test.js`; changing
 * any stage below is a CLI change, not a refactor.
 */

const RUNNER_FLAGS = new Set(['--skip-heavy', '--only-heavy', '--only-tooling'])

/** Node options whose next token is a module, never a test file. */
const VALUE_OPTIONS = new Set(['--import', '-r', '--require'])

const EXPLICIT_FILE_PATTERN = /\.(?:js|mjs|cjs)$/

/**
 * @typedef {object} NodeTestShard
 * @property {string} token The `--shard=` token as given.
 * @property {number} index 1-based shard index.
 * @property {number} total Shard count.
 * @property {boolean} valid Whether `1 <= index <= total` with integers.
 */

/**
 * @typedef {object} NodeTestArgs
 * @property {boolean} skipHeavy `--skip-heavy` was given.
 * @property {boolean} onlyHeavy `--only-heavy` was given.
 * @property {boolean} onlyTooling `--only-tooling` was given.
 * @property {NodeTestShard | null} shard The first `--shard=` token, if any.
 * @property {string | null} concurrency Value of the first
 *   `--test-concurrency*` token, or `null` when none was given.
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
  // a value slot or after a later `--`. The first `--shard=` and the first
  // `--test-concurrency*` token win; duplicates are dropped unvalidated.
  const flags = new Set()
  let shardToken = null
  let concurrencyToken = null
  const nodeArgs = []
  for (const arg of args) {
    if (RUNNER_FLAGS.has(arg)) flags.add(arg)
    else if (arg.startsWith('--shard=')) shardToken ??= arg
    else if (arg.startsWith('--test-concurrency')) concurrencyToken ??= arg
    else nodeArgs.push(arg)
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
  if (shardToken !== null) {
    // Only the first two `/` segments are read.
    const [rawIndex, rawTotal] = shardToken.slice('--shard='.length).split('/')
    const index = Number(rawIndex)
    const total = Number(rawTotal)
    shard = {
      token: shardToken,
      index,
      total,
      valid:
        Number.isInteger(index) &&
        Number.isInteger(total) &&
        total >= 1 &&
        index >= 1 &&
        index <= total
    }
  }

  return {
    skipHeavy: flags.has('--skip-heavy'),
    onlyHeavy: flags.has('--only-heavy'),
    onlyTooling: flags.has('--only-tooling'),
    shard,
    // The text between the first and second `=`; a token without `=`
    // (`--test-concurrency 4`) yields the string "undefined".
    concurrency:
      concurrencyToken === null ? null : String(concurrencyToken.split('=')[1]),
    reporterArgs: nodeArgs.filter(isReporter),
    forwardedArgs: nodeArgs.filter(arg => !isReporter(arg)),
    explicitFiles
  }
}
