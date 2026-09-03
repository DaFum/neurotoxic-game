# Roguelite Expedition Review Hardening Contract

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to apply this contract before the affected child-plan task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the final deep-review gaps in the Roguelite Expedition implementation plan before production implementation begins.

**Architecture:** This file is a binding amendment to `01-expedition-core-extraction.md` through `06-balance-simulator-recalibration.md`. When an older child-plan snippet conflicts with a contract below, **this file wins** and the affected child task must be implemented with the replacement contract here. The amendments preserve the existing owners: reducers remain authoritative, navigation stays outside reducers, `unlockManager` stays the capability owner, and simulator calibration/holdout streams remain disjoint.

**Tech Stack:** React 19, TypeScript 6, typed `GameAction`/`ActionTypes`, reducer/action-creator architecture, existing persistence adapter, Node/Vitest/Playwright tests, deterministic balance harness.

---

## Mandatory execution order

Apply these amendments at the indicated gate before continuing to dependent work:

1. **G1-A** after G1 Task 4 and G1 Task 11, before the G1 stage gate.
2. **G2-A** while implementing G2 Tasks 8 and 11, before the G2 stage gate.
3. **G3-A** while implementing G3 staged injury actions, before the G3 stage gate.
4. **G4-A** while implementing obligation settlement and contextual finales, before the G4 stage gate.
5. **G5-A/B/C** before the G5 stage gate.
6. **G6-A/B** before any v15 report is accepted as release evidence.

No dependent gate may be considered green while its amendment is unapplied.

---

## Global invariant: Reducers are authoritative

Every new action must carry **intent plus only genuinely nondeterministic tokens** that cannot be regenerated in a reducer (for example a pre-generated UUID or deterministic roll). It must not trust caller-computed prices, rewards, next-state values, capacity, rank, finale type, or other deterministic results.

For every affected action:

```text
Action creator:
  validate obvious caller input
  generate only UUID/seed/roll tokens when needed
  optionally call the shared pure resolver for early rejection

Reducer:
  revalidate current state and registry ids
  recompute the deterministic result from current canonical state/config
  reject stale/forged payloads with the identical state reference
  apply the mutation exactly once
```

Direct reducer tests are mandatory. A forged action must never mint money/Fame/Tour Tokens, bypass cargo capacity, choose a finale, skip an injury stage, receive a free repair, or start an invalid loadout.

---

# G1-A — Lifecycle and Bankruptcy Hardening

## Amendment 1: Revalidate `START_EXPEDITION` inside the reducer

**Amends:** G1 Task 4.

**Files:**
- Modify: `src/context/reducers/expeditionReducer.ts`
- Modify: `src/context/expeditionActionCreators.ts`
- Test: `tests/node/expeditionReducer.test.js`

`START_EXPEDITION` keeps the creator-generated `runId`, because reducers must not generate IDs. The reducer must nevertheless validate the payload independently:

```ts
export const handleStartExpedition = (
  state: GameState,
  payload: StartExpeditionPayload
): GameState => {
  if (state.expedition.status !== 'preparing') return state
  if (
    typeof payload.runId !== 'string' ||
    !SAFE_UUID_RE.test(payload.runId)
  ) return state

  const validated = validateExpeditionLoadout(state, payload.loadout)
  if (!validated.valid) return state

  return materializeStartedExpedition(
    state,
    validated.loadout,
    payload.runId
  )
}
```

The reducer uses the **validated canonical loadout**, not the raw payload object. Add direct-action tests for locked region/tour ids, duplicate crew ids, cargo overflow, invalid chassis ids, and malformed `runId`; all must return the original state reference.

## Amendment 2: Route Rest-in-Van bankruptcy after the committed day tick

**Amends:** G1 Task 11.

The existing Arrival path cannot be the only daily-bankruptcy router because `useVanMaintenance.handleRestInVan()` calls `advanceDay()` without creating `pendingRouteRef`.

