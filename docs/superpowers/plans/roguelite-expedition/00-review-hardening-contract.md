# Roguelite Expedition Review Hardening Contract

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to apply this contract before the affected child-plan gate. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the final deep-review gaps in the Roguelite Expedition implementation plan before production implementation begins.

**Architecture:** This file is a binding amendment to `01-expedition-core-extraction.md` through `06-balance-simulator-recalibration.md`. When an older child-plan snippet conflicts with a contract below, **this file wins** and the affected child task must use the replacement contract here. The amendments preserve repository ownership rules: reducers remain authoritative, navigation stays outside reducers, `unlockManager` remains the capability-persistence owner, and simulator calibration/holdout streams remain disjoint.

**Tech Stack:** React 19, TypeScript 6, typed `GameAction`/`ActionTypes`, reducer/action-creator architecture, existing storage adapter and `unlockManager`, Node/Vitest/Playwright tests, deterministic balance harness.

---

## Mandatory execution order

Apply these amendments at the named gate before continuing to dependent work:

1. **G1-A** after G1 Task 4 and while completing G1 Task 11, before the G1 stage gate.
2. **G2-A** while implementing G2 Tasks 8 and 11, before the G2 stage gate.
3. **G3-A** while implementing G3 staged injury actions, before the G3 stage gate.
4. **G4-A** while implementing obligation settlement and contextual finales, before the G4 stage gate.
5. **G5-A/B/C** before the G5 stage gate.
6. **G6-A/B** before any v15 report is accepted as release evidence.

No dependent gate may be considered green while its amendment is unapplied.

---

## Global invariant: reducers are authoritative

Every new action carries **intent plus only genuinely nondeterministic tokens** that cannot be regenerated in a reducer, such as a creator-generated UUID or a deterministic roll. Actions must not trust caller-computed prices, rewards, next-state values, capacity, rank, finale type, or other deterministic results.

For every affected boundary:

```text
Action creator
  -> validate obvious caller input
  -> generate only UUID/seed/roll tokens when needed
  -> optionally call the shared pure resolver for early rejection

Reducer
  -> revalidate current state and canonical registry ids
  -> recompute deterministic results from current canonical state/config
  -> reject stale/forged payloads with the identical state reference
  -> apply the mutation exactly once
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

`START_EXPEDITION` keeps the creator-generated `runId`, because reducers must not generate IDs. The reducer nevertheless validates that id and the loadout independently. Define the exact UUID guard beside the lifecycle reducer helpers:

```ts
const EXPEDITION_RUN_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
```

Use the canonical G1 loadout validator again inside the reducer:

```ts
export const handleStartExpedition = (
  state: GameState,
  payload: StartExpeditionPayload
): GameState => {
  if (state.expedition.status !== 'preparing') return state
  if (
    typeof payload.runId !== 'string' ||
    !EXPEDITION_RUN_ID_RE.test(payload.runId)
  ) {
    return state
  }

  const validated = validateExpeditionLoadout(state, payload.loadout)
  if (!validated.valid) return state

  return {
    ...state,
    gameMap: null,
    currentGig: null,
    lastGigStats: null,
    activeEvent: null,
    pendingEvents: [],
    eventCooldowns: [],
    rivalBand: null,
    expedition: {
      ...createDefaultExpeditionState(),
      status: 'active',
      runId: payload.runId,
      loadout: validated.loadout,
      startingMoney: finiteNumberOr(state.player.money, 0),
      startingFame: finiteNumberOr(state.player.fame, 0)
    }
  }
}
```

Later G2/G5 extensions to this start transition must keep the same reducer-side `validateExpeditionLoadout(state, payload.loadout)` call and then materialize cargo/insurance/starter effects from `validated.loadout`, never the raw payload object.

Add direct-action tests for a locked region/tour id, duplicate crew id, cargo overflow, invalid chassis id and malformed `runId`; each returns the original state reference.

## Amendment 2: Route Rest-in-Van bankruptcy after the committed day tick

**Amends:** G1 Task 11.

The Arrival path cannot be the only daily-bankruptcy router because the current `useVanMaintenance.handleRestInVan()` calls `advanceDay()` directly and does not create `pendingRouteRef`.

**Files:**
- Modify: `src/hooks/travel/types.ts`
- Modify: `src/hooks/travel/index.ts`
- Modify: `src/hooks/travel/useVanMaintenance.ts`
- Modify: `src/scenes/Overworld.tsx`
- Test: `tests/ui/useVanMaintenance.test.tsx`
- Keep: `tests/ui/useArrivalLogic.test.jsx`
- Keep: `tests/node/advanceDayAssetIntegration.test.js`

Extend `TravelLogicParams` and `VanMaintenanceParams` with exactly these members:

```ts
expeditionStatus: GameState['expedition']['status']
saveGameAfterStateCommit: () => void
```

`VanMaintenanceParams` also receives the already-canonical day value:

```ts
currentDay: number
changeScene: (scene: GamePhase) => void
```

`Overworld` selects the Expedition status and passes the existing G1 `saveGameAfterStateCommit` action into `useTravelLogic`:

```tsx
const expeditionStatus = useGameSelector(state => state.expedition.status)
const {
  saveGameAfterStateCommit,
  changeScene,
  // keep the remaining existing actions unchanged
} = useGameActions()

