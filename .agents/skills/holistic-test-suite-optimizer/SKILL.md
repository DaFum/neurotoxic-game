---
name: holistic-test-suite-optimizer
description: 'Use when optimizing or diagnosing the Neurotoxic test suite pipeline: `pnpm run test`, `pnpm run test:all`, node:test, Vitest, Playwright test runs, CI test jobs for test runners, slow/flaky tests, duplicate setup, worker tuning, sharding, OOM crashes, hanging suites, or runtime regressions. Trigger aggressively on test-runner or suite-topology intent.'
compatibility: Node.js 22.13+, pnpm
metadata:
  version: '1.0.0'
  author: 'neurotoxic-project'
  category: 'testing'
  keywords: ['testing', 'performance', 'pipeline', 'vitest', 'playwright', 'node-test']
  maturity: 'beta'
license: 'Proprietary. See LICENSE.txt for terms'
---

# Holistic Test Suite Optimizer

Optimize the test pipeline as a measured system, not as isolated files. The goal is faster, cleaner test execution without hiding failures, mixing runners, or introducing cross-test pollution.

## Baseline Pressure Failures

This skill exists to correct common failure modes in aggressive "optimize everything" prompts:

| Pressure | Bad outcome | Required correction |
| --- | --- | --- |
| "Do not ask, optimize immediately" | Changes worker counts or fixtures without evidence | Measure baseline first and state assumptions |
| "Maximize concurrency" | Runs CPU-saturating suites together and makes them slower | Tune from actual critical path and available cores |
| "Deduplicate all setup" | Hoists mocks that leak between tests | Extract only repeated, compatible setup with teardown |
| "All engines are one flow" | Mixes `node:test`, Vitest, and Playwright imports | Preserve runner ownership and config boundaries |
| "Crush execution time" | Skips verification or hides failures | Re-run the affected suite and report deltas |

## Workflow

1. **Map the pipeline**
   - Read `package.json`, `scripts/run-fast-tests.mjs`, `scripts/run-all-tests.mjs`, `scripts/run-node-tests.mjs`, `scripts/run-vitest-ui.mjs`, `scripts/utils/parallelism.mjs`, relevant `vitest.config*.js`, `playwright.config.*`, and `.github/workflows/test.yml` before changing execution strategy.
   - Confirm the target command before measuring. In this repo, `pnpm run test` is the fast local runner, `pnpm run test:all` excludes Playwright/perf/locale unless the scripts have changed, and Playwright has separate `test:e2e` scripts.
   - Read nested `tests/**/AGENTS.md` files for the suites you will touch.

2. **Measure before changing**
   - Use the smallest command that captures the target bottleneck:

     ```bash
     pnpm run test:node:quick
     pnpm run test:node:heavy
     pnpm run test:vitest:logic
     pnpm run test:ui
     pnpm run test
     pnpm run test:all
     pnpm run test:e2e
     ```

   - Capture wall time, failing tests, worker-related env vars, and OOM/hang symptoms. If the command is too expensive locally, explain the constraint and use the closest targeted runner.

3. **Triage failures before speed work**
   - If the symptom is a failing, flaky, hanging, OOMing, or CI-only suite, read `references/failure-triage-guide.md` before changing runner topology.
   - Keep the failure visible. Narrow to the smallest runner-owned command that reproduces it, then fix lifecycle, fixture, or data pollution before treating worker counts as the cause.
   - Do not use a passing `pnpm run test` result as evidence for a failing `pnpm run test:all`, `test:ui`, `test:e2e`, perf, or locale surface.

4. **Optimize the highest-impact layer first**
   - **Topology**: change suite ordering, overlap, sharding, or worker allocation only when baseline timing shows idle capacity or a critical-path win.
   - **Fixtures**: extract duplicated setup only after finding the same setup pattern in multiple files owned by the same runner.
   - **Lifecycle**: restore mocks, timers, localStorage, DOM, AudioContext, Pixi, and Playwright contexts with `try/finally`, `afterEach`, or `afterAll`.
   - **Data shape**: combine repeated cases into data-driven tests when it reduces setup cost without making failures ambiguous.
   - **Memory**: fix leaks before raising memory limits. Treat `--max-old-space-size` as a last-mile guard, not the first fix.

