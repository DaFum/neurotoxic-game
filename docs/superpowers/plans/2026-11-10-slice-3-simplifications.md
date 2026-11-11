# Slice 3: Domain Decoupling & Structural Ownership Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decouple domain models, remove redundant global reducer state, optimize hot-path lookup algorithms, and streamline subsystem boundaries across the Neurotoxic codebase.

**Architecture:** Implement all 20 verified recommendations from Slice 3 of `simplification-audit-report.md`. Tasks are structured in 4 cohesive phases:

1. Domain & Routing Decoupling (Tasks 1–5: cash floor, events registry, map adjacency, highway layout, loan model)
2. Reducer & State Invariant Streamlining (Tasks 6–10: expedition policies, pending gig settlements, pendingBandHQOpen, milestones, gig quest deduplication)
3. Data Models, Storage & Backend (Tasks 11–14: unlock durability, safe storage execution, redis deadline, contraband schemas)
4. UI & Audio Structural Ownership (Tasks 15–20: clinic actions, HUD pedal decoupling, post-gig snapshot, social economy, audio service casing, roadie continuation)

**Tech Stack:** TypeScript (strict CheckJS, zero `@ts-ignore`, zero `any`), React 19, Vitest (node, ui), Node.js `node:test` runner.

---

### Task 1: Protected Cash Floor Enforcement in `spendableCash.ts` (`SUB-03-REC-01`)

**Files:**

- Modify: `src/domain/expedition/spendableCash.ts:1-70`
- Modify: `src/domain/expedition/loadout.ts:850-960`
- Modify: `src/context/gameReducer.ts:105-115, 520-530`
- Modify: `src/context/reducers/pendingGigSettlementReducer.ts:30-40, 350-360`
- Test: `tests/node/expeditionDayPolicy.test.js`
- Test: `tests/node/expeditionSpendableCashPredicate.test.js`

- [ ] **Step 1: Verify current tests pass**
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionSpendableCashPredicate.test.js tests/node/expeditionDayPolicy.test.js`
      Expected: PASS

- [ ] **Step 2: Relocate cash floor functions into `spendableCash.ts`**
      Move `enforceExpeditionCashFloor`, `capExpeditionSpendAtCashFloor`, `getExpeditionDayPolicy`, and `settleExpeditionDailyObligation` from `src/domain/expedition/loadout.ts` into `src/domain/expedition/spendableCash.ts`.
      In `src/domain/expedition/loadout.ts`, re-export them:

```ts
export {
  enforceExpeditionCashFloor,
  capExpeditionSpendAtCashFloor,
  getExpeditionDayPolicy,
  settleExpeditionDailyObligation
} from './spendableCash'
```

- [ ] **Step 3: Update `gameReducer.ts` and `pendingGigSettlementReducer.ts` imports**
      In `gameReducer.ts`, import `enforceExpeditionCashFloor` from `../domain/expedition/spendableCash` instead of `loadout.ts`. In `pendingGigSettlementReducer.ts`, import it from `../../domain/expedition/spendableCash`.

- [ ] **Step 4: Run tests and typecheck**
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionSpendableCashPredicate.test.js tests/node/expeditionDayPolicy.test.js`
      Run: `pnpm run typecheck:core`
      Expected: PASS

- [ ] **Step 5: Commit changes**
      `git commit -m "refactor(expedition): relocate cash floor guards into spendableCash (SUB-03-REC-01)"`

---

### Task 2: Canonical Event-by-ID Registry Index in `src/data/events/index.ts` (`SUB-04-REC-02`)

**Files:**

- Modify: `src/data/events/index.ts:40-120`
- Modify: `src/context/reducers/sanitizers/stateSanitizers.ts:1840-1860`
- Modify: `src/utils/eventEngine/eventSelection.ts:20-60`
- Test: `tests/node/eventRegistryAdmission.test.js`
- Test: `tests/node/eventEngine.test.js`

