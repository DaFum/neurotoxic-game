# tests/performance - Agent Instructions

## Scope

Applies to `tests/performance/**` and overrides `tests/AGENTS.md` where it conflicts.

## Runner Rules

- Run the suite with `pnpm run test:perf` (uses `vitest.config.perf.js`); it is not part of `pnpm run test` and only ships in `pnpm run test:additional` / `pnpm run test:all`.
- The perf config only globs `*.test.js`, `*.spec.js`, `*.test.jsx`, `*.spec.jsx`. Bench-only files (`*.bench.js`, `*.bench.test.jsx`) are run by their own scripts (e.g. `pnpm run bench:eventEngine`); do not rename to force inclusion.
- The `virtual:pwa-register/react` import is aliased to `tests/mocks/virtual-pwa.js` here only; do not import the real module in perf tests.

## Rules

- Mock Pixi, Tone, and other heavy modules with `vi.hoisted` so imports stay tree-shakeable; never import the real `pixi.js` or `tone` package in this folder.
- Assert against budgets (frame time, allocation counts, render counts), not wall-clock absolutes that vary per machine.
- Keep optimization tests (`*.optimization.test.jsx`) focused on render-count / memoization regressions; put raw throughput numbers in `*.bench.js` instead.
