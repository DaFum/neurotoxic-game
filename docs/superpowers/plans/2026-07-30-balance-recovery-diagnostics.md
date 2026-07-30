# Balance Recovery and Diagnostics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct misleading simulator diagnostics, expose event and quest coverage honestly, and add a four-candidate paid harmony-recovery experiment family.

**Architecture:** Keep the production game untouched and extend the existing balance harness at its established tuning, counter, aggregation, and report seams. Model recovery as experiment-only tuning, model trigger opportunities separately from resolved events, and mark the unexecuted quest lifecycle as insufficient evidence rather than inventing player behaviour.

**Tech Stack:** Node.js 22, ESM JavaScript, `node:test`, TypeScript-backed canonical game modules, pnpm.

---

### Task 1: Correct diagnostic contracts

**Files:**

- Modify: `tests/node/game-balance-simulation.test.js`
- Modify: `scripts/game-balance-simulation.mjs`

- [ ] **Step 1: Write failing tests for dimensional and horizon-correct insights**

Add assertions that scenario insights never recommend comparing van euro costs to Fame, minigame insight classifies the reachable per-trip/per-gig ratio rather than totals above 40, and event insight returns `insufficient_evidence` when runtime coverage is partial.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/game-balance-simulation.test.js`

Expected: FAIL because the old minigame thresholds are unreachable and partial event counters still claim low density.

- [ ] **Step 3: Implement minimal exported diagnostic builders**

Replace absolute minigame thresholds with completion/opportunity ratios, make event insight consume a coverage status plus resolved-event rate, and delete or rewrite any dimensionally invalid van/Fame comparison.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run the command from Step 2. Expected: PASS.

### Task 2: Instrument event and quest coverage

**Files:**

- Modify: `tests/node/game-balance-simulation.test.js`
- Modify: `scripts/game-balance-simulation.mjs`

- [ ] **Step 1: Write failing coverage tests**

Assert that every completed trip contributes a travel trigger opportunity, every performed gig contributes pre-gig, gig-intro, gig-mid, and post-gig opportunities, resolved counters remain separate, and quest coverage reports registry inventory but zero lifecycle execution with `insufficient_evidence`.

- [ ] **Step 2: Run the focused test and verify RED**

Run the Task 1 test command. Expected: FAIL because event opportunities and quest lifecycle coverage do not exist.

- [ ] **Step 3: Add minimal counters and aggregation**

Add `eventTriggers` execution coverage with evaluation/activation counts by runtime trigger family. Add `quests` coverage fields for offers, activations, progress, completions, failures, and rewards; leave them at zero and publish `status: 'insufficient_evidence'` while the lifecycle is unmodelled. Include both in per-run results, summary aggregation, and the report narrative.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run the Task 1 test command. Expected: PASS.

### Task 3: Add paid harmony-recovery candidates

**Files:**

- Modify: `tests/node/game-balance-experiments.test.js`
- Modify: `tests/node/game-balance-simulation.test.js`
- Modify: `src/utils/balanceTuning.ts`
- Modify: `scripts/game-balance-experiment-config.mjs`
- Modify: `scripts/game-balance-simulation.mjs`

- [ ] **Step 1: Write failing candidate and accounting tests**

Assert that the experiment registry contains control plus thresholds 40/45 for `day` and `money`, that money recovery uses `CLINIC_CONFIG.HEAL_BASE_COST_MONEY`, and that recovery counters distinguish evaluations, activations, harmony restored, money spent, days consumed, and gig opportunities forgone.

- [ ] **Step 2: Run both focused tests and verify RED**

Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/game-balance-simulation.test.js tests/node/game-balance-experiments.test.js`

Expected: FAIL because the tuning and candidate family do not exist.

- [ ] **Step 3: Extend the typed experiment tuning**

Add neutral defaults for `harmonyRecoveryThreshold`, `harmonyRecoveryCostType`, `harmonyRecoveryMoneyCost`, and `harmonyRecoveryGain`. Values remain inert unless a recovery candidate supplies them.

- [ ] **Step 4: Register the four candidates**

Create candidates `harmony-recovery-{40,45}-{day,money}` plus `harmony-recovery-none`, scoped to the low-harmony scenarios. Money candidates source their cost from `CLINIC_CONFIG.HEAL_BASE_COST_MONEY`; day candidates consume the current day before route planning.

- [ ] **Step 5: Implement recovery decision and accounting**

Evaluate once per day after the daily tick. When harmony is below threshold and the cost is payable, restore the configured harmony with the canonical clamp. Money candidates deduct and attribute the cost; day candidates increment days consumed and gigs forgone and skip travel. Return all counters in each run and aggregate them into scenario summaries.

- [ ] **Step 6: Run both focused tests and verify GREEN**

Run the command from Step 2. Expected: PASS.

- [ ] **Step 7: Regenerate and verify the symbol index**

Run: `pnpm run symbols:update && pnpm run symbols:check`

Expected: PASS, because `src/utils/balanceTuning.ts` is an exported source API.

### Task 4: Final targeted verification and delivery

**Files:**

- Review all modified files.

- [ ] **Step 1: Run formatting/diff checks**

Run: `git diff --check`

Expected: PASS with no output.

- [ ] **Step 2: Run only affected tests**

Run the two-file node command from Task 3. Expected: PASS.

- [ ] **Step 3: Run the scoped type gate**

Run: `pnpm run typecheck:core`

Expected: PASS.

- [ ] **Step 4: Check durable instructions**

Review whether the event/quest coverage distinction is non-obvious, repository-specific, and likely to prevent recurrence. Add a concise root `AGENTS.md` note only if the implementation establishes a durable invariant not already captured by the existing simulator rules.

- [ ] **Step 5: Commit implementation**

Run:

```bash
git add scripts/game-balance-experiment-config.mjs scripts/game-balance-simulation.mjs src/utils/balanceTuning.ts tests/node/game-balance-experiments.test.js tests/node/game-balance-simulation.test.js AGENTS.md
git commit -m "feat(balance): simulate paid harmony recovery"
```

- [ ] **Step 6: Create the pull request**

Create a PR titled `feat(balance): simulate paid harmony recovery` with a body summarising recovery candidates, corrected diagnostics, event/quest coverage findings, and focused verification.