- [ ] **Step 1: Check existing tests pass**
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/eventRegistryAdmission.test.js tests/node/eventEngine.test.js`
      Expected: PASS

- [x] **Step 2: Export `EVENTS_BY_ID` and `getEventById` from `src/data/events/index.ts`**
      The registry already exports both symbols and populates the index after validation. Do not add duplicate exports or reference `allEvents`.

- [ ] **Step 3: Update `stateSanitizers.ts` and `eventSelection.ts` to consume canonical index**
      In `stateSanitizers.ts`, replace the manual `registryEventsById` cache loop with `EVENTS_BY_ID`. In `eventSelection.ts`, read from `getEventById(id)` / `EVENTS_BY_ID`.

- [ ] **Step 4: Run tests and typecheck**
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/eventRegistryAdmission.test.js tests/node/eventEngine.test.js`
      Run: `pnpm run typecheck:core`
      Expected: PASS

- [ ] **Step 5: Commit changes**
      `git commit -m "perf(events): export canonical EVENTS_BY_ID map from event registry (SUB-04-REC-02)"`

---

### Task 3: Precomputed Outgoing Adjacency Set in `mapUtils.ts` (`SUB-10-REC-02`)

**Files:**

- Modify: `src/utils/mapUtils.ts:50-75, 510-530`
- Modify: `src/hooks/travel/index.ts:80-95`
- Modify: `src/components/overworld/OverworldMap.tsx:150-185, 270-280`
- Test: `tests/node/mapUtils.test.js`
- Test: `tests/ui/OverworldMap.cityStates.test.jsx`

- [ ] **Step 1: Verify existing tests pass**
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/mapUtils.test.js`
      Run: `pnpm exec vitest run tests/ui/OverworldMap.cityStates.test.jsx`
      Expected: PASS

- [ ] **Step 2: Add `getConnectedTargetIds` in `src/utils/mapUtils.ts`**
      Export a helper returning the outgoing target IDs of `currentNodeId` as a `ReadonlySet<string>`. Scan both `gameMap.connections` and `gameMap.edges` and union their outgoing destinations, collecting only entries whose `from === currentNodeId`. This intentionally widens the previous behavior, where an array in `connections` (even empty) took precedence and `edges` was only a fallback; a map carrying `{ connections: [], edges: [{ from: 'A', to: 'B' }] }` now permits A → B. Edges are directed (A → B does not allow B → A); do not treat them as bidirectional and do not rely on `edges` alone.

- [ ] **Step 3: Update `OverworldMap.tsx` and `useTravelLogic`**
      Replace linear `isConnected` scans inside node rendering with `connectedTargetIds.has(node.id)`.

- [ ] **Step 4: Run tests and typecheck**
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/mapUtils.test.js`
      Run: `pnpm exec vitest run tests/ui/OverworldMap.cityStates.test.jsx`
      Run: `pnpm run typecheck:core`
      Expected: PASS

- [ ] **Step 5: Commit changes**
      `git commit -m "perf(map): replace O(N*E) isConnected scans with precomputed target set (SUB-10-REC-02)"`

---

### Task 4: Decouple Highway Render Layout from Domain State (`SUB-07-REC-01`)

**Files:**

- Modify: `src/types/rhythmGame.d.ts:10-25`
- Modify: `src/components/stage/LaneManager.ts:70-85, 175-190`
- Modify: `src/components/stage/NoteManager.ts:10-40, 185-205`
- Modify: `src/components/stage/NoteSpritePool.ts:15-25, 60-70`
- Test: `tests/node/LaneManager.test.js`
- Test: `tests/node/NoteManager.test.js`

- [ ] **Step 1: Check existing tests pass**
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/LaneManager.test.js tests/node/NoteManager.test.js`
      Expected: PASS

- [ ] **Step 2: Clean up `RhythmLane` type and stage render tracking**
      Remove dead `RhythmLane.x` and optional `renderX` mutation into gameStateRef. Keep horizontal pixel positions owned by `LaneManager` via an internal `laneXPositions: number[]` array, passed directly into `LaneRenderer.draw` and `NoteManager.update`.

- [ ] **Step 3: Update `NoteManager` and `NoteSpritePool`**
      Access lane X coordinate via layout helper `getLaneX(laneIndex, layout)` or `laneXPositions[laneIndex]` rather than mutating domain state.

- [ ] **Step 4: Run tests and typecheck**
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/LaneManager.test.js tests/node/NoteManager.test.js`
      Run: `pnpm run typecheck:core`
      Expected: PASS

