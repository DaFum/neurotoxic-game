# Fast Feedback CI/CD Test Changes

## 1. Faster Standard Vitest Execution
* Removed `tests/performance/**/*.test.js` and `tests/performance/**/*.spec.js` from the default `test:ui` target in `vitest.config.js`.

## 2. Test Targets Added to `package.json`
* `test:fast` - Runs regular Node and UI tests without performance/long tests.
* `test:perf` - Runs only performance tests via Vitest.
* `test:locale:smoke` - Runs quick structural checks for language locales.
* `test:locale:full` - Runs full logic and validation checks on translated text.
* `test:e2e:shard1` & `test:e2e:shard2` - Runs Playwright tests with sharding.

## 3. Locale Tests Refactored
* Extracted generic locale file parsing to `tests/utils/localeTestUtils.js` to enable caching of large JSON structures in memory across tests.
* Separated basic logic validation into `tests/locale/smoke.test.js` to provide immediate PR feedback on translations.
* Moved deep comparison and formatting tests into `tests/locale/full.test.js` to ensure the release pipeline is rigorous.

## 4. `GigIntegration.test.jsx` Refactored
* Extracted the massive Tone.js mock object into a reusable helper at `tests/mocks/toneMock.js`.

## 5. Playwright Optimizations
* `fullyParallel` is automatically enabled on CI for concurrent test files.
* Test runners scale to 2 workers natively on CI platforms instead of 1.
* Tracing is set to `on-first-retry` rather than `retain-on-failure` to lower test execution memory and space constraints.
* The `blob` reporter is enabled during CI execution to assist in cross-container trace collection.
* E2E tests are configured to use native Playwright sharding using the `test:e2e:shard1` and `test:e2e:shard2` commands.

## 6. GitHub Actions Enhancements
* Refactored `.github/workflows/test.yml` into logical, decoupled test execution steps with `pnpm` caching utilized cleanly.
* Parallelized Locale Smoke and Playwright execution with Vitest and Node tests to accelerate pipeline resolution.
* Included the Blob report output from Playwright shards for debugging.
