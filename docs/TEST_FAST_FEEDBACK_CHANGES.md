# Fast Feedback CI/Test Setup (Current State)

This document reflects the **actual** workflow and script split in the repository as of **2026-04-16**.

## 1) Test split and script ownership

- `pnpm run test` invokes the node:test-owned suites through `scripts/run-tests.mjs`.
- `pnpm run test:ui` executes Vitest-owned suites via `scripts/run-vitest-ui.mjs`.
- `pnpm run test:vitest:logic` uses Vitest with `vitest.config.node.js` for logic suites that still live on Vitest rather than node:test.
- `pnpm run test:vitest:node` remains a backward-compatible alias for `test:vitest:logic`.

## 2) Fast-feedback CI workflow

The current CI workflow file is:

- `.github/workflows/test.yml`

It runs jobs in parallel for:

- node:test suites (`pnpm test`)
- Vitest suites (`pnpm test:ui`)
- locale smoke checks (`pnpm test:locale:smoke`)
- locale full checks (`pnpm test:locale:full`)

## 3) Lint/format preview workflow

The current lint preview workflow is:

- `.github/workflows/lint-fix-preview.yml`

It calls `scripts/lint-fix-preview.sh`, which now uses pnpm-compatible commands (`pnpm run`, `pnpm exec`) end-to-end.

## 4) Playwright and E2E

E2E scripts stay split for optional sharding:

- `pnpm run test:e2e`
- `pnpm run test:e2e:shard1`
- `pnpm run test:e2e:shard2`

## 5) Why this split exists

- Keeps quick feedback for core logic/UI tests.
- Preserves heavier/perf/e2e checks for targeted or broader validation stages.
- Avoids mixing runner assumptions (node:test vs Vitest) inside one command path.

## 6) Incremental type-check gate

- `pnpm run typecheck:core` runs strict `checkJs` only for selected high-risk domains via `jsconfig.checkjs.json`.
