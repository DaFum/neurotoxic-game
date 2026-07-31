# Audited Domain Boundaries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reproduce and fix every verified defect from the ten-finding domain boundary audit.

**Architecture:** Harden existing event, quest, reward, scope, and schema boundaries without changing persisted data models. Add focused node regression coverage before each minimal implementation change.

**Tech Stack:** TypeScript, Node.js 22 `node:test`, pnpm.

---

### Task 1: Event resolution boundaries

**Files:**

- Modify: `src/domain/eventResolver.ts`
- Test: `tests/node/domain/eventResolver.test.js`

- [ ] Add tests proving compatibility sentinels are not persisted, invalid deadline offsets reject quests, and non-boolean game-over values do not end a run.
- [ ] Run `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/domain/eventResolver.test.js` and confirm the new assertions fail for the reported reasons.
- [ ] Dispatch a delta with normalized flags, reject malformed offsets, and use `flags.gameOver === true`.
- [ ] Re-run the focused command and confirm it passes.

### Task 2: Quest admission safety

**Files:**

- Modify: `src/domain/questValidation.ts`
- Modify if required: `src/domain/questHelpers.ts`
- Test: `tests/node/questSystem.test.js`
- Test: `tests/node/questReducer.test.js`

- [ ] Add tests rejecting zero/negative requirements, resolved ad-hoc statuses, and hostile own keys at the top level and in nested quest records.
- [ ] Run the affected files with the repository single-file `node:test` command and confirm the new assertions fail.
- [ ] Require positive thresholds and active status, and recursively reject forbidden own keys at the raw quest boundary.
- [ ] Re-run both focused files and confirm they pass.

### Task 3: Canonical venue scope

**Files:**

- Modify: `src/domain/questAcceptance.ts`
- Modify: `src/domain/questEffects.ts`
- Test: `tests/node/questSystem.test.js`

- [ ] Add tests where `currentGig` is absent and the current GIG node has a distinct node ID and embedded canonical venue ID.
- [ ] Run the focused quest suite and confirm acceptance/reputation assertions fail with the node ID.
- [ ] Resolve the embedded venue ID using the established game-map node shape in both call paths.
- [ ] Re-run the focused suite and confirm it passes.

### Task 4: Reward validation

**Files:**

- Modify: `src/domain/questRewards.ts`
- Test: `tests/node/questSystem.test.js`

- [ ] Add tests that reject social-state property names as follower platforms and reject every supplied `item.add.amount` while preserving amount-less item grants.
- [ ] Run the focused quest suite and confirm the unsafe rewards are currently accepted.
- [ ] Allow only supported follower counter keys and require `item.add.amount` to be absent.
- [ ] Re-run the focused suite and confirm it passes.

### Task 5: Contraband cross-field invariant

**Files:**

- Modify: `src/schemas/contraband.ts`
- Test: `tests/node/contraband.schema.test.js`

- [ ] Add a schema test rejecting non-equipment contraband with `applyOnAdd: true`.
- [ ] Run the focused contraband schema suite and confirm the new assertion fails.
- [ ] Add the non-equipment cross-field rejection while retaining equipment requirements.
- [ ] Re-run the focused suite and confirm it passes.

### Task 6: Generated references and verification

**Files:**

- Modify only generated tracked references produced by repository tooling, if any.

- [ ] Run `pnpm run typecheck:core` and `pnpm run typecheck`.
- [ ] Run `pnpm run symbols:update` followed by `pnpm run symbols:check`.
- [ ] Run `.agents/skills/one-command-quality-gate/scripts/quality-gate.sh`.
- [ ] Run `pnpm run test:all`.
- [ ] Review `git diff --check`, final diff scope, and instruction coverage.
- [ ] Commit with `fix(quests): harden audited domain boundaries` and create the required pull request.
