# Pipeline Audit Playbook

Use this reference for test-suite optimization work that goes beyond a single failing test file. Keep the main skill loaded first; read this file only when you need deeper runner, fixture, CI, or memory guidance.

If the current symptom is a failing, flaky, hanging, OOMing, or CI-only suite, read `references/failure-triage-guide.md` first. This playbook assumes the failing surface is understood or the request is primarily about topology/runtime.

## Context Map

Start by reading the files that define the current test topology:

| Area | Files |
| --- | --- |
| Package scripts | `package.json` |
| Fast local runner | `scripts/run-fast-tests.mjs` |
| Local full runner | `scripts/run-all-tests.mjs` |
| Node runner | `scripts/run-node-tests.mjs`, `scripts/utils/parallelism.mjs` |
| Vitest runner | `scripts/run-vitest-ui.mjs`, `vitest.config.js`, `vitest.config.node.js`, `vitest.config.perf.js` |
| Playwright runner | `playwright.config.js`, `e2e/**` |
| CI topology | `.github/workflows/test.yml` |
| Suite scope rules | relevant `tests/**/AGENTS.md` files |

For the current repo command map, read `references/repo-test-topology.md`. Do not assume Playwright, locale, or perf tests are part of `pnpm run test:all`; confirm the package scripts first.

## Measurement Checklist

Capture enough evidence to know which layer is slow:

```powershell
Measure-Command { pnpm run test }
Measure-Command { pnpm run test:node:quick }
Measure-Command { pnpm run test:node:heavy }
Measure-Command { pnpm run test:vitest:logic }
Measure-Command { pnpm run test:ui }
Measure-Command { pnpm run test:all }
```

Add `Measure-Command { pnpm run test:additional }` or `Measure-Command { pnpm run test:e2e }` only when the target includes perf/locale or Playwright coverage.

For CI-only questions, compare job durations in `.github/workflows/test.yml` with the latest Actions run if available. If live CI data is unavailable, state that and keep recommendations conditional.

Record:

- command
- wall time
- worker-related environment variables
- failure count and first failure
- OOM, timeout, retry, or hang symptoms
- CPU-core assumption if changing concurrency

## False Delta Checks

Before claiming a speedup, confirm the before/after runs are comparable:

- Same package command.
- Same machine or CI runner class.
- Same worker-related environment variables unless the env var is the intended experiment.
- Same pass/fail state. A failing run that exits early is not a faster passing suite.
- Same dependency install state; do not compare cold install plus tests against warm tests only.

## Decision Rules

| Finding | Prefer | Avoid |
| --- | --- | --- |
| `run-all-tests.mjs` already overlaps a tiny suite with a heavy suite | Preserve the existing phase split unless new timings show a better critical path | Replacing the measured topology because "more parallel" sounds faster |
| A short suite runs while CPU is mostly idle | Overlap it with a longer suite | Fully parallelizing all suites by default |
| Two CPU-heavy suites contend | Sequential execution with full workers | Worker counts that slow both suites |
| Repeated setup exists inside one runner family | Shared helper with teardown | Cross-runner fixture imports |
| OOM or heap growth appears | Find leaked DOM, timers, mocks, Pixi objects, or AudioContext state | Raising memory limits before cleanup |
| CI installs dependencies in every job | Existing cache and deterministic install review | Unpinned dependency/tool upgrades |
| Playwright repeats login or menu setup | `storageState` or direct scene bootstrap when behavior allows | Skipping user-flow coverage that the test is meant to verify |

## Runner Boundaries

- `node:test`: keep imports to `node:test`, `node:assert`, and existing node-runner setup.
- Vitest: keep `vi`, jsdom, React Testing Library, and component setup in Vitest-owned files.
- Playwright: keep browser contexts, route mocks, screenshots, and storage state in Playwright-owned fixtures.
- Perf/locale/additional tests: treat `test:additional` as a separate validation surface unless the package scripts have been changed to fold it into another gate.

Moving tests between runners is a behavior change. Treat it like a refactor with before/after verification.

## Verification Matrix

| Change | Minimum verification | Broader gate when feasible |
| --- | --- | --- |
| `run-all-tests.mjs` topology | `pnpm run test:all` | CI test workflow |
| Node runner or node fixture | `pnpm run test:node:quick` and affected file | `pnpm run test:node` |
| Heavy node list | `pnpm run test:node:heavy` | `pnpm run test:all` |
| Vitest setup/helper | affected `pnpm run test:ui:file -- ...` or config-specific run | `pnpm run test:ui` |
| Vitest logic config | `pnpm run test:vitest:logic` | `pnpm run test:all` |
| Playwright fixture | affected `pnpm run test:e2e -- ...` | `pnpm run test:e2e` |
| CI YAML | YAML inspection plus local equivalent command | Actions rerun |

If a broader gate is too expensive, say why and list the exact command that remains.

## Optimization Report Fields

Always include:

- target scope
- baseline evidence
- change summary
- verification command output summary
- runtime delta or reason no runtime delta was measured
- residual risk

Do not report "faster" unless the before/after commands are comparable.
