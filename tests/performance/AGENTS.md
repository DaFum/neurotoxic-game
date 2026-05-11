# tests/performance - Agent Instructions

## Scope

Applies to `tests/performance/**` and overrides `tests/AGENTS.md` where it conflicts.

## Runner Rules

- Run the suite with `pnpm run test:perf` (uses `vitest.config.perf.js`); it is **not** part of `pnpm run test`, `pnpm run test:ui`, `pnpm run test:node`, or `pnpm run test:all`. `scripts/run-all-tests.mjs` runs only `test:node`, `test:vitest:logic`, and `test:ui`. Perf coverage ships exclusively in `pnpm run test:additional`.
- The perf config globs `*.test.js`, `*.spec.js`, `*.test.jsx`, `*.spec.jsx`. Files ending in `.bench.test.jsx` (e.g. `proceedToTourTime.bench.test.jsx`) are picked up by `test:perf`. Pure-benchmark files (`*.bench.js`, `*.bench.jsx` without `.test`/`.spec`) are run only by their dedicated scripts (e.g. `pnpm run bench:eventEngine`) and are excluded here.
- The `virtual:pwa-register/react` import is aliased to `tests/mocks/virtual-pwa.js` in this config (matching `vitest.config.js` and `vitest.config.node.js`); do not import the real module from perf tests.

## Rules

- Mock Pixi, Tone, and other heavy modules with `vi.hoisted` so imports stay tree-shakeable; never import the real `pixi.js` or `tone` package in this folder.
- Assert against budgets (frame time, allocation counts, render counts), not wall-clock absolutes that vary per machine.
- Keep optimization tests (`*.optimization.test.jsx`) focused on render-count / memoization regressions; put raw throughput numbers in `*.bench.js` instead.