**Files:**
- Modify: `src/hooks/travel/types.ts`
- Modify: `src/hooks/travel/index.ts`
- Modify: `src/hooks/travel/useVanMaintenance.ts`
- Test: `tests/ui/useVanMaintenance.test.tsx`
- Keep: `tests/ui/useArrivalLogic.test.jsx`
- Keep: `tests/node/advanceDayAssetIntegration.test.js`

Extend `VanMaintenanceParams` with the committed state required to recognize completion of the rest day:

```ts
export interface VanMaintenanceParams {
  // existing fields...
  currentDay: number
  expeditionStatus: GameState['expedition']['status']
  saveGameAfterStateCommit: () => void
  changeScene: (scene: GamePhase) => void
}
```

Inside `useVanMaintenance` keep a day target, not a boolean, so a successful non-bankrupt rest cannot leave a stale pending flag:

```ts
const pendingRestDayRef = useRef<number | null>(null)

const handleRestInVan = useCallback(() => {
  // existing confirmation/recovery logic...
  pendingRestDayRef.current = Math.max(0, Math.trunc(currentDay)) + 1
  updateBand({ members: newMembers })
  advanceDay()
}, [
  advanceDay,
  band,
  currentDay,
  updateBand,
  // existing dependencies...
])

useEffect(() => {
  const expectedDay = pendingRestDayRef.current
  if (expectedDay === null || currentDay < expectedDay) return

  pendingRestDayRef.current = null
  if (expeditionStatus !== 'failed') return

  saveGameAfterStateCommit()
  changeScene(GAME_PHASES.RUN_SUMMARY)
}, [
  changeScene,
  currentDay,
  expeditionStatus,
  saveGameAfterStateCommit
])
```

`useTravelLogic` passes `player.day`, the live Expedition status and the existing stable save/scene callbacks. Arrival routing remains unchanged for travel-owned day ticks; Rest-in-Van owns only its own post-commit route.

Add this integration test:

```text
active Expedition
-> confirm Rest in Van
-> ADVANCE_DAY commits daily bankruptcy
-> expedition.status becomes failed
-> post-commit rest effect requests save
-> currentScene becomes RUN_SUMMARY
```

Also assert a normal rest that advances the day without bankruptcy clears the pending target and does not route later on an unrelated failure.

---

# G2-A — Repair and Cargo Trust-Boundary Hardening

## Amendment 3: Repair actions carry intent, not resolved mutations

**Replaces:** G2 Task 8 Step 4.

**Files:**
- Modify: `src/domain/expedition/repairs.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/context/expeditionActionCreators.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Test: `tests/node/expeditionRepairs.test.js`
- Test: `tests/node/expeditionReducer.test.js`

Use this payload:

```ts
export type ExpeditionRepairMode =
  | 'professional'
  | 'field'
  | 'improvised'
  | 'cannibalize'

export interface RepairExpeditionConditionPayload {
  mode: ExpeditionRepairMode
  target: ConditionGroup
  source: ConditionGroup | null
  expectedTargetCondition: number
  expectedSourceCondition: number | null
  defectRoll: number | null
}
```

The creator may stamp `defectRoll` only for improvisation. It must not send `moneyCost`, `sparePartsConsumed`, `nextTargetCondition`, `nextSourceCondition`, or a materialized defect.

Add one shared pure resolver:

```ts
export const resolveExpeditionRepairIntent = (
  state: GameState,
  payload: RepairExpeditionConditionPayload
): ResolvedExpeditionRepair | null
```

The resolver derives from current state:

```text
professional -> canonical missing-point cost and target 90
field        -> current spare parts + vehicle/crew repair efficiency
improvised   -> canonical +20 plus defect derived from target + bounded roll
cannibalize  -> canonical source -40 / target +45
```

The reducer first checks `expectedTargetCondition`/`expectedSourceCondition`, calls the resolver itself, and applies only the returned canonical mutation. A replay or stale action is a no-op.

Required hostile tests:

```text
professional repair with insufficient current money -> identical state
field repair with zero current spare parts -> identical state
stale expected condition -> identical state
unknown group/source combination -> identical state
caller cannot provide a free cost/full next condition because those fields do not exist
```

## Amendment 4: Cargo purchases derive price and capacity in the reducer

**Replaces:** G2 Task 11 Step 5.

Use:

```ts
export interface AddExpeditionCargoPayload {
  kind: 'spareParts' | 'supplies'
  expectedUsedSlots: number
}
```

Quantity is exactly one for this v1 action. The reducer derives:

```ts
const price = payload.kind === 'spareParts'
  ? EXPEDITION_SUPPLY_PRICES.sparePart
  : EXPEDITION_SUPPLY_PRICES.supply