- [ ] **Step 5: Commit changes**
      `git commit -m "refactor(rhythm): decouple lane pixel coordinates from domain state (SUB-07-REC-01)"`

---

### Task 5: Pure Loan Model & Deterministic Slot IDs in Asset Reducers (`SUB-02-REC-01` & `SUB-02-REC-02`)

**Files:**

- Modify: `src/types/game.d.ts:600-650`
- Modify: `src/context/reducers/assets/assetReducer.ts:150-280, 500-580`
- Modify: `src/context/actionCreators.ts:700-750`
- Test: `tests/node/assetReducer.test.js`
- Test: `tests/node/actionCreators.test.js`

- [ ] **Step 1: Verify existing asset tests pass**
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/assetReducer.test.js tests/node/actionCreators.test.js`
      Expected: PASS

- [ ] **Step 2: Deterministic Slot IDs in Action Creators**
      Generate slot UUIDs in `createInstallAssetModuleAction(chassisKind, slotId)` rather than inside the reducer, preserving reducer purity.

- [ ] **Step 3: Simplify Loan State Representation**
      Ensure loan liabilities compute principal and payment deterministically without mutating internal loan counters during queries.

- [ ] **Step 4: Run tests and typecheck**
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/assetReducer.test.js tests/node/actionCreators.test.js`
      Run: `pnpm run typecheck:core`
      Expected: PASS

- [ ] **Step 5: Commit changes**
      `git commit -m "refactor(assets): generate slot IDs in action creators and purify loan calculations (SUB-02-REC-01, SUB-02-REC-02)"`

---

### Task 6: Remove Redundant Top-Level Insurance Fields from `ExpeditionState` (`SUB-03-REC-02`)

**Files:**

- Modify: `src/types/expedition.d.ts:750-765`
- Modify: `src/context/reducers/expeditionReducer.ts:480-485, 630-640`
- Modify: `src/context/reducers/expeditionSanitizers.ts:375-385, 970-985`
- Modify: `src/domain/expedition/defaults.ts:110-125`
- Modify: `src/domain/expedition/insurance.ts:100-120`
- Test: `tests/node/expeditionInsurance.test.js`
- Test: `tests/node/expeditionReducer.test.js`

- [ ] **Step 1: Verify existing insurance tests pass**
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionInsurance.test.js tests/node/expeditionReducer.test.js`
      Expected: PASS

- [ ] **Step 2: Remove redundant top-level `insurancePolicyId` and `claimConsumed`**
      Derive insurance policy and claim consumption solely from `state.expedition.loadout.insurancePolicyId` and `state.expedition.insurance.claimConsumed`. Remove duplicate top-level keys in defaults and reducer.

- [ ] **Step 3: Update sanitizers to migrate legacy save states**
      In `expeditionSanitizers.ts`, if top-level `insurancePolicyId` or `claimConsumed` exists on raw loaded JSON, fold them into `loadout` and `insurance` objects.

- [ ] **Step 4: Run tests and typecheck**
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionInsurance.test.js tests/node/expeditionReducer.test.js`
      Run: `pnpm run typecheck:core`
      Expected: PASS

- [ ] **Step 5: Commit changes**
      `git commit -m "refactor(expedition): eliminate duplicate top-level insurance fields in expedition state (SUB-03-REC-02)"`

---

### Task 7: Monotonic `lifecycleStage` on `PendingGigSettlement` (`SUB-01-REC-01`)

**Files:**

- Modify: `src/types/game.d.ts:280-300`
- Modify: `src/context/reducers/pendingGigSettlementReducer.ts:45-80, 100-130`
- Modify: `src/utils/postGig/settlementLifecycle.ts:20-45`
- Test: `tests/node/pendingGigSettlementReducer.test.js`

- [ ] **Step 1: Check existing settlement tests pass**
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/pendingGigSettlementReducer.test.js`
      Expected: PASS

- [ ] **Step 2: Streamline `lifecycleStage` as sole state authority**
      Define `lifecycleStage: 'recorded' | 'social_reconciled' | 'settled'`. Derive `socialReconciled` as `lifecycleStage !== 'recorded'`, eliminating separate boolean sync hazard.

- [ ] **Step 3: Run tests and typecheck**
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/pendingGigSettlementReducer.test.js`
      Run: `pnpm run typecheck:core`
      Expected: PASS