5. **Preserve engine isolation**
   - `node:test` suites stay on `node:test` and `node:assert`.
   - Vitest suites own `vi`, jsdom, React Testing Library, and Vitest setup files.
   - Playwright suites own browser contexts, `storageState`, routing, screenshots, and E2E sharding.
   - Do not move a test between engines just to make a local optimization look cleaner.

6. **Verify and report**
   - Re-run the changed suite first, then the next broader gate that can catch cross-suite pollution.
   - For shared fixtures or runner scripts, run at least the affected engine plus `pnpm run test:all` when feasible.
   - Report baseline time, post-change time, commands, failures, skipped checks, and remaining risk.

## Quick Reference

| Symptom | First checks | Likely safe action |
| --- | --- | --- |
| Slow `pnpm run test` | `run-fast-tests.mjs`, quick/heavy split, logic timing | Tune fast-runner workers only from measured local cores |
| Slow `test:all` | `run-all-tests.mjs`, worker env, per-suite times | Adjust overlap only if CPU headroom exists |
| Vitest jsdom OOM | `tests/vitest.setup.js`, DOM cleanup, mock resets | Tighten teardown before worker changes |
| Duplicate `vi.mock` setup | Same mock repeated in same runner family | Extract Vitest-only fixture with restore path |
| Slow node suite | heavy test list, `NODE_TEST_CONCURRENCY` | Split quick/heavy or tune node workers |
| Slow E2E startup | Playwright config, auth/menu setup | Use `storageState` or direct scene fixture when valid |
| Flaky async wait | arbitrary sleeps, leaked timers | Replace with condition-based wait and cleanup |
| CI-only failure | CI job log, package script, local matching command | Reproduce with the same runner before touching unrelated suites |
| Hang or OOM | Last emitted test, teardown, worker env, heap symptoms | Fix leaks or isolation before increasing memory/workers |

## Bundled Resources

- Read [references/repo-test-topology.md](references/repo-test-topology.md) when choosing test scope, checking what each package script includes, or changing worker-related behavior.
- Read [references/pipeline-audit-playbook.md](references/pipeline-audit-playbook.md) when changing runner topology, worker counts, CI jobs, suite boundaries, or memory behavior.
- Read [references/failure-triage-guide.md](references/failure-triage-guide.md) when diagnosing failing, flaky, hanging, OOMing, or CI-only test suites before optimizing runtime.
- Use [examples/runner-topology-analysis-example.md](examples/runner-topology-analysis-example.md) when a request asks to speed up `pnpm run test` or `pnpm run test:all` and the right answer may be "measure first, no code change yet."
- Use [examples/test-suite-optimization-report.md](examples/test-suite-optimization-report.md) as the expected reporting shape after an optimization pass.
- Use [examples/fixture-extraction-example.md](examples/fixture-extraction-example.md) when deciding whether duplicated setup should become a shared fixture.
- Use [examples/failure-triage-example.md](examples/failure-triage-example.md) when a prompt mixes speed pressure with a failing or hanging suite.

## Output Contract

Return a concise report:

```text
Test Suite Optimization Report
- Target scope:
- Baseline evidence:
- Change summary:
- Verification:
- Runtime delta:
- Residual risk:
```

If implementation is requested, make surgical changes and include exact commands run. If only analysis is requested, provide a ranked change plan with expected verification commands.

## Example

**Input:** "`pnpm run test:all` is slow. Can you optimize the pipeline?"

**Good response shape:**

1. Inspect `run-all-tests.mjs` and CI to identify actual suite topology.
2. Run or request recent timings for `test:node`, `test:vitest:logic`, and `test:ui`.
3. Identify that `test:vitest:logic` is short and can overlap with `test:node`, while `test:ui` stays sequential on 4-core machines.
4. Change only the runner script or env defaults needed for that measured win.
5. Re-run `pnpm run test:all` and report before/after wall time.

## Red Flags

- Changing worker counts without a timing baseline.
- Hoisting mocks used by both `node:test` and Vitest.
- Adding global fixtures without teardown.
- Treating Playwright as part of `test:all` without checking current scripts.
- Reporting "faster" without command output and wall-time evidence.
- Hiding failed tests behind retries, grep filters, or skipped suites.
- Treating an unreproduced failure as a worker-count problem.
- Comparing timings from different commands, machines, or failure states as if they are a runtime delta.

_Skill sync: compatible with React 19.2.6 / Vite 8.0.14 / Tailwind 4.3.0 baseline as of 2026-06-03._