const vehicle = getExpeditionVehicleState(state)
const capacity = getExpeditionCargoCapacity(vehicle.cargoCapacityBonus)
const used = getExpeditionCargoUsed(state.expedition.cargo)
```

It rejects when `used !== expectedUsedSlots`, `used + 1 > capacity`, money is insufficient, the Expedition is not active, or the kind is invalid. The action payload must not contain caller-owned `moneyCost`, `capacity`, or quantity.

Add direct reducer tests for a forged cheap purchase, stale slot count, and capacity overflow.

---

# G3-A — Injury Trust-Boundary Hardening

## Amendment 5: Injury actions cannot choose their next stage

**Amends:** G3 Task 8.

Replace the resolved `nextStage` payload with:

```ts
export interface AdvanceExpeditionInjuryPayload {
  memberId: string
  expectedStage: InjuryStage
  roll: number
}
```

The creator validates the member and `roll` in `[0, 1)`. The reducer revalidates the member, current stage and finite roll, derives current stamina from `state.band.members`, recomputes risk, and calls `advanceInjuryStage(current)` itself only when `roll < risk`.

A direct action with `expectedStage:'none'` cannot jump to `serious` or `critical` because no next-stage field exists. Test stale expected stage, invalid member, non-finite/out-of-range roll, and one-stage-only progression.

---

# G4-A — Obligation and Finale Trust-Boundary Hardening

## Amendment 6: Obligation settlement payload contains no reward values

**Amends:** G4 Task 4.

Use:

```ts
export interface ResolveExpeditionObligationPayload {
  id: string
  expectedStatus: 'completed' | 'failed'
}
```

`createResolveExpeditionObligationAction(state, id)` may reject invalid requests early, but the reducer owns final settlement. It looks up the current obligation, validates `settled === false` and the expected status, then calls the canonical template/Brand-Deal settlement resolver to derive money/Fame/Heat/controversy deltas. No action may carry those values.

Add direct reducer tests proving a caller cannot mint a custom reward and that a replay settles nothing.

## Amendment 7: Finale resolution is recomputed by the reducer

**Amends:** G4 Task 12.

Use a stale-state guard instead of a caller-selected finale:

```ts
export interface ResolveExpeditionFinalePayload {
  expectedRouteStep: number
}
```

Reducer behavior:

```ts
if (state.expedition.status !== 'active') return state
if (state.expedition.finaleType !== null) return state
if (state.expedition.routeStep !== payload.expectedRouteStep) return state

const finaleType = resolveExpeditionFinaleType(buildFinaleContext(state))
return {
  ...state,
  expedition: { ...state.expedition, finaleType }
}
```

The action creator does not carry `finaleType`. Add a forged direct-action test showing the caller cannot force `rival_battle`, `illegal_show`, or `corporate_showcase`.

---

# G5-A — Authoritative HQ Facility Progression

## Amendment 8: Define one facility registry and typed purchase boundary

**Amends:** G5 Task 9 and G5 Task 3.

**Files:**
- Create: `src/data/expedition/hqFacilities.ts`
- Modify: `src/data/expedition/unlockSets.ts`
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/types/game.d.ts`
- Modify: `src/context/careerActionCreators.ts`
- Modify: `src/context/reducers/careerReducer.ts`
- Modify: `src/context/useCareerDispatchActions.ts`
- Modify: `src/ui/bandhq/ExpeditionMetaTab.tsx`
- Test: `tests/node/expeditionUnlockSets.test.js`
- Test: `tests/node/expeditionCareer.test.js`
- Test: `tests/node/actionCreatorSerialization.test.js`
- Test: `tests/ui/ExpeditionMetaTab.test.tsx`