useTravelLogic({
  // keep the remaining existing arguments unchanged
  expeditionStatus,
  saveGameAfterStateCommit,
  changeScene
})
```

`useTravelLogic` passes the live values into `useVanMaintenance`:

```ts
const { handleRefuel, handleRepair, handleRestInVan } = useVanMaintenance({
  isTravelingRef: refs.isTravelingRef,
  player: params.player,
  band: params.band,
  updatePlayer: params.updatePlayer,
  updateBand: params.updateBand,
  advanceDay: params.advanceDay,
  dailyObligations,
  addToast: params.addToast,
  currentDay: finiteNumberOr(params.player.day, 0),
  expeditionStatus: params.expeditionStatus,
  saveGameAfterStateCommit: params.saveGameAfterStateCommit,
  changeScene: params.changeScene
})
```

In `useVanMaintenance.ts`, import `useEffect` and `GAME_PHASES`, then add a committed-day target:

```ts
const pendingRestDayRef = useRef<number | null>(null)
```

On the **second/confirmed** Rest-in-Van click, immediately before the existing `updateBand({ members: newMembers })` / `advanceDay()` calls, set:

```ts
pendingRestDayRef.current = Math.max(0, Math.trunc(currentDay)) + 1
```

After `handleRestInVan`, add this effect:

```ts
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

The target is cleared as soon as the committed day is observed, even when the run remains active. That prevents a normal rest from leaving a stale flag that could route a later unrelated failure.

Add one UI integration test for:

```text
active Expedition
-> confirm Rest in Van
-> ADVANCE_DAY commits daily bankruptcy
-> expedition.status becomes failed
-> post-commit rest effect requests save
-> currentScene becomes RUN_SUMMARY
```

Add a second test proving a normal rest reaches the next day, clears the pending target and does not route when a later unrelated render reports `failed`.

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

Add the exact aggregate resolver result to `src/domain/expedition/repairs.ts`:

```ts
export interface ResolvedExpeditionRepair {
  nextTargetCondition: number
  nextSourceCondition: number | null
  moneyCost: number
  sparePartsConsumed: number
  hiddenDefect: HiddenDefectState | null
}

export const resolveExpeditionRepairIntent = (
  state: GameState,
  payload: RepairExpeditionConditionPayload
): ResolvedExpeditionRepair | null
```

The resolver derives everything from current state and existing G2 pure helpers:

```text
professional -> `getProfessionalRepairCost(currentTarget)` + target 90
field        -> current spare parts + current vehicle/crew field-repair efficiency + `resolveFieldRepair`
improvised   -> `resolveImprovisedRepair` + defect id from `DEFECT_BY_GROUP[target]` + severity from bounded `defectRoll`
cannibalize  -> current source/target through `resolveCannibalizeRepair`
```

The reducer first checks that the current target/source conditions equal `expectedTargetCondition` / `expectedSourceCondition`, then calls `resolveExpeditionRepairIntent(state, payload)` itself and applies only that canonical result. A replay or stale action is a no-op.

Required hostile tests:

```text
professional repair with insufficient current money -> identical state
field repair with zero current spare parts -> identical state
stale expected target/source condition -> identical state
invalid mode/group/source combination -> identical state
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

Quantity is exactly one for this v1 action. The reducer derives price and capacity:

```ts
const price = payload.kind === 'spareParts'
  ? EXPEDITION_SUPPLY_PRICES.sparePart
  : EXPEDITION_SUPPLY_PRICES.supply
