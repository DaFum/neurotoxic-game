# Expedition Career Policy Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make fresh-Career and release-corridor evidence faithfully exercise persona policies, production meta prerequisites, and existing cashflow observations.

**Architecture:** Keep the balance harness as an orchestrator of existing production reducers and registries. Add declarative persona meta choices to profiles, derive each meta purchase from the first missing required capability set, and expose explicit outcome corridors plus aggregated cashflow in the generated report.

**Tech Stack:** Node.js ESM, TypeScript production modules imported through `tsx`, `node:test`, pnpm.

---

### Task 1: Fresh-Career sponsor and Between-Tour persona policy

**Files:**

- Modify: `scripts/game-balance-expedition-profiles.mjs`
- Modify: `scripts/game-balance-expedition-career.mjs`
- Test: `tests/node/gameBalanceExpeditionCareer.test.js`

- [ ] Add tests proving a fresh prepared run stages real Sponsor offers and selects them through the profile Sponsor policy, and proving declarative persona choices can select `develop_signature`, `confront`, and `keep_relationship` when offered.
- [ ] Run `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/gameBalanceExpeditionCareer.test.js` and confirm the new assertions fail for the missing policy behavior.
- [ ] Add a validated `betweenTourMetaPolicy` profile field, reuse the existing `pickSponsorOffer`, dispatch `PREPARE_EXPEDITION_SPONSOR_OFFERS` before validation, and choose the first offered option from the persona's declared preference order.
- [ ] Re-run the focused Career test and confirm it passes.

### Task 2: Capability-prerequisite meta purchase

**Files:**

- Modify: `scripts/game-balance-expedition-career.mjs`
- Test: `tests/node/gameBalanceExpeditionCareer.test.js`

- [ ] Add a test fixture with exactly two Tour Tokens whose first missing required set needs a level-1 facility, and assert that facility is purchased while a lexically earlier irrelevant facility remains level zero.
- [ ] Run the focused Career test and confirm it fails because the current loop requires three tokens and walks all facilities.
- [ ] Derive the target from the first missing `requiredCapabilitySetId`, read its `requiredFacility`, use `getExpeditionHqFacilityLevelCost()`, and buy only missing prerequisite levels before attempting that set.
- [ ] Re-run the focused Career test and confirm it passes.

### Task 3: Machine-readable outcome-mix corridors

**Files:**

- Modify: `scripts/game-balance-expedition-runner.mjs`
- Test: `tests/node/gameBalanceExpeditionReleaseGate.test.js`

- [ ] Add tests proving 97% Extraction produces a corridor finding in both cohorts and a profile below the declared Failure corridor also produces findings.
- [ ] Run the focused release-gate test and confirm both tests fail against the exact-100%-completion special case.
- [ ] Export explicit completion, extraction, and failure rate corridors and evaluate every rate for every profile in Calibration and Holdout without changing dominance correctness semantics.
- [ ] Re-run the focused release-gate test and confirm it passes.

### Task 4: Export fresh-Career cashflow aggregates

**Files:**

- Modify: `scripts/game-balance-expedition.mjs`
- Test: `tests/node/gameBalanceExpeditionCareer.test.js`

- [ ] Add a test for deterministic per-run aggregation of existing `cashflowByRun` entries, including prep, repair, in-run, settlement, ending cash, next-run cost, and halted count.
- [ ] Run the focused Career test and confirm the aggregate helper is absent.
- [ ] Implement and export the minimal aggregate helper, then include Calibration and Holdout aggregates in the report's fresh-Career section.
- [ ] Re-run the focused Career test and confirm it passes.

### Task 5: Verification and delivery

**Files:**

- Verify all modified files.

- [ ] Run the focused Career, runner, and release-gate tests.
- [ ] Run `pnpm run typecheck:core`.
- [ ] Run `pnpm run deadcode:check`.
- [ ] Run the applicable full quality gate and regenerate the Expedition report only if all prerequisite checks pass and runtime is practical.
- [ ] Review the diff for surgical scope and determine whether any durable non-obvious instruction belongs in a scoped `AGENTS.md`; do not edit instructions unless genuinely needed.
- [ ] Commit with `fix(expedition): align career evidence with persona policies` and create a pull request describing the policy fidelity, corridor enforcement, cashflow evidence, and verification results.