Canonical registry:

```ts
export const HQ_FACILITIES = Object.freeze({
  workshop: {
    id: 'workshop',
    maxLevel: 3,
    tokenCosts: [2, 4, 7]
  },
  rehearsal: {
    id: 'rehearsal',
    maxLevel: 3,
    tokenCosts: [2, 4, 7]
  },
  management: {
    id: 'management',
    maxLevel: 3,
    tokenCosts: [2, 4, 7]
  },
  garage: {
    id: 'garage',
    maxLevel: 3,
    tokenCosts: [2, 4, 7]
  },
  blackMarket: {
    id: 'blackMarket',
    maxLevel: 3,
    tokenCosts: [2, 4, 7]
  },
  crewLounge: {
    id: 'crewLounge',
    maxLevel: 3,
    tokenCosts: [2, 4, 7]
  }
} as const)
```

Add to each unlock set:

```ts
requiredFacility: { id: HqFacilityId; level: number } | null
```

Initial requirements are fixed:

```text
mechanic_network    -> workshop L1
industry_network    -> management L1
underground_network -> blackMarket L1
festival_network    -> garage L1
rival_network       -> garage L2
```

Add:

```ts
PURCHASE_EXPEDITION_HQ_FACILITY

export interface PurchaseExpeditionHqFacilityPayload {
  facilityId: HqFacilityId
  expectedLevel: number
}
```

The reducer validates the registry id, exact current level, max level and current Tour Tokens, derives the next-level cost from the registry, subtracts it once and increments exactly one level. The action does not carry cost or next level.

`BEGIN_EXPEDITION_UNLOCK_SET_PURCHASE` must additionally revalidate `requiredFacility` from current `career.hqFacilityLevels` before debiting tokens. UI visibility is not a security/progression boundary.

Required tests:

```text
facility purchase derives canonical cost
stale expected level -> no-op
insufficient tokens -> no-op
unknown facility -> no-op
mechanic set before Workshop L1 -> no-op
industry set before Management L1 -> no-op
underground set before Black Market L1 -> no-op
forged direct BEGIN cannot bypass facility requirement
```

---

# G5-B — Canonical Tour Archive Actions

## Amendment 9: Archive discovery belongs to `ActionTypes` and `GameAction`

**Replaces:** G5 Task 10 Step 3 action snippet.

**Files:**
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/types/game.d.ts`
- Modify: `src/context/careerActionCreators.ts`
- Modify: `src/context/reducers/careerReducer.ts`
- Modify: `src/context/useCareerDispatchActions.ts`
- Modify: `src/context/gameReducer.ts`
- Test: `tests/node/expeditionArchive.test.js`
- Test: `tests/node/actionCreatorSerialization.test.js`

Add:

```ts
// ActionTypes
RECORD_EXPEDITION_ARCHIVE_DISCOVERY:
  'RECORD_EXPEDITION_ARCHIVE_DISCOVERY',

export interface RecordExpeditionArchiveDiscoveryPayload {
  key: keyof CareerArchive
  id: string
}
```

Creator contract:

```ts
export const createRecordExpeditionArchiveDiscoveryAction = (
  key: unknown,
  id: unknown
): Extract<
  GameAction,
  { type: typeof ActionTypes.RECORD_EXPEDITION_ARCHIVE_DISCOVERY }
