# Fast Feedback CI/Test Setup (Current State)

This document reflects the **actual** workflow and script split in the repository as of **2026-04-16**.

## 1) Test split and script ownership

- `pnpm run test` runs the node:test-owned suites via `scripts/run-tests.mjs`.
- `pnpm run test:ui` runs Vitest-owned suites via `scripts/run-vitest-ui.mjs`.
- `pnpm run test:vitest:logic` runs Vitest with `vitest.config.node.js` (logic suites that still use Vitest instead of node:test).
- `pnpm run test:vitest:node` is kept as a backward-compatible alias to `test:vitest:logic`.

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