- [ ] **Step 4: Commit changes**
      `git commit -m "refactor(settlement): make lifecycleStage the single source of truth for pending gig settlement (SUB-01-REC-01)"`

---

### Task 8: Remove Ephemeral `pendingBandHQOpen` from Root `GameState` (`SUB-01-REC-02`)

**Files:**

- Modify: `src/types/game.d.ts:340-355`
- Modify: `src/context/initialState.ts:230-245`
- Modify: `src/context/actionTypes.ts:250-255`
- Modify: `src/context/actionCreators.ts:1200-1215`
- Modify: `src/context/reducers/systemReducer.ts:1120-1140`
- Modify: `src/context/reducers/sanitizers/stateSanitizers.ts:2630-2675`
- Modify: `src/hooks/useBandHQModal.ts:10-35`
- Test: `tests/node/systemReducer.test.js`
- Test: `tests/ui/Overworld.test.jsx`

- [ ] **Step 1: Check existing systemReducer and Overworld tests pass**
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/systemReducer.test.js`
      Run: `pnpm exec vitest run tests/ui/Overworld.test.jsx`
      Expected: PASS

- [ ] **Step 2: Remove `pendingBandHQOpen` property from `GameState`**
      Standardize on `pendingOverlay: { kind: 'band_hq' }`. In `useBandHQModal.ts`, read `pendingOverlay?.kind === 'band_hq'`. In `stateSanitizers.ts`, map any legacy `pendingBandHQOpen === true` into `pendingOverlay`.

- [ ] **Step 3: Run tests and typecheck**
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/systemReducer.test.js`
      Run: `pnpm exec vitest run tests/ui/Overworld.test.jsx`
      Run: `pnpm run typecheck:core`
      Expected: PASS

- [ ] **Step 4: Commit changes**
      `git commit -m "refactor(state): remove ephemeral pendingBandHQOpen in favor of pendingOverlay (SUB-01-REC-02)"`

---

### Task 9: Dedicated `checkMilestones` Progression Module with Declarative Rewards (`SUB-05-REC-01`)

**Files:**

- Create: `src/domain/progression/checkMilestones.ts`
- Modify: `src/context/reducers/systemReducer.ts:890-930`
- Modify: `src/context/gameReducer.ts:410-440`
- Test: `tests/node/questProgress.test.js`

- [ ] **Step 1: Verify existing quest and milestone tests pass**
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/questProgress.test.js`
      Expected: PASS

- [ ] **Step 2: Implement pure `checkMilestones(state: GameState): GameState`**
      Move milestone evaluation out of recursive action dispatches into a pure transformation:

```ts
export const checkMilestones = (state: GameState): GameState => {
  // Purely checks condition thresholds, adds milestone ID to unlockedMilestones, applies rewards directly
}
```

- [ ] **Step 3: Call `checkMilestones` in `handleAdvanceDay`**
      Call `nextState = checkMilestones(nextState)` at the end of the advance day pipeline, eliminating re-entrant `gameReducer` dispatches.

- [ ] **Step 4: Run tests and typecheck**
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/questProgress.test.js`
      Run: `pnpm run typecheck:core`
      Expected: PASS

- [ ] **Step 5: Commit changes**
      `git commit -m "refactor(progression): extract pure checkMilestones module without recursive dispatches (SUB-05-REC-01)"`

---

### Task 10: Deduplicate Gig Quest Events in `gigReducer.ts` & Drop Dynamic Rule Patching (`SUB-05-REC-02`)

**Files:**

- Modify: `src/context/reducers/gigReducer.ts:180-220`
- Modify: `src/utils/questProgress.ts:150-180`
- Test: `tests/node/questProgress.test.js`
- Test: `tests/node/gigReducer.test.js`

