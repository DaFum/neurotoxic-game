# Balance Gate and Save Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make saves containing regional gig history load safely and make balance production selection depend on a complete successful combined validation.

**Architecture:** Keep the current harness structure, add a shared canonical Fame/Gig calculation to the simulation module, and make final combination evaluation the only production-selection boundary. Extend existing validation/sanitization rather than adding parallel persistence abstractions.

**Tech Stack:** TypeScript, Node.js ESM, `node:test`, pnpm.

---

### Task 1: Save roundtrip and regional history validation

**Files:** `src/utils/saveValidator.ts`, `src/context/reducers/sanitizers/stateSanitizers.ts`, `src/context/usePersistence.ts`, `tests/node/saveValidator.test.js`

- [ ] Add failing validation and full persist/parse/validate/sanitize/load tests.
- [ ] Run the single Node test file and confirm the expected rejection.
- [ ] Add bounded record/key/day validation and expose the existing persisted-state builder for the integration seam.
- [ ] Re-run the single test file and confirm it passes.

### Task 2: Canonical KPI and complete final gate

**Files:** `scripts/game-balance-simulation.mjs`, `scripts/game-balance-experiments.mjs`, `tests/node/game-balance-experiments.test.js`

- [ ] Add failing tests for run-ratio Fame/Gig, absent/duplicate scenarios, KPI-target coverage, and non-KPI statuses.
- [ ] Export and reuse `calculateAverageFameEarnedPerGig` and return structured `not_evaluated` statuses.
- [ ] Derive required scenario checks from `SCENARIOS` and `KPI_TARGETS`; attach `scenarioValidation` to each result.
- [ ] Re-run focused experiment tests.

### Task 3: Complete combination search and safe reporting

**Files:** `scripts/game-balance-experiments.mjs`, `scripts/utils/balance-report-metadata.mjs`, `tests/node/game-balance-experiments.test.js`

- [ ] Add failing tests for deterministic least-invasive accepted-combination ranking, exact runtime counting, canonical report suppression, and Markdown scenario status.
- [ ] Evaluate the Cartesian product of accepted phase candidates across all scenarios and select only a final-gate-passing combination.
- [ ] Count every runner invocation, render `scenarioValidation.passed`, gate canonical writes, and extend hash inputs.
- [ ] Re-run focused tests.

### Task 4: Select production tuning and verify

**Files:** `src/utils/balanceTuning.ts`, `reports/game-balance-experiments-results.json`, `reports/game-balance-experiments-analysis.md`

- [ ] Run the complete experiment suite and identify the least-invasive fully passing combination.
- [ ] Update production defaults to that combination and regenerate reports from the final code state.
- [ ] Run symbol checks, focused tests, type checks, full PR tests, lint, and build.
- [ ] Review the diff for scope and durable AGENTS.md guidance.
- [ ] Commit with `fix(balance): require complete candidate validation` and create the pull request.
