# Repo Test Topology Reference

Use this reference when choosing test scope, explaining what a package script covers, or changing worker-related behavior. It reflects the current repository scripts as of 2026-06-03; re-check `package.json` and the runner scripts if they have changed.

## Command Map

| Command | Current expansion | Coverage boundary | Notes |
| --- | --- | --- | --- |
| `pnpm run test` | `scripts/run-fast-tests.mjs` | `test:node:quick` + `test:vitest:logic` | Fast local gate. Runs both suites in parallel with split worker defaults. |
| `pnpm run test:fast` | `scripts/run-fast-tests.mjs` | Same as `pnpm run test` | Alias target for the default local test command. |
| `pnpm run test:node` | `scripts/run-node-tests.mjs` | `node:test` suites under node-owned directories | Uses `tsx`, `tests/setup.mjs`, and `--experimental-test-module-mocks`. |
| `pnpm run test:node:quick` | `run-node-tests.mjs --skip-heavy` | Node suite minus known heavy files | Good first check after node fixture or reducer changes that do not touch heavy coverage. |
| `pnpm run test:node:heavy` | `run-node-tests.mjs --only-heavy` | Known heavy node files | Use when changing heavy managers/hooks or the heavy list itself. |
| `pnpm run test:vitest:logic` | `run-vitest-ui.mjs --config vitest.config.node.js` | Vitest node-environment logic/API/data/utils suites | Not jsdom. Kept separate from `node:test` despite sharing a Node environment. |
| `pnpm run test:ui` | `pnpm run test:vitest:ui` | Vitest jsdom UI/integration/hooks/security/utils suites | Uses `vitest.config.js` and `tests/vitest.setup.js`. |
| `pnpm run test:all` | `scripts/run-all-tests.mjs` | `test:node` + `test:vitest:logic` + `test:ui` | Default phase A overlaps node with tiny logic suite; phase B runs UI after node. |
| `NODE_ALL_PARALLEL=1 pnpm run test:all` | `run-all-tests.mjs` fully parallel path | Same as `test:all` | High-core experiment path. Report core count and before/after timings before recommending it. |
| `pnpm run test:additional` | `test:perf` + locale smoke + locale full | Perf and locale validation | Not part of `test:all` unless scripts change. |
| `pnpm run test:e2e` | `playwright test` | Playwright E2E under `e2e/**` | Not part of `test:all`. Uses `playwright.config.js` and starts Vite dev server. |

## Targeted File Commands

Use the runner that already owns the file. A targeted command is valid evidence only for that runner family.

| File family | Command |
| --- | --- |
| `node:test` files under node-owned directories | `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/<file>.test.js` |
| Vitest logic files under `vitest.config.node.js` | `pnpm run test:ui:file -- --config vitest.config.node.js tests/<file>.test.js` |
| Vitest UI/jsdom files | `pnpm run test:ui:file -- tests/<file>.test.js(x)` |
| Playwright specs | `pnpm run test:e2e -- e2e/<file>.spec.js` |

If `run-node-tests.mjs` rejects a path, the file is outside the node runner boundary. Do not force it through `node:test`; use the Vitest command that matches the config include list.

## Worker Knobs

| Knob | Used by | Safe use |
| --- | --- | --- |
| `NODE_TEST_CONCURRENCY` | `run-node-tests.mjs`; defaulted by fast/all runners | Tune only with before/after timing for the same node scope. |
| `VITEST_MAX_WORKERS` | `run-vitest-ui.mjs`; defaulted by fast/all runners | Tune separately for logic and UI because logic is tiny and UI is jsdom-heavy. |
| `NODE_ALL_PARALLEL=1` | `run-all-tests.mjs` | Use as an opt-in measurement on high-core machines; do not make it default from intuition. |

## Boundary Checks

- `test:all` does not include Playwright, perf, locale, lint, or typecheck in the current scripts.
- `pnpm run test` is intentionally smaller than `test:all`; do not report it as full PR coverage.
- CI runs node, Vitest logic, Vitest UI, locale, perf, and typecheck jobs separately. Local `test:all` is not a complete CI mirror.
- The current Tests workflow does not run Playwright E2E; use `test:e2e` or an E2E workflow when the requested surface is browser automation.
- `vitest.config.node.js` excludes `tests/logic/AmpStageController.test.js` because it needs jsdom through the UI config.
- The node runner rejects specific files outside node-owned test directories; use the Vitest file command for Vitest-owned files.

## CI Job Map

| CI job | Local command |
| --- | --- |
| Node.js Tests | `pnpm run test:node` |
| Vitest Logic | `pnpm run test:vitest:logic` |
| Vitest UI | `pnpm run test:vitest:ui` |
| Locale Smoke Tests | `pnpm run test:locale:smoke` |
| Locale Full Tests | `pnpm run test:locale:full` |
| Performance Tests | `pnpm run test:perf` |
| Typecheck | `pnpm run typecheck:core` and `pnpm run typecheck` |
| TS Nocheck Guard | `pnpm run guard:nocheck` |

## Scope Picker

| Change area | Start with | Broaden to |
| --- | --- | --- |
| Node fixture, reducer, or node-owned utility | `pnpm run test:node:quick` or the single node file command from root `AGENTS.md` | `pnpm run test:node`, then `pnpm run test:all` if shared behavior changed |
| Vitest logic helper/config | `pnpm run test:vitest:logic` | `pnpm run test:all` |
| Vitest jsdom setup/helper | `pnpm run test:ui:file -- <file>` | `pnpm run test:ui`, then `pnpm run test:all` if shared setup changed |
| Local fast-runner script | `pnpm run test` | `pnpm run test:all` |
| Full local runner topology | `pnpm run test:all` | CI workflow review or rerun |
| Playwright fixture/config | `pnpm run test:e2e -- <spec>` | `pnpm run test:e2e` |
| Perf/locale gate | matching `test:perf`, `test:locale:smoke`, or `test:locale:full` | `pnpm run test:additional` |