- [ ] **Step 1: Verify existing tests pass**
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/questProgress.test.js tests/node/gigReducer.test.js`
      Expected: PASS

- [ ] **Step 2: Streamline gig completion quest event dispatch**
      `gig.good` and `gig.smallVenueGood` are canonical events consumed by existing quests (including `quest_prove_yourself` and `quest_venue_residency`); do not drop them as legacy pseudo-events. Any consolidation must keep these event types working, or specify a migration for both registry quest rules and saved quest rules.
      Whatever event payload is emitted must retain `score`, `accuracy`, `venueId`, `region`, **capacity** (needed by the small-venue rule) and the failed-gig flag, and `questProgress.ts` must retain the capacity, accuracy and failed-gig conditions in predicate evaluation.

- [ ] **Step 3: Run tests and typecheck**
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/questProgress.test.js tests/node/gigReducer.test.js`
      Run: `pnpm run typecheck:core`
      Expected: PASS

- [ ] **Step 4: Commit changes**
      `git commit -m "refactor(quests): unify gig quest events into single canonical event (SUB-05-REC-02)"`

---

### Task 11: Single Source of Truth for Unlock Durability in `storage.ts` (`SUB-17-REC-01`)

**Files:**

- Modify: `src/utils/storage.ts:60-80, 140-160, 200-210`
- Modify: `src/utils/unlockManager.ts:20-40, 60-80, 185-200`
- Test: `tests/node/unlockManager.test.js`
- Test: `tests/node/storage.test.js`

- [ ] **Step 1: Check existing unlock tests pass**
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/unlockManager.test.js tests/node/storage.test.js`
      Expected: PASS

- [ ] **Step 2: Expose `isStorageItemBuffered` on storage adapter**
      Expose `isStorageItemBuffered(key)` on `src/utils/storage.ts`.
      In `unlockManager.ts`, derive unlock durability directly from whether the key is in storage vs in-memory fallback, removing the separate `sessionOnly: Set<string>` that desynced on cache invalidation.

- [ ] **Step 3: Run tests and typecheck**
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/unlockManager.test.js tests/node/storage.test.js`
      Run: `pnpm run typecheck:core`
      Expected: PASS

- [ ] **Step 4: Commit changes**
      `git commit -m "refactor(storage): make storage layer sole authority for unlock durability (SUB-17-REC-01)"`

---

### Task 12: Single-Shot Storage Execution in `safeStorage.ts` (`SUB-17-REC-02`)

**Files:**

- Modify: `src/utils/errors/safeStorage.ts:45-78`
- Modify: `src/utils/storageAdapter.ts:75-120`
- Test: `tests/utils/storageAdapter.test.js`
- Test: `tests/node/storage.test.js`

- [ ] **Step 1: Verify existing storage tests pass**
      Run: `pnpm exec vitest run tests/utils/storageAdapter.test.js`
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/storage.test.js`
      Expected: PASS

- [ ] **Step 2: Replace 3-iteration retry loop with single-shot try/catch**
      In `src/utils/errors/safeStorage.ts`, replace `while (retries >= 0)` loop with immediate try/catch. Synchronous browser storage operations fail deterministically; retrying synchronous code 3 times only wastes CPU.

- [ ] **Step 3: Run tests and typecheck**
      Run: `pnpm exec vitest run tests/utils/storageAdapter.test.js`
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/storage.test.js`
      Run: `pnpm run typecheck:core`
      Expected: PASS

- [ ] **Step 4: Commit changes**
      `git commit -m "perf(storage): replace dead 3-iteration retry loop with single-shot execution in safeStorage (SUB-17-REC-02)"`

---

### Task 13: Redis Request Deadline Internalization in `lib/leaderboard.js` (`SUB-18-REC-02`)

**Files:**

- Modify: `lib/leaderboard.js:40-60`
- Modify: `lib/redisDeadline.js:15-70`
- Modify: `api/image.js:40-50`
- Test: `tests/api/leaderboard.song.test.js`
- Test: `tests/api/image.test.js`
- Test: `node --test tests/node/rateLimitScript.test.js`

- [ ] **Step 1: Check existing API tests pass**
      Run: `pnpm exec vitest run tests/api/leaderboard.song.test.js tests/api/image.test.js`
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/rateLimitScript.test.js`
      Expected: PASS

- [ ] **Step 2: Internalize deadline inside `isLeaderboardRateLimited`**
      Wrap Redis operations in `isLeaderboardRateLimited` with `withRedisDeadline` internally, rather than forcing every endpoint caller to duplicate manual deadline wrappers.

- [ ] **Step 3: Run tests and typecheck**
      Run: `pnpm exec vitest run tests/api/leaderboard.song.test.js tests/api/image.test.js`
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/rateLimitScript.test.js`
      Run: `pnpm run typecheck:server`
      Expected: PASS

