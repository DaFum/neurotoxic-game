# Example Runner Topology Analysis

Use this example when a request asks to speed up `pnpm run test` or `pnpm run test:all`, and the current evidence may support a plan rather than an immediate code change.

## Input

```text
`pnpm run test:all` is slow. Please optimize the runner.
```

## Good Output

```text
Test Suite Optimization Report
- Target scope: `pnpm run test:all` local runner topology.
- Baseline evidence:
  - `package.json`: `test:all` runs `scripts/run-all-tests.mjs`.
  - `run-all-tests.mjs`: default phase A runs `test:node` plus `test:vitest:logic`; phase B runs `test:ui` sequentially.
  - `test:e2e`, `test:additional`, lint, and typecheck are not part of local `test:all`.
  - No fresh wall-time measurement was run yet, so I cannot claim a runtime delta.
- Change summary:
  - No code change yet. The runner already contains the main safe overlap: tiny Vitest logic runs beside node tests.
  - The only plausible topology experiment is measuring `NODE_ALL_PARALLEL=1 pnpm run test:all` on a high-core machine and comparing it with the default path.
- Verification:
  - Proposed commands:
    - `Measure-Command { pnpm run test:all }`
    - `Measure-Command { $env:NODE_ALL_PARALLEL='1'; pnpm run test:all; Remove-Item Env:\NODE_ALL_PARALLEL }`
- Runtime delta:
  - Not measured yet.
- Residual risk:
  - Fully parallel node + UI can be slower on 4-core machines because both suites are CPU-heavy.
  - Any default topology change should be tied to same-machine before/after timings.
```

## Why This Is Better Than an Immediate Patch

- It recognizes the existing measured topology instead of rediscovering it as a new feature.
- It separates local `test:all` from Playwright, perf, locale, lint, and typecheck coverage.
- It gives an exact experiment for the one remaining concurrency knob without making it the default.
- It refuses to report a speedup until comparable timings exist.
