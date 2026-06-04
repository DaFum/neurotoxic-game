# Failure Triage Guide

Use this reference when the user reports failing, flaky, hanging, OOMing, or CI-only tests while also asking for optimization. Correctness comes before speed: a faster command that hides or bypasses a failure is a regression.

## Triage Order

1. Identify the failing surface.
   - Read the package script and runner config that own the failure.
   - For CI, map the failed job back to the local package command before changing scripts.
   - Check relevant `tests/**/AGENTS.md` before touching files in that suite.

2. Reproduce with the narrowest runner-owned command.
   - Use a single-file command when one file is named.
   - Use the suite command when the failure depends on worker interaction, shared setup, or order.
   - If local reproduction is not possible, preserve the CI log evidence and keep recommendations conditional.

3. Classify the failure before optimizing.
   - Assertion failure: inspect behavior and fixtures before runner topology.
   - Timeout or hang: inspect async waits, fake timers, open handles, browser contexts, and teardown.
   - OOM: inspect DOM/Pixi/audio cleanup and repeated fixture allocation before raising memory.
   - CI-only: compare Node version, OS path behavior, env vars, install flags, cache assumptions, and worker defaults.

4. Fix the smallest owning layer.
   - Test data bug: patch the affected test or fixture.
   - Shared setup leak: add teardown next to setup in the same runner family.
   - Runner script bug: patch the script only after showing the failure is runner-owned.
   - Resource exhaustion: remove leaks first; treat memory limits and lower workers as guardrails after cleanup.

5. Verify upward.
   - Re-run the reproducer first.
   - Re-run the owning suite.
   - Re-run the broader gate when shared setup or runner behavior changed.

## Symptom Routing

| Symptom                        | First reproducer                                                 | Inspect first                                                      | Avoid                                               |
| ------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------- |
| One `node:test` file fails     | Root single-file `node --test --import tsx ...` command          | `tests/setup.mjs`, `mock.module`, node-owned AGENTS                | Running Vitest for a node-owned file                |
| One Vitest logic file fails    | `pnpm run test:ui:file -- --config vitest.config.node.js <file>` | `vitest.config.node.js`, `vi.mock`, node environment assumptions   | Moving it into `node:test` for convenience          |
| One Vitest UI file fails       | `pnpm run test:ui:file -- <file>`                                | `tests/vitest.setup.js`, jsdom cleanup, localStorage, timers       | Hoisting UI setup into node-owned helpers           |
| Suite hangs after tests finish | Owning suite command                                             | Open handles, fake timers, AudioContext, Pixi, Playwright contexts | Adding retries or grep filters                      |
| OOM or heap growth             | Owning suite command with current worker env                     | DOM cleanup, fixture allocation loops, global caches               | Raising `--max-old-space-size` first                |
| CI-only failure                | Same local package command as CI job                             | Node 22.13 behavior, Linux paths, env vars, install flags          | Treating local `pnpm run test` as proof CI is fixed |
| E2E startup failure            | `pnpm run test:e2e -- <spec>` when possible                      | `playwright.config.js`, Vite webServer, storageState, route mocks  | Assuming E2E is covered by `test:all`               |

## Evidence To Capture

- Command and exact scope.
- Wall time if runtime is part of the claim.
- First failing test or last emitted test before a hang.
- Exit code and whether the command failed, timed out, or was interrupted.
- Worker env vars such as `NODE_TEST_CONCURRENCY`, `VITEST_MAX_WORKERS`, and `NODE_ALL_PARALLEL`.
- CI job name, OS, Node version, and artifact/log path when the problem is CI-only.

## Verification Ladder

| Change type                 | Reproducer                              | Owning suite                                       | Broader gate                               |
| --------------------------- | --------------------------------------- | -------------------------------------------------- | ------------------------------------------ |
| Test-only fixture fix       | affected file                           | owning runner suite                                | broader gate only if shared helper changed |
| Vitest setup change         | affected Vitest file                    | `pnpm run test:ui` or `pnpm run test:vitest:logic` | `pnpm run test:all`                        |
| Node setup or runner change | affected node file or quick/heavy split | `pnpm run test:node`                               | `pnpm run test:all`                        |
| Full runner topology        | `pnpm run test:all` baseline            | `pnpm run test:all` after change                   | CI workflow review or rerun                |
| Playwright fixture/config   | affected spec                           | `pnpm run test:e2e`                                | CI E2E workflow if one exists              |

## Report Language

Use direct status labels:

- `Reproduced`: the failure occurred locally with the named command.
- `Not reproduced`: the matching command passed locally; include the CI or user evidence still needed.
- `Not measured`: no comparable timing exists, so do not claim a runtime delta.
- `Optimization deferred`: correctness failure must be fixed before speed changes are meaningful.

Do not collapse these into "fixed" unless the reproducer and owning suite both pass after the change.
