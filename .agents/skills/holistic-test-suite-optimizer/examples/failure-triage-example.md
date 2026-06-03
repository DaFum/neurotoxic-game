# Example Failure Triage

Use this example when a prompt mixes runtime pressure with a failing, flaky, hanging, OOMing, or CI-only suite.

## Input

```text
CI says Vitest UI timed out and `pnpm run test` is getting slow. Can you bump workers or make the full suite faster?
```

## Good Output

```text
Test Suite Optimization Report
- Target scope: Vitest UI timeout first; runtime optimization is deferred until the failing surface is understood.
- Baseline evidence:
  - `.github/workflows/test.yml`: the failed job maps to `pnpm run test:vitest:ui`.
  - `package.json`: `pnpm run test` only runs the fast local gate (`test:node:quick` + `test:vitest:logic`), so it does not exercise the failing UI suite.
  - `vitest.config.js`: UI tests run in jsdom with `tests/vitest.setup.js`.
  - No local timing delta was measured yet.
- Change summary:
  - No worker-count change yet. A timeout can come from leaked timers, DOM cleanup, open handles, or jsdom fixture pressure; raising workers could make it worse.
  - First reproducer should match CI: `Measure-Command { pnpm run test:vitest:ui }`.
  - If CI names one file, narrow to `pnpm run test:ui:file -- <file>` before touching shared setup.
- Verification:
  - Pending commands:
    - `pnpm run test:vitest:ui`
    - If one file is named: `pnpm run test:ui:file -- <file>`
    - After any shared setup change: `pnpm run test:all`
- Runtime delta:
  - Not measured. A passing `pnpm run test` would not prove this CI timeout is fixed.
- Residual risk:
  - CI-only behavior may depend on Linux paths, Node 22.13, or lower available CPU than local.
  - If the timeout reproduces only in CI, keep the recommendation conditional and cite the CI log lines.
```

## Why This Is Better Than Immediate Worker Tuning

- It maps the failure to the owning runner instead of using the faster local gate as a proxy.
- It keeps correctness visible before speed work.
- It avoids increasing concurrency on a suite that may already be resource-bound.
- It gives exact next commands and names the broader gate needed after shared setup changes.
