# First-Income Production Cadence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Validate `first-income` against `gap-aligned` on a new, independently seeded 2,000-run cohort without changing any economy value, and adopt it only if every predeclared gate passes.

**Architecture:** Keep cadence resolution in `game-balance-simulation.mjs` as the single source of truth. Add a focused production-validation mode to the existing cadence harness so it compares only the predeclared control and candidate on a dedicated seed namespace, applies the stated acceptance gates, and writes reproducible JSON/Markdown artifacts.

**Tech Stack:** Node.js, TypeScript via `tsx`, `node:test`, pnpm.

---

### Task 1: Predeclare the production validation

**Files:**

- Modify: `tests/node/game-balance-simulation.test.js`
- Modify: `scripts/game-balance-simulation.mjs`

- [ ] Keep `gap-aligned` shipped while the candidate is under validation.
- [ ] Pin the independent `#production-cadence-validation-v2` namespace and the 2,000-run minimum.
- [ ] Treat live `RISK_TARGETS` corridors as non-blocking design diagnostics.

### Task 2: Add the independent production validation

**Files:**

- Modify: `tests/node/game-balance-cadence-probe.test.js`
- Modify: `scripts/game-balance-cadence-probe.mjs`

- [ ] Add tests for a production-validation report that compares `gap-aligned` with `first-income`, uses `#production-cadence-validation-v2`, requires at least 2,000 runs, and fails closed on the stated hard-cap and side-effect criteria.
- [ ] Run the cadence-probe test file and confirm the tests fail because the validation contract is absent.
- [ ] Implement the smallest validation/reporting extension that satisfies those tests; do not change tuning constants or scenario economy inputs.
- [ ] Re-run the cadence-probe test file and confirm it passes.

### Task 3: Verify and publish reproducible evidence

**Files:**

- Modify: `reports/game-balance-cadence-probe-results.json`
- Modify: `reports/game-balance-cadence-probe-analysis.md`

- [ ] Run both affected node test files together.
- [ ] Commit source and tests before generating artifacts.
- [ ] From the clean source commit, run `pnpm run simulate:balance:cadence -- --runs 2000` and confirm metadata reports the source commit with `workingTreeDirty: false`.
- [ ] Review all acceptance-gate outputs; change `SHIPPED_GIG_CADENCE_POLICY` only if every blocking gate passes, then commit generated reports separately.
- [ ] Re-run the affected tests and artifact metadata checks, inspect the final diff, and create the pull request.