const vehicle = getExpeditionVehicleState(state)
const capacity = getExpeditionCargoCapacity(vehicle.cargoCapacityBonus)
const used = getExpeditionCargoUsed(state.expedition.cargo)
```

It rejects when the Expedition is not active, `used !== payload.expectedUsedSlots`, `used + 1 > capacity`, current money is below `price`, or `kind` is invalid. The payload has no caller-owned `moneyCost`, `capacity`, or quantity.

Add direct reducer tests for a forged legacy-shaped cheap purchase, stale slot count and capacity overflow.

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

The creator validates the member and requires a finite `roll` in `[0, 1)`. The reducer revalidates the member, current stage and roll, derives current stamina from `state.band.members`, recomputes risk with the same G3 rule, and calls `advanceInjuryStage(current)` itself only when `roll < risk`.

Use one shared pure risk helper so creator tests, reducer and simulator cannot drift:

```ts
export const getPostGigInjuryRisk = (stamina: number): number =>
  stamina >= 35 ? 0 : stamina >= 20 ? 0.1 : 0.25
```

A direct action cannot jump from `none` to `serious` or `critical` because no next-stage field exists. Test stale expected stage, invalid member, non-finite/out-of-range roll and one-stage-only progression.

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

`createResolveExpeditionObligationAction(state, id)` may reject invalid requests early, but the reducer owns final settlement. It looks up the current obligation, requires `settled === false` and the expected status, then calls the canonical template/Brand-Deal settlement resolver to derive money/Fame/Heat/controversy deltas. No action may carry those values.

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

The action creator does not carry `finaleType`. Add a forged direct-action test showing a caller cannot force `rival_battle`, `illegal_show`, `corporate_showcase`, or `disaster_gig`.

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
  workshop: { id: 'workshop', maxLevel: 3, tokenCosts: [2, 4, 7] },
  rehearsal: { id: 'rehearsal', maxLevel: 3, tokenCosts: [2, 4, 7] },
  management: { id: 'management', maxLevel: 3, tokenCosts: [2, 4, 7] },
  garage: { id: 'garage', maxLevel: 3, tokenCosts: [2, 4, 7] },
  blackMarket: { id: 'blackMarket', maxLevel: 3, tokenCosts: [2, 4, 7] },
  crewLounge: { id: 'crewLounge', maxLevel: 3, tokenCosts: [2, 4, 7] }
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
PURCHASE_EXPEDITION_HQ_FACILITY:
  'PURCHASE_EXPEDITION_HQ_FACILITY'

export interface PurchaseExpeditionHqFacilityPayload {
  facilityId: HqFacilityId
  expectedLevel: number
}
```

The action creator validates the facility id and expected integer level, then returns `Extract<GameAction, { type: typeof ActionTypes.PURCHASE_EXPEDITION_HQ_FACILITY }>`.

The reducer validates the registry id, exact current level, max level and current Tour Tokens, derives the next-level cost from `HQ_FACILITIES[facilityId].tokenCosts[currentLevel]`, subtracts it once and increments exactly one level. The action never carries cost or next level.

`BEGIN_EXPEDITION_UNLOCK_SET_PURCHASE` must additionally revalidate the selected set's `requiredFacility` against current `career.hqFacilityLevels` **before** debiting tokens or creating the pending journal. UI visibility is not a progression boundary.

Required tests:

```text
facility purchase derives canonical cost
stale expected level -> no-op
insufficient tokens -> no-op
unknown facility -> no-op
mechanic set before Workshop L1 -> no-op
industry set before Management L1 -> no-op
underground set before Black Market L1 -> no-op
festival set before Garage L1 -> no-op
rival set before Garage L2 -> no-op
forged direct BEGIN cannot bypass facility requirement
```

---

# G5-B — Canonical Tour Archive Actions

## Amendment 9: Archive discovery belongs to `ActionTypes` and `GameAction`

**Replaces:** G5 Task 10 Step 3 action snippet.

