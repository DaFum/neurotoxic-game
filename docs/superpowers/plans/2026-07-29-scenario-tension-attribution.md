# Scenario Tension and Loss Attribution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and run the evidence-first Phase 6A-7 balance pipeline without speculative production changes.

**Architecture:** Extend the canonical simulation run with call-boundary diagnostic observers, aggregate the diagnostics in focused pure helpers, and publish selection-free tension/progression reports. Reuse the existing experiment gates for any evidence-supported candidate; fail closed to a no-op when evidence or safety is insufficient.

**Tech Stack:** Node.js ESM, `node:test`, TypeScript-through-`tsx`, pnpm, Markdown/JSON balance artifacts.

---

### Task 1: Diagnostic contracts and aggregation

**Files:**

- Modify: `tests/node/game-balance-simulation.test.js`
- Modify: `scripts/game-balance-simulation.mjs`

- [ ] Add failing tests asserting that `SCENARIO_TENSION_TARGETS` covers every warning scenario, metrics retain insufficient-evidence states, and summaries expose pre/post-gig bankruptcy, threshold-day, drawdown, finale, solvent-P10, and support-use fields.
- [ ] Run the single simulation test file and confirm failure is caused by missing diagnostic exports/fields.
- [ ] Implement the minimal non-blocking contract and aggregation fields.
- [ ] Re-run the single test file and confirm it passes.

### Task 2: Post-first-gig loss attribution

**Files:**

- Modify: `tests/node/game-balance-simulation.test.js`
- Modify: `scripts/game-balance-simulation.mjs`

- [ ] Add failing tests for the fixed loss-source vocabulary, post-first-gig boundary, negative-only accumulation, material-drawdown source, bankruptcy predecessor, and total/median/P90 aggregation.
- [ ] Run the single simulation test file and confirm the expected failures.
- [ ] Add a per-run observer at existing money-moving call boundaries and aggregate its output without altering production mechanics.
- [ ] Re-run the single test file and confirm it passes.

### Task 3: Selection-free attribution cohorts and Scandal diagnostic

**Files:**

- Create: `scripts/game-balance-tension-report.mjs`
- Create: `tests/node/game-balance-tension-report.test.js`
- Modify: `package.json`

- [ ] Add failing tests for exact calibration/holdout namespace labels, 2,000-run minimum, absence of candidate selection, and controversy profiles 0/50/65/80.
- [ ] Run the new test file and confirm missing-module failure.
- [ ] Implement the report builder and CLI using canonical simulation exports; pin the new pnpm script without adding dependencies.
- [ ] Re-run the new test file and confirm it passes.

### Task 4: Runtime first-gig parity

**Files:**

- Modify the closest existing travel/arrival integration test selected after tracing the production handler.

- [ ] Add a failing regression assertion showing that a reachable playable first venue has no prior-gig prerequisite.
- [ ] Run only that test file and confirm the assertion exercises the production path.
- [ ] If the assertion exposes a runtime guard, remove only that guard; otherwise retain the test-only parity proof.
- [ ] Re-run the focused integration test.

### Task 5: Phase 6B-6D diagnostic decisions

**Files:**

- Modify: `scripts/game-balance-tension-report.mjs`
- Modify: `tests/node/game-balance-tension-report.test.js`

- [ ] Add failing tests that candidate families are declared one at a time, validation runs once after selection, and insufficient evidence returns a no-production-recommendation outcome.
- [ ] Implement Chaos family derivation, Scandal profile decision, Bootstrap contract review, and Festival observation as report decisions.
- [ ] Run the focused report and experiment tests.
- [ ] Apply a production value only if a candidate passes every declared gate; otherwise publish the explicit no-op decision.

### Task 6: Phase 7 progression diagnostics

**Files:**

- Modify: `scripts/game-balance-simulation.mjs`
- Modify: `scripts/game-balance-tension-report.mjs`
- Modify: `tests/node/game-balance-simulation.test.js`
- Modify: `tests/node/game-balance-tension-report.test.js`

- [ ] Add failing tests for purchase timing/count/coverage, post-purchase money, liquidity skips, unallocated ending money, and payback evidence.
- [ ] Add minimal observation at canonical purchase call sites and aggregate the fields.
- [ ] Add the fail-closed progression decision and run both focused tests.
- [ ] Apply one progression family only if evidence and safety gates pass; otherwise preserve production values.

### Task 7: Verification, source commit, artifacts, and PR

**Files:**

- Modify generated balance artifact paths emitted by the new report command.

- [ ] Run only the affected Node/UI tests plus any required symbol check.
- [ ] Review `git diff --check`, source metadata coverage, and the durable-instruction question.
- [ ] Commit source with `feat(balance): add scenario tension attribution`.
- [ ] From the clean source commit, generate both 2,000-run cohorts and commit reports with `docs(balance): publish phase 6 and 7 diagnostics`.
- [ ] Create the required pull request with title `Phase 6A-7 - Attribute tension and validate tuning` and a body separating diagnostic findings, accepted/rejected candidates, tests, and CI-only full-suite coverage.