- [ ] **Step 4: Commit changes**
      `git commit -m "refactor(leaderboard): internalize redis deadline handling inside rate limiter (SUB-18-REC-02)"`

---

### Task 14: Contraband Schema Discriminated Union in `src/schemas/contraband.ts` (`SUB-19-REC-01`)

**Files:**

- Modify: `src/schemas/contraband.ts:20-50`
- Modify: `src/data/contraband.ts:1-100`
- Test: `tests/node/contraband.schema.test.js`
- Test: `tests/node/contrabandStashUtils.test.js`

- [ ] **Step 1: Verify existing contraband tests pass**
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/contraband.schema.test.js tests/node/contrabandStashUtils.test.js`
      Expected: PASS

- [ ] **Step 2: Define discriminated union for contraband items**

```ts
export type ContrabandConsumableItem = BaseContrabandItem & {
  type: 'consumable'
  maxStacks?: number
  duration?: number
}
export type ContrabandEquipmentItem = BaseContrabandItem & {
  type: 'equipment'
  applyOnAdd: boolean
}
export type ContrabandRelicItem = BaseContrabandItem & {
  type: 'relic'
}
export type SanitizedContrabandItem =
  ContrabandConsumableItem | ContrabandEquipmentItem | ContrabandRelicItem
```

Enforce type-dependent validation in `validateContrabandItem`. Keep `duration` and `maxStacks` optional for consumables: instantaneous catalog entries such as `c_void_energy` (no duration) and `c_blood_pact` (neither field) must remain valid with their effects preserved.

- [ ] **Step 3: Run tests and typecheck**
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/contraband.schema.test.js tests/node/contrabandStashUtils.test.js`
      Run: `pnpm run typecheck:core`
      Expected: PASS

- [ ] **Step 4: Commit changes**
      `git commit -m "refactor(contraband): represent contraband items as discriminated union by type (SUB-19-REC-01)"`

---

### Task 15: Consolidate Clinic Action Gating & Modal Ownership (`SUB-14-REC-01`)

**Files:**

- Modify: `src/utils/clinicLogicUtils.ts:30-80`
- Modify: `src/scenes/ClinicScene.tsx:60-120`
- Test: `tests/node/clinicLogic.test.js`
- Test: `tests/ui/ClinicScene.test.jsx`

- [ ] **Step 1: Verify clinic tests pass**
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/clinicLogic.test.js`
      Run: `pnpm exec vitest run tests/ui/ClinicScene.test.jsx`
      Expected: PASS

- [ ] **Step 2: Centralize action validation in `clinicLogicUtils.ts`**
      Consolidate affordability and trait compatibility checks in `getClinicActionAvailability(action, state)`. In `ClinicScene.tsx`, manage active modal state with a typed discriminated union (`null | { kind: 'graft' } | { kind: 'therapy' }`).

- [ ] **Step 3: Run tests and typecheck**
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/clinicLogic.test.js`
      Run: `pnpm exec vitest run tests/ui/ClinicScene.test.jsx`
      Run: `pnpm run typecheck:core`
      Expected: PASS

- [ ] **Step 4: Commit changes**
      `git commit -m "refactor(clinic): centralize action availability and modal state in clinic scene (SUB-14-REC-01)"`

---

### Task 16: Decouple Global `HUD.tsx` from `GIG` Scene & Move Pedal Controls to `GigHUD.tsx` (`SUB-14-REC-02`)

**Files:**

- Modify: `src/ui/HUD.tsx:75-145`
- Modify: `src/components/GigHUD.tsx:20-80`
- Test: `tests/ui/HUD.test.jsx`
- Test: `tests/ui/GigHUD.test.jsx`

- [ ] **Step 1: Verify HUD tests pass**
      Run: `pnpm exec vitest run tests/ui/HUD.test.jsx`
      Expected: PASS

- [ ] **Step 2: Move gig-only pedal controls from global `HUD.tsx` into `GigHUD.tsx`**
      In `src/components/GigHUD.tsx`, render the Neuro-decimator and Neurotoxic pedal controls when active. Remove the `isGigScene ? 'mt-24' : ''` layout spacing hack from `src/ui/HUD.tsx`.