> => {
  if (!isCareerArchiveKey(key)) {
    throw new TypeError('Unknown archive category')
  }
  if (
    typeof id !== 'string' ||
    id.length === 0 ||
    id.length > 160 ||
    isForbiddenKey(id)
  ) {
    throw new TypeError('Invalid archive discovery id')
  }
  return {
    type: ActionTypes.RECORD_EXPEDITION_ARCHIVE_DISCOVERY,
    payload: { key, id }
  }
}
```

The reducer revalidates `key` and `id`, delegates to `addArchiveDiscovery`, and returns the identical state when unchanged. The dispatch hook exposes only the typed creator. Add serialization and malformed direct-action coverage.

---

# G5-C — Legendary Reward Persistence Must Gate Career Settlement

## Amendment 10: One Run Summary settlement effect owns both barriers

**Replaces the independent settlement effects in:** G5 Task 4 and G5 Task 12.

There is exactly one effect responsible for a finalized run:

```tsx
const runId = expedition.runId
const isFinalized = expedition.outcome !== null && expedition.status !== 'active'
const isCareerSettled =
  typeof runId === 'string' && career.settledRunIds.includes(runId)
const legendaryUnlockId =
  expedition.outcome?.kind === 'completed' && expedition.finaleType
    ? getLegendaryUnlockForFinale(expedition.finaleType)
    : null