**Files:**
- Modify: `src/domain/expedition/archive.ts`
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/types/game.d.ts`
- Modify: `src/context/careerActionCreators.ts`
- Modify: `src/context/reducers/careerReducer.ts`
- Modify: `src/context/useCareerDispatchActions.ts`
- Modify: `src/context/gameReducer.ts`
- Test: `tests/node/expeditionArchive.test.js`
- Test: `tests/node/actionCreatorSerialization.test.js`

Define the exact archive-key guard beside `addArchiveDiscovery`:

```ts
const CAREER_ARCHIVE_KEYS = new Set<keyof CareerArchive>([
  'crewIds',
  'moduleIds',
  'chassisIds',
  'rivalIds',
  'sponsorIds',
  'regionIds',
  'finaleIds',
  'eventIds',
  'contrabandIds'
])

export const isCareerArchiveKey = (
  value: unknown
): value is keyof CareerArchive =>
  typeof value === 'string' &&
  CAREER_ARCHIVE_KEYS.has(value as keyof CareerArchive)
```

Add the canonical action:

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

The reducer revalidates `key` and `id`, delegates to `addArchiveDiscovery`, and returns the identical state when unchanged. Add the corresponding `GameAction` member, root reducer-map entry, typed dispatch wrapper and serialization/malformed-direct-action coverage.

---

# G5-C — Legendary Reward Persistence Must Gate Career Settlement

## Amendment 10: One Run Summary settlement effect owns both barriers

**Replaces the independent settlement snippets in:** G5 Task 4 Step 8 and G5 Task 12 Step 2.

**Files:**
- Modify: `src/context/useCareerDispatchActions.ts`
- Modify: `src/scenes/RunSummary.tsx`
- Test: `tests/ui/RunSummary.test.tsx`
- Test: `tests/golden-path/expeditionMetaLoop.test.js`

Reuse the repository's existing `getUnlocks` / `addUnlock` persistence functions and `createAddUnlockAction`; do not invent a second unlock manager.

Extend `useCareerDispatchActions` with this exact helper, using the same injected `storage` adapter already required by G5 Task 3:

```ts
const persistExpeditionUnlockMarker = useCallback((unlockId: string): boolean => {
  const alreadyPersisted = getUnlocks(storage).includes(unlockId)
  const persisted = alreadyPersisted || addUnlock(unlockId, storage)
  if (!persisted) return false

  if (!stateRef.current.unlocks.includes(unlockId)) {
    dispatch(createAddUnlockAction(unlockId))
  }
  return true
}, [dispatch, stateRef, storage])
```

Expose `persistExpeditionUnlockMarker` together with the existing `recordExpeditionCareerResult` callback.

`RunSummary` owns exactly one settlement effect. Use local UI retry state so a hard storage failure does not spin every render but the player can retry without leaving the scene:

```tsx
const [legendaryPersistenceFailed, setLegendaryPersistenceFailed] =
  useState(false)

const runId = expedition.runId
const isFinalized = expedition.outcome !== null && expedition.status !== 'active'
const isCareerSettled =
  typeof runId === 'string' && career.settledRunIds.includes(runId)
const legendaryUnlockId =
  expedition.outcome?.kind === 'completed' && expedition.finaleType
    ? getLegendaryUnlockForFinale(expedition.finaleType)
    : null

useEffect(() => {
  if (
    !isFinalized ||
    typeof runId !== 'string' ||
    isCareerSettled ||
    legendaryPersistenceFailed
  ) {
    return
  }

  if (legendaryUnlockId && !state.unlocks.includes(legendaryUnlockId)) {
    const persisted = persistExpeditionUnlockMarker(legendaryUnlockId)
    if (!persisted) {
      setLegendaryPersistenceFailed(true)
    }
    return // wait for committed ADD_UNLOCK state before career settlement
  }

  recordExpeditionCareerResult()
}, [
  isCareerSettled,
  isFinalized,
  legendaryPersistenceFailed,
  legendaryUnlockId,
  persistExpeditionUnlockMarker,
  recordExpeditionCareerResult,
  runId,
  state.unlocks
])
```

The retry control is explicit:

```tsx
const retryLegendaryPersistence = () => {
  setLegendaryPersistenceFailed(false)
}

<RunSummaryCard
  // keep existing summary props
  settlementPending={!isCareerSettled}
  settlementError={legendaryPersistenceFailed}
  onRetrySettlement={
    legendaryPersistenceFailed ? retryLegendaryPersistence : undefined
  }
  onOpenBandHq={isCareerSettled ? openBandHq : undefined}
  onNextTour={isCareerSettled ? prepareNextExpedition : undefined}