- [ ] **Step 3: Run tests and typecheck**
      Run: `pnpm exec vitest run tests/ui/HUD.test.jsx`
      Run: `pnpm run typecheck:core`
      Expected: PASS

- [ ] **Step 4: Commit changes**
      `git commit -m "refactor(ui): move gig pedal controls from global HUD into GigHUD (SUB-14-REC-02)"`

---

### Task 17: Stable Per-Gig Financial Snapshot in `usePostGigDerivations.ts` (`SUB-11-REC-02`)

**Files:**

- Modify: `src/hooks/postGig/usePostGigDerivations.ts:100-130, 190-215`
- Modify: `src/hooks/postGig/usePostGigLogic.ts:150-175`
- Test: `tests/utils/postGig/derivations.test.ts`
- Test: `tests/ui/usePostGigLogic.test.jsx`

- [ ] **Step 1: Verify post-gig tests pass**
      Run: `pnpm exec vitest run tests/utils/postGig/derivations.test.ts tests/ui/usePostGigLogic.test.jsx`
      Expected: PASS

- [ ] **Step 2: Establish the stale-financials path, then decide**
      The stale path is not established yet: `setLastGigStats` is only called from gig-end paths (`useRhythmGameLoop`, `useHandleMiss`, `useGigSession`) before the POSTGIG scene mounts, so a replacement `lastGigStats` reaching an already-mounted `usePostGigDerivations` has not been shown. First add a test in `tests/ui/usePostGigLogic.test.jsx` that rerenders the mounted hook (a) with a new `currentGig`/`lastGigStats` and (b) with changed `player`/`band`/`social` only, and record which case actually produces a wrong result with the current `financialSnapshotRef`. If neither fails, close this task as no-change.
      If a failing case exists: `PostGigSummary` has no completion timestamp, so do not key on one. Key on the identity of `currentGig` and `lastGigStats` (the existing snapshot check). Keep calling the existing `deriveFinancials(...)` (performance penalty, repeat-demand adjustment, reward multiplier, smoothing), not a direct `calculateGigFinancials` call. The report must stay frozen while parallel post-gig events change `player`, `band` or `social` (current behavior), so do not reduce the deps to a bare `useMemo(..., [gigKey])`, which violates `react-hooks/exhaustive-deps`; no lint suppression. If no render-pure approach preserves that freeze, keep the ref-based snapshot.

- [ ] **Step 3: Run tests and typecheck**
      Run: `pnpm exec vitest run tests/utils/postGig/derivations.test.ts tests/ui/usePostGigLogic.test.jsx`
      Run: `pnpm run typecheck:core`
      Expected: PASS

- [ ] **Step 4: Commit changes**
      `git commit -m "refactor(postgig): make financial calculation pure and memoized without render-time ref reads (SUB-11-REC-02)"`

---

### Task 18: Normalize Social Metrics at Entry of `calculateGigFinancials` (`SUB-12-REC-02`)

**Files:**

- Modify: `src/types/economy.d.ts:40-70`
- Modify: `src/utils/economy/gigLogic/index.ts:90-110, 160-170`
- Modify: `src/utils/economy/gigLogic/calculateMerchIncome.ts:70-85`
- Modify: `src/utils/economy/gigLogic/calculateTicketIncome.ts:70-80`
- Test: `tests/node/economyEngine.test.js`

- [ ] **Step 1: Check existing economy engine tests pass**
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/economyEngine.test.js`
      Expected: PASS

- [ ] **Step 2: Define `NormalizedEconomySocial` and normalize at entry**
      In `src/utils/economy/gigLogic/index.ts`, normalize social fields once:

```ts
const normalizedSocial = {
  instagram: finiteNumberOr(
    context.instagram,
    finiteNumberOr(context.social?.instagram, 0)
  ),
  tiktok: finiteNumberOr(
    context.tiktok,
    finiteNumberOr(context.social?.tiktok, 0)
  ),
  controversyLevel: finiteNumberOr(
    context.controversyLevel,
    finiteNumberOr(context.social?.controversyLevel, 0)
  ),
  activeDeals: context.social?.activeDeals ?? []
}
```

Thread `normalizedSocial` into ticket and merch calculators, removing duplicated fallback chains.

- [ ] **Step 3: Run tests and typecheck**
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/economyEngine.test.js`
      Run: `pnpm run typecheck:core`
      Expected: PASS

