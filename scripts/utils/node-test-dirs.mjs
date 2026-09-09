/**
 * Directories whose `.test.js` / `.spec.js` files are owned by the `node:test`
 * runner (`scripts/run-node-tests.mjs`).
 *
 * @remarks
 * Extracted into its own module so the discovery guard in
 * `tests/node/nodeTestDiscovery.test.js` can assert against the REAL list.
 * The runner itself spawns test processes and calls `process.exit` at top
 * level, so it cannot be imported from a test — a hand-copied duplicate was
 * the only alternative, and it silently kept validating stale rules whenever
 * the runner's roots changed.
 */
export const NODE_TEST_DIRS = Object.freeze([
  'tests/node',
  'tests/components',
  'tests/context',
  'tests/events',
  'tests/golden-path',
  'tests/reducers'
])

/** File suffixes the node runner discovers within {@link NODE_TEST_DIRS}. */
export const NODE_TEST_FILE_PATTERN = /\.(?:test|spec)\.js$/

/** Node-owned suites whose primary subject is repository tooling. */
export const TOOLING_NODE_TESTS = Object.freeze([
  'tests/node/agentInstructionsSync.test.js',
  'tests/node/balanceSourceFiles.test.js',
  'tests/node/game-balance-cadence-probe.test.js',
  'tests/node/game-balance-experiments.test.js',
  'tests/node/game-balance-simulation.test.js',
  'tests/node/game-balance-tension-report.test.js',
  'tests/node/expeditionContractNumbers.test.js',
  'tests/node/expeditionG6CloseOut.test.js',
  'tests/node/gameBalanceExpeditionCareer.test.js',
  'tests/node/gameBalanceExpeditionExtractionProbe.test.js',
  'tests/node/gameBalanceExpeditionFogProbe.test.js',
  'tests/node/gameBalanceExpeditionPolicyCoverage.test.js',
  'tests/node/gameBalanceExpeditionProfiles.test.js',
  'tests/node/gameBalanceExpeditionReleaseGate.test.js',
  'tests/node/gameBalanceExpeditionRunner.test.js',
  'tests/node/gameBalanceExpeditionRuntime.test.js',
  'tests/node/gameBalanceExpeditionSkillProbe.test.js',
  'tests/node/i18nextParserConfig.test.js',
  'tests/node/nodeTestDiscovery.test.js',
  'tests/node/parallelism.test.js',
  'tests/node/playwright-screenshot-fixture-validation.test.js',
  'tests/node/skillSync.test.js',
  'tests/node/updateSymbols.test.js',
  'tests/node/vitePwaConfig.test.js'
])

const toolingNodeTestSet = new Set(TOOLING_NODE_TESTS)

/** Returns whether a repository-relative test path belongs to tooling. */
export const isToolingNodeTest = testPath =>
  toolingNodeTestSet.has(testPath.replaceAll('\\', '/'))
