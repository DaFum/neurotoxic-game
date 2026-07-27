# Phase 3 Controlled Rebalancing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a paired deterministic experiment harness, select one evidenced bootstrap lever and one evidenced touring lever, and publish validated Phase 3 reports.

**Architecture:** A validated immutable tuning module is threaded explicitly through canonical production and simulation paths. Focused pure utilities own paired statistics and ranking; the orchestration script reuses Phase 2 scenarios/seeds, stages candidates in the required order, and writes compact JSON/Markdown artifacts.

**Tech Stack:** Node.js 22, JavaScript/TypeScript with CheckJS, `node:test`, `tsx`, pnpm, SHA-256 from `node:crypto`.

---

### Task 1: Immutable tuning and paired statistics

**Files:**
- Create: `scripts/game-balance-experiment-config.mjs`
- Create: `scripts/utils/paired-statistics.mjs`
- Create: `tests/node/game-balance-experiments.test.js`

- [ ] Write failing tests for deep immutability, partial overrides, unknown keys,
  range/non-finite rejection, hash sensitivity, known/zero/positive/mixed paired
  deltas, empty populations, deterministic bootstrap intervals, and bankruptcy
  transition semantics.
- [ ] Run the focused node-test command and confirm failures are caused by missing
  modules/exports.
- [ ] Implement the smallest schema-aware resolver, canonical serializer/hash,
  descriptive statistics, paired bootstrap, and transition matrix that satisfy
  those tests without mutating inputs.
- [ ] Re-run the focused node-test command and confirm it passes.

### Task 2: Harness orchestration and control proof

**Files:**
- Create: `scripts/game-balance-experiments.mjs`
- Modify: `scripts/game-balance-simulation.mjs`
- Modify: `package.json`
- Modify: `tests/node/game-balance-experiments.test.js`

- [ ] Add failing tests for same-seed pairing, scenario seed separation, exact run
  counts, compact deltas, control-versus-control zero results, candidate-order
  independence, deterministic reports, ranking hard gates/ties/overcorrection,
  stable gap ordering, safe per-day division, and report metadata integrity.
- [ ] Run the focused suite and verify expected failures.
- [ ] Extend `runSingleSimulation(scenario, seed, tuning)` with a default tuning
  argument; add pure pairing/ranking/gap helpers and the experiment CLI; register
  `simulate:balance:experiments` using `node --import tsx`.
- [ ] Re-run focused tests and syntax checks, then commit the complete harness as
  `feat(simulation): add controlled balance experiments`.

### Task 3: Bootstrap experiments and production selection

**Files:**
- Modify: canonical recurring-obligation helpers identified by symbol/usage trace
- Modify: `scripts/game-balance-experiment-config.mjs`
- Modify: `scripts/game-balance-simulation.mjs`
- Modify: `tests/node/game-balance-experiments.test.js`
- Modify/add: closest existing production economy test file

- [ ] Add failing tests for configured windows, post-window defaults, obligation
  inclusion/exclusion, one-shot grant trigger/expiry/deduplication/ledger/state
  compatibility, and paired bankruptcy recovery.
- [ ] Implement candidates as neutral-default production mechanics and run all
  Phase 3B candidates against original control with identical seeds.
- [ ] Rank against hard limits; if none passes, add only the smallest documented
  follow-up candidate and repeat. Set exactly one evidenced production default.
- [ ] Run focused production and experiment tests; commit as
  `balance: improve bootstrap survivability`.

### Task 4: Gig-gap analysis, touring experiments, and production selection

**Files:**
- Modify: canonical gig-income, recovery, or wear helper selected after experiments
- Modify: `scripts/game-balance-experiment-config.mjs`
- Modify: `scripts/game-balance-experiments.mjs`
- Modify: `scripts/game-balance-simulation.mjs`
- Modify/add: closest existing test for the selected production mechanism
- Modify: `tests/node/game-balance-experiments.test.js`

- [ ] Add failing tests that gaps one through five differ only by interval and
  correctly report daily metrics, plus behavioral tests for every candidate
  family and the eventually selected mechanism.
- [ ] Run neutral and low-resource control gap analyses, then isolated demand,
  stress, and wear candidates against the Phase 3B intermediate control.
- [ ] Rank against late-game, day-20/day-40, bankruptcy, Fame, harmony, drawdown,
  and cross-scenario limits. Set exactly one evidenced production default.
- [ ] Validate the combined selection against original control and commit as
  `balance: reduce late-game economy snowball`.

### Task 5: Clean report generation and deterministic verification

**Files:**
- Create: `reports/game-balance-experiments-results.json`
- Create: `reports/game-balance-experiments-analysis.md`
- Modify: `reports/game-balance-simulation-results.json`
- Modify: `reports/game-balance-simulation-analysis.md`

- [ ] Commit Tasks 1–4 code/tests first so report `sourceBaseCommit` identifies the
  actual production code state; ensure the working tree is clean.
- [ ] Run experiment generation twice, normalize only documented volatile fields,
  hash both normalized outputs, and assert equality.
- [ ] Run normal simulation twice with the same normalized comparison.
- [ ] Run comparison against the unchanged baseline and validate all report
  hashes, counts, finite values, Wilson bounds, KPI transitions, required Markdown
  sections, and absence of `undefined`/`NaN`.
- [ ] Commit only the four report files as
  `docs(simulation): update phase 3 balance reports`.

### Task 6: Full quality gate and publication

**Files:** No planned source changes.

- [ ] Run both `node --check` commands, focused experiment and existing simulation
  tests, `pnpm run typecheck:core`, symbol update/check if required,
  `pnpm run simulate:balance:experiments`, `pnpm run simulate:balance`,
  `pnpm run simulate:balance:compare`, and `pnpm run test:all`.
- [ ] Compare the final baseline SHA-256 with the captured
  `4188d91a4c97ccd68928736c1de1c32fc57fb632804c9d84727bc5932c27abe0`.
- [ ] Read and apply verification/publish skills, verify the five commit boundaries,
  push when a remote is available, and invoke `make_pr` exactly once to create the
  draft PR against `main` with measured results and complete validation evidence.