- [ ] **Step 4: Commit changes**
      `git commit -m "refactor(economy): normalize social metrics once at entry of calculateGigFinancials (SUB-12-REC-02)"`

---

### Task 19: Referentially Stable Snapshot & `setSfxVolume` Casing in `AudioManager.ts` (`SUB-06-REC-02`)

**Files:**

- Modify: `src/types/audio.d.ts:85-120`
- Modify: `src/utils/audio/AudioManager.ts:60-70, 130-135`
- Modify: `src/utils/audio/audioService.ts:30-48`
- Modify: `src/hooks/audioControlUtils.ts:40-50, 105-135`
- Test: `tests/node/audioManager.test.js`
- Test: `tests/node/audioFacadeSingleton.test.js`
- Test: `tests/ui/audioControlUtils.test.jsx`

- [ ] **Step 1: Verify existing audio tests pass**
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/audioManager.test.js tests/node/audioFacadeSingleton.test.js`
      Run: `pnpm exec vitest run tests/ui/audioControlUtils.test.jsx`
      Expected: PASS

- [ ] **Step 2: Provide referentially stable `getStateSnapshot` in `audioService`**
      In `audioService.ts`, delegate `getStateSnapshot` directly to `audioManager.getStateSnapshot()`. Add `setSfxVolume` as alias to `setSFXVolume` on `AudioManager` to eliminate casing errors.

- [ ] **Step 3: Run tests and typecheck**
      Run: `node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/audioManager.test.js tests/node/audioFacadeSingleton.test.js`
      Run: `pnpm exec vitest run tests/ui/audioControlUtils.test.jsx`
      Run: `pnpm run typecheck:core`
      Expected: PASS

- [ ] **Step 4: Commit changes**
      `git commit -m "refactor(audio): delegate stable snapshot and add setSfxVolume alias in audio manager (SUB-06-REC-02)"`

---

### Task 20: Scene Continuation Ownership in `useRoadieLogic` and `RoadieRunScene` (`SUB-09-REC-01`)

**Files:**

- Modify: `src/hooks/minigames/useRoadieLogic.ts:160-205`
- Modify: `src/scenes/RoadieRunScene.tsx:20-55, 75-80`
- Test: `tests/ui/useRoadieLogic.test.jsx`
- Test: `tests/ui/RoadieRunScene.test.jsx`

- [ ] **Step 1: Verify roadie minigame tests pass**
      Run: `pnpm exec vitest run tests/ui/useRoadieLogic.test.jsx tests/ui/RoadieRunScene.test.jsx`
      Expected: PASS

- [ ] **Step 2: Move continuation callback to scene**
      Accept `onContinue?: () => void` in `useRoadieLogic`. In `RoadieRunScene.tsx`, declare `handleComplete` before the `useRoadieLogic` call and pass `onContinue: handleComplete`. Move the existing ten-second completion fallback timer into the scene (clear it when it fires and on unmount) so the hook stays scene-agnostic; add fallback-timer and unmount-cleanup coverage. Remove the Redux `currentScene` subscription and internal scene-changing timers from `useRoadieLogic`, aligning with the architecture invariant that minigames stay scene-agnostic.

- [ ] **Step 3: Run tests and typecheck**
      Run: `pnpm exec vitest run tests/ui/useRoadieLogic.test.jsx tests/ui/RoadieRunScene.test.jsx`
      Run: `pnpm run typecheck:core`
      Expected: PASS

- [ ] **Step 4: Commit changes**
      `git commit -m "refactor(roadie): transfer scene continuation ownership from hook to scene component (SUB-09-REC-01)"`

---

### Step-by-Step Verification Gate for All Slice 3 Tasks

Upon completion of Tasks 1 through 20:

- Fast tests: `pnpm run test`
- Core typecheck: `pnpm run typecheck:core`
- Reducer typecheck: `pnpm run typecheck`
- Server typecheck: `pnpm run typecheck:server`
- Full test pass across all touched suites
- Deadcode gate: `pnpm run deadcode:check`
- Working tree clean check: `git status`
