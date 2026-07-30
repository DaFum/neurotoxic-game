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