/>
```

Because a successful marker write dispatches the already-existing `ADD_UNLOCK` action and the effect returns, career settlement cannot happen until the next committed render contains the Legendary id in `state.unlocks`. `Band HQ` and `Next Tour` remain disabled until `settledRunIds` contains the run id.

Mandatory golden-path cases:

```text
successful finale + marker write succeeds -> ADD_UNLOCK commits -> career settles once
successful finale + marker write fails -> no settledRunId, no Tour Tokens, controls disabled, Retry visible
Retry after storage recovers -> marker persists -> ADD_UNLOCK commits -> career settles once
reload after marker persisted but before career settlement -> marker recognized/state synchronized -> settles once
voluntary extraction/failure -> no Legendary barrier, normal career settlement
StrictMode double effect -> no duplicate marker or Tour Tokens
```

---

# G6-A — Update the Authoritative Simulator Agent Instructions at the Horizon Cutover

## Amendment 11: `scripts/AGENTS.md` changes in the same semantic-cutover task

**Amends:** G6 Task 4.

Add to that task's file list and commit:

```text
Modify: `scripts/AGENTS.md`
```

Replace the old ten-hop/day-horizon instruction when v15 becomes active. The resulting **Balance Simulations** section must state:

```markdown
- Balance harnesses import canonical reducers, action creators, configs, economy/fame helpers, event data, and minigame logic instead of reimplementing mechanics. A PreGig run executes exactly one setup minigame.
- Frozen v14 artifacts retain the historical ten-hop / `daysPerRun: 10` semantics and `#first-income-full-reports-v1` namespace.
- Live v15 Expedition reports use production `TourTypeDefinition.mapDepth`, extraction windows, and terminal `extracted` / `completed` / `failed` outcomes. `SIMULATION_CONSTANTS.daysPerRun` must not control v15.
- v15 uses `#roguelite-expedition-v1`; changing a namespace creates a new unpaired cohort.
- Progression checkpoints are route-step checkpoints, not day checkpoints. Missing late checkpoints from already-terminal runs are missing observations, never zeros.
```

Keep the existing RNG-reset, experiment-integrity and provenance requirements unless a v15 task explicitly updates them. Remove only statements whose controlling horizon is the live ten-hop/day model.

The G6 cutover is not complete until the nested instruction file and simulator tests describe the same v15 horizon semantics.

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
  cohort,
  profileId,
  extractionStep,
  runIndex
) => createScenarioSeed(
  `${profileId}:${extractionStep}:${EXTRACTION_PROBE_NAMESPACES[cohort]}`,
  runIndex
)
```

`cohort` is validated before this helper is called and must be exactly `'calibration'` or `'holdout'`.

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
calibration probe -> 2,000 paired states per applicable profile/window
holdout probe     -> 2,000 disjoint paired states per applicable profile/window
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

Add a determinism test proving the same cohort/profile/step/index reproduces and a disjointness test proving calibration and holdout seeds differ for the same profile/step/index.

---

# Hardening verification gate

Before the plan is considered implementation-ready, verify all of these statements against the canonical files:

- [ ] `START_EXPEDITION` reducer revalidates the canonical loadout and UUID.
- [ ] Rest-in-Van daily bankruptcy has an explicit post-commit Run Summary route.
- [ ] Repair actions do not carry price/next-condition/materialized-defect values.
- [ ] Cargo purchase actions do not carry caller-owned price/capacity/quantity.
- [ ] Injury actions do not carry caller-owned next stage.
- [ ] Obligation settlement actions do not carry reward/penalty values.
- [ ] Finale actions do not carry caller-selected finale type.
- [ ] HQ facility purchases have a typed reducer boundary and canonical registry.
- [ ] Unlock-set `BEGIN` rechecks its required facility.
- [ ] Archive discovery is in `ActionTypes` + `GameAction` and uses `Extract<...>`.
- [ ] Legendary marker persistence and committed `ADD_UNLOCK` state happen before `RECORD_EXPEDITION_CAREER_RESULT` can settle the run.
- [ ] G6 updates `scripts/AGENTS.md` in the horizon-cutover task.
- [ ] Paired extraction has separate 2,000-run calibration and holdout cohorts.

Run the child plan's existing type/test commands after each implementation amendment and add the direct-action tests named here. No hardening item may be weakened merely to make an older assertion green; update that child-plan assertion to exercise the corrected contract instead.