useEffect(() => {
  if (!isFinalized || typeof runId !== 'string' || isCareerSettled) return

  if (legendaryUnlockId && !state.unlocks.includes(legendaryUnlockId)) {
    const persisted = addPersistentUnlock(legendaryUnlockId)
    if (!persisted) {
      markLegendarySettlementRetry(runId)
      return
    }

    addUnlockToState(legendaryUnlockId)
    return // wait for committed unlock state before career settlement
  }

  clearLegendarySettlementRetry(runId)
  recordExpeditionCareerResult()
}, [
  addUnlockToState,
  isCareerSettled,
  isFinalized,
  legendaryUnlockId,
  recordExpeditionCareerResult,
  runId,
  state.unlocks
])
```

`Band HQ` and `Next Tour` remain disabled until `settledRunIds` contains the run id. A failed Legendary storage write therefore cannot mint Tour Tokens or permit progression past Run Summary.

Mandatory golden-path cases:

```text
successful finale + marker write succeeds -> marker/state commit -> career settles once
successful finale + marker write fails -> no settledRunId, no Tour Tokens, controls disabled
retry after storage recovers -> marker persists -> career settles once
reload after marker persisted but before career settlement -> settles once
voluntary extraction/failure -> no Legendary barrier, normal career settlement
StrictMode double effect -> no duplicate marker or Tour Tokens
```

---

# G6-A — Update the Authoritative Simulator Agent Instructions at the Horizon Cutover

## Amendment 11: `scripts/AGENTS.md` changes in the same semantic-cutover task

**Amends:** G6 Task 4.

Add to that task's file list and commit:

```text
Modify: scripts/AGENTS.md
```

Replace the old ten-hop/day-horizon instruction when v15 becomes active. The resulting Balance Simulations section must state:

```markdown
- Balance harnesses import canonical reducers, action creators, configs, economy/fame helpers, event data, and minigame logic instead of reimplementing mechanics.
- Frozen v14 artifacts retain the historical ten-hop / `daysPerRun: 10` semantics and `#first-income-full-reports-v1` namespace.
- Live v15 Expedition reports use production `TourTypeDefinition.mapDepth`, extraction windows, and terminal `extracted` / `completed` / `failed` outcomes. `SIMULATION_CONSTANTS.daysPerRun` must not control v15.
- v15 uses `#roguelite-expedition-v1`; changing a namespace creates a new unpaired cohort.
- Progression checkpoints are route-step checkpoints, not day checkpoints. Missing late checkpoints from already-terminal runs are missing observations, never zeros.
```

Keep the existing canonical-helper, RNG-reset, experiment-integrity and provenance requirements unless a v15 task explicitly updates them.

The G6 cutover is not complete until the nested instruction file and simulator tests describe the same horizon semantics.

---

# G6-B — Paired Extraction Requires Calibration and Holdout Cohorts

## Amendment 12: Generate two disjoint paired-probe populations

**Amends:** G6 Tasks 8, 13 and 14.

Use:

```js
export const EXTRACTION_PROBE_RUNS_PER_PROFILE = 2000
export const EXTRACTION_PROBE_NAMESPACES = Object.freeze({
  calibration: '#roguelite-expedition-v1#paired-extraction#calibration',
  holdout: '#roguelite-expedition-v1#paired-extraction#holdout'
})
```

Seed builder:

```js
export const buildExtractionProbeSeed = (
  cohort: 'calibration' | 'holdout',
  profileId: string,
  extractionStep: number,
  runIndex: number
): number => createScenarioSeed(
  `${profileId}:${extractionStep}:${EXTRACTION_PROBE_NAMESPACES[cohort]}`,
  runIndex
)
```

Generate 2,000 paired snapshots per applicable profile/window **for each cohort**. Each snapshot still clones into Extract and Continue branches; calibration and holdout additionally use different seed namespaces.

Report structure:

```js
{
  runsPerProfilePerCohort: 2000,
  namespaces: EXTRACTION_PROBE_NAMESPACES,
  calibration: { profileResults, decisionDominance },
  holdout: { profileResults, decisionDominance },
  blockingDecisionDominance: []
}
```

A blocking finding exists only when the same `(profileId, extractionStep, winningDecision)` reaches the configured dominance definition in **both** cohorts. Do not union unrelated calibration/holdout winners.

Update G6 Task 13 generation expectations:

```text
- calibration probe: 2,000 paired states per applicable profile/window
- holdout probe: 2,000 disjoint paired states per applicable profile/window
```

Update G6 Task 14 assertions:

```js
assert.equal(probe.runsPerProfilePerCohort, 2000)
assert.equal(
  probe.namespaces.calibration,
  '#roguelite-expedition-v1#paired-extraction#calibration'
)
assert.equal(
  probe.namespaces.holdout,
  '#roguelite-expedition-v1#paired-extraction#holdout'
)
assert.equal(probe.calibration.profileResults.length, 6)
assert.equal(probe.holdout.profileResults.length, 6)
assert.equal(probe.blockingDecisionDominance.length, 0)
```

Add a determinism test proving the same cohort/profile/step/index reproduces, plus a disjointness test proving calibration and holdout seeds differ for the same profile/step/index.

---

# Hardening verification gate

Before the plan is considered implementation-ready, verify the plan text itself against these contracts:

- [ ] `START_EXPEDITION` reducer revalidates the canonical loadout.
- [ ] Rest-in-Van daily bankruptcy has an explicit post-commit Run Summary route.
- [ ] Repair actions do not carry price/next-condition/materialized-defect values.
- [ ] Cargo purchase actions do not carry caller-owned price/capacity.
- [ ] Injury actions do not carry caller-owned next stage.
- [ ] Obligation settlement actions do not carry reward/penalty values.
- [ ] Finale actions do not carry caller-selected finale type.
- [ ] HQ facility purchases have a typed reducer boundary and canonical registry.
- [ ] Unlock-set BEGIN rechecks its required facility.
- [ ] Archive discovery is in `ActionTypes` + `GameAction` and uses `Extract<...>`.
- [ ] Legendary persistence succeeds before `RECORD_EXPEDITION_CAREER_RESULT` can settle the run.
- [ ] G6 updates `scripts/AGENTS.md` in the horizon-cutover task.
- [ ] Paired extraction has separate 2,000-run calibration and holdout cohorts.

Run the plan's existing type/test commands after each implementation amendment. No hardening item may be weakened merely to make an existing test green; update the affected child-plan tests to exercise the corrected contract.