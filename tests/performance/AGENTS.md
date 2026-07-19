# tests/performance - Agent Instructions

- Run with `pnpm run test:perf` (uses `vitest.config.perf.js`). It is **not** part of `pnpm run test`, `test:ui`, `test:node`, or `test:all`; `scripts/run-all-tests.mjs` runs only `test:node`, `test:vitest:logic`, and `test:ui`. Perf ships exclusively in `pnpm run test:additional`.
- Perf config globs `*.test.js`, `*.spec.js`, `*.test.jsx`, `*.spec.jsx`. Files ending in `.bench.test.jsx` (e.g. `proceedToTourTime.bench.test.jsx`) are picked up. Pure-benchmark files (`*.bench.js`, `*.bench.jsx` without `.test`/`.spec`) run only via dedicated scripts (e.g. `pnpm run bench:eventEngine`) and are excluded here.
- The `virtual:pwa-register/react` import is aliased to `tests/mocks/virtual-pwa.js`; do not import the real module from perf tests.
- Mock Pixi, Tone, and other heavy modules with `vi.hoisted`; never import the real `pixi.js` or `tone` package in this folder.
- When a perf test mocks `motion/react` for a component that imports `useReducedMotion`, include `useReducedMotion: () => false` alongside the `motion.*` stubs.
- Assert against budgets (frame time, allocation counts, render counts), not wall-clock absolutes that vary per machine.
- Put raw throughput numbers in `*.bench.js`; keep `*.optimization.test.jsx` focused on render-count / memoization regressions.
