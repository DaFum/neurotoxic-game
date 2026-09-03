# Expedition Core + Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add save-compatible Expedition/Career state, Tour Prep, an 8-hop standard expedition map, hybrid node intelligence, deterministic extraction windows, Run Summary, and a next-tour lifecycle without changing cash/fuel/stamina/harmony ownership.

**Architecture:** `expedition` owns run lifecycle, loadout references, fog/intel, reward settlement metadata and future run subsystems; `career` owns cross-tour progression. Main-menu new-game still performs a full reset, then routes to Tour Prep. Subsequent tours use a dedicated lifecycle action that preserves career/player/assets and rotates `runSeed`.

**Tech Stack:** TypeScript, React 19, reducer/action creators, Vitest, Node test runner, i18next, seeded `MapGenerator`.

---

## File Structure

**Create:**

- `reports/game-balance-simulation-pre-expedition-v14.json`
- `reports/game-balance-simulation-pre-expedition-v14.md`
- `tests/node/preExpeditionBalanceBaseline.test.js`
- `src/types/expedition.d.ts`
- `src/types/career.d.ts`
- `src/domain/expedition/defaults.ts`
- `src/domain/expedition/extraction.ts`
- `src/domain/expedition/loadout.ts`
- `src/domain/expedition/nodeIntel.ts`
- `src/data/expedition/tourTypes.ts`
- `src/data/expedition/regions.ts`
- `src/context/reducers/expeditionSanitizers.ts`
- `src/context/reducers/careerSanitizers.ts`
- `src/context/reducers/expeditionReducer.ts`
- `src/context/expeditionActionCreators.ts`
- `src/context/useExpeditionDispatchActions.ts`
- `src/scenes/TourPrep.tsx`
- `src/scenes/RunSummary.tsx`
- `src/ui/expedition/TourPrepLoadout.tsx`
- `src/ui/expedition/ExpeditionStatusStrip.tsx`
- `src/ui/expedition/ExtractionDialog.tsx`
- `src/ui/expedition/RunSummaryCard.tsx`
- `src/context/reducers/migrations/v2_to_v3.ts`
- `tests/node/expeditionDefaults.test.js`
- `tests/node/expeditionSanitizers.test.js`
- `tests/node/expeditionReducer.test.js`
- `tests/node/expeditionExtraction.test.js`
- `tests/node/expeditionNodeIntel.test.js`
- `tests/ui/TourPrep.test.tsx`
- `tests/ui/ExtractionDialog.test.tsx`
- `tests/ui/RunSummary.test.tsx`
- `tests/golden-path/expeditionCore.test.js`

**Modify:**

- `src/types/index.ts`
- `src/types/game.d.ts:109-162`
- `src/types/actions.d.ts`
- `src/context/initialState.ts:244-352`
- `src/context/actionTypes.ts`
- `src/context/gameReducer.ts`
- `src/context/useGameDispatchActions.ts`
- `src/context/GameState.tsx:250-280`
- `src/context/usePersistence.ts:65-101`
- `src/context/reducers/systemReducer.ts:147-340, 520-650`
- `src/context/reducers/migrations/index.ts`
- `.claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js`
- `src/context/gameConstants.ts:9-32`
- `src/components/SceneRouter.tsx`
- `src/scenes/mainmenu/hooks/useMainMenuStart.ts:45-75`
- `src/context/useMapGeneration.ts:48-180`
- `src/utils/fallbackMap.ts`
- `src/scenes/Overworld.tsx`
- `src/components/overworld/OverworldMap.tsx:118-195`
- `src/components/MapNodeView.tsx:152-269, 275-511`
- `src/ui/overworld/OverworldHUD.tsx`
- `src/hooks/useArrivalLogic.ts:153-246`
- `src/hooks/postGig/handlers/useContinueHandler.ts:78-190`
- `src/hooks/postGig/handlers/continueHandlerUtils.ts:160-195`
- `public/locales/en/ui.json`
- `public/locales/de/ui.json`
- `tests/node/saveMigrations.test.js`
- `tests/node/saveSliceRoundTrip.test.js`
- `tests/node/playwright-screenshot-fixture-validation.test.js`
- `tests/node/fallbackMap.test.js`
- `tests/node/mapGenerator.test.js`
- `tests/ui/MapNode.test.jsx`
- `tests/ui/OverworldHUD.test.jsx`
- `tests/ui/SceneRouter.test.jsx`
- `tests/ui/MainMenu.test.jsx`
- `tests/ui/useArrivalLogic.test.jsx`
- `tests/ui/postGigHandlerLogic.test.jsx`

---


### Task 0: Freeze the Reviewed Pre-Expedition Balance Baseline

**Files:**
- Read/Copy: `reports/game-balance-simulation-results.json`
- Read/Copy: `reports/game-balance-simulation-analysis.md`
- Create: `reports/game-balance-simulation-pre-expedition-v14.json`
- Create: `reports/game-balance-simulation-pre-expedition-v14.md`
- Create: `tests/node/preExpeditionBalanceBaseline.test.js`

This task runs before any production or simulator change in G0/G1. Later plans may add metrics to the live report, so copying the "current" report at G6 would no longer prove what the pre-Expedition game did.

- [ ] **Step 1: Write the failing immutable-baseline test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const BASELINE = 'reports/game-balance-simulation-pre-expedition-v14.json'

test('frozen pre-expedition balance baseline preserves the v14 horizon', () => {
  assert.equal(fs.existsSync(BASELINE), true)
  const payload = JSON.parse(fs.readFileSync(BASELINE, 'utf8'))
  assert.equal(payload.constants.reportVersion, 14)
  assert.equal(payload.constants.seedNamespace, '#first-income-full-reports-v1')
  assert.equal(payload.constants.daysPerRun, 10)
  assert.equal(payload.metadata.runsPerScenario, 2000)
})
```

- [ ] **Step 2: Run the test and verify it fails because the frozen artifact does not exist**

```bash
node --test tests/node/preExpeditionBalanceBaseline.test.js
```

Expected: FAIL on `fs.existsSync(BASELINE) === false`.

- [ ] **Step 3: Copy the reviewed v14 artifacts byte-for-byte**

```bash
cp reports/game-balance-simulation-results.json reports/game-balance-simulation-pre-expedition-v14.json
cp reports/game-balance-simulation-analysis.md reports/game-balance-simulation-pre-expedition-v14.md
```

Do not regenerate the source report first. These files capture the exact reviewed pre-Expedition simulator state.

- [ ] **Step 4: Re-run the test**

```bash
node --test tests/node/preExpeditionBalanceBaseline.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit the historical evidence before all feature work**

```bash
git add reports/game-balance-simulation-pre-expedition-v14.json reports/game-balance-simulation-pre-expedition-v14.md tests/node/preExpeditionBalanceBaseline.test.js
git commit -m "chore(balance): freeze pre-expedition v14 baseline"
```

---

### Task 1: Define Stable Expedition and Career State Shapes

**Files:**
- Create: `src/types/expedition.d.ts`
- Create: `src/types/career.d.ts`
- Modify: `src/types/index.ts`
- Modify: `src/types/game.d.ts:109-162`
- Create: `src/domain/expedition/defaults.ts`
- Test: `tests/node/expeditionDefaults.test.js`

- [ ] **Step 1: Write the failing defaults test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createDefaultCareerState,
  createDefaultExpeditionState
} from '../../src/domain/expedition/defaults.ts'

test('expedition defaults are fresh and start in preparation-safe idle state', () => {
  const a = createDefaultExpeditionState()
  const b = createDefaultExpeditionState()
  assert.equal(a.status, 'idle')
  assert.equal(a.routeStep, 0)
  assert.deepEqual(a.visitedNodeIds, [])
  assert.notStrictEqual(a.visitedNodeIds, b.visitedNodeIds)
  assert.deepEqual(a.pressure, { heat: 0, exposure: 0 })
})

test('career defaults start with no duplicated unlock state', () => {
  const career = createDefaultCareerState()
  assert.equal(career.rankId, 'unknown')
  assert.equal(career.tourTokens, 0)
  assert.deepEqual(career.crewProgressById, {})
  assert.deepEqual(career.archive.regionIds, ['home'])
})
```

- [ ] **Step 2: Run the test and verify it fails because the module does not exist**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionDefaults.test.js
```

Expected: FAIL with module-not-found for `src/domain/expedition/defaults.ts`.

- [ ] **Step 3: Add the exact state types**

`src/types/expedition.d.ts`:

```ts
export type ExpeditionStatus =
  | 'idle'
  | 'preparing'
  | 'active'
  | 'extracted'
  | 'completed'
  | 'failed'

export type ConditionGroup = 'pa' | 'instruments' | 'stageGear'
export type CrewStressStatus = 'calm' | 'strained' | 'critical' | 'breaking'
export type InjuryStage = 'none' | 'strain' | 'light' | 'serious' | 'critical'
export type ObligationStatus = 'active' | 'completed' | 'failed'
export type NodeIntelLevel = 0 | 1 | 2

export interface ExpeditionCargoLoadout {
  spareParts: number
  supplies: number
  merchSlots: number
  contrabandSlots: number
}

export interface ExpeditionLoadout {
  tourTypeId: string
  regionId: string
  activeTourbusAssetId: string | null
  crewIds: string[]
  cargo: ExpeditionCargoLoadout
  starterPerkId: string | null
  contractIds: string[]
  pressureModifierIds: string[]
}

export interface HiddenDefectState {
  id: string
  group: ConditionGroup
  severity: 'minor' | 'major'
  discovered: boolean
}

export interface ExpeditionConditionState {
  pa: number
  instruments: number
  stageGear: number
  hiddenDefects: HiddenDefectState[]
}

export interface ExpeditionCrewRunState {
  stress: number
  stressStatus: CrewStressStatus
  injuryStage: InjuryStage
  runTraitIds: string[]
}

export interface ActiveObligationState {
  id: string
  templateId: string
  sourceType: 'brandDeal' | 'expedition' | 'crew' | 'rival'
  sourceId: string | null
  status: ObligationStatus
  progress: number
  target: number
}

export interface ExpeditionOutcome {
  kind: 'extracted' | 'completed' | 'failed'
  reason: string
  retentionRate: number
  finalMoney: number
  finalFame: number
}

export interface ExpeditionState {
  status: ExpeditionStatus
  runId: string | null
  routeStep: number
  visitedNodeIds: string[]
  intelByNodeId: Record<string, NodeIntelLevel>
  loadout: ExpeditionLoadout
  startingMoney: number
  startingFame: number
  unsecuredRewardIds: string[]
  securedRewardIds: string[]
  pressure: { heat: number; exposure: number }
  condition: ExpeditionConditionState
  crewRunById: Record<string, ExpeditionCrewRunState>
  activeObligations: ActiveObligationState[]
  draftTraitIds: string[]
  extractionWindowsSeen: number[]
  outcome: ExpeditionOutcome | null
}
```

`src/types/career.d.ts`:

```ts
import type { InjuryStage } from './expedition'

export type CrewRelationshipTier = 'bonded' | 'neutral' | 'tense' | 'hostile'

export interface CareerCrewProgress {
  loyalty: number
  storyStep: number
  signatureTraitIds: string[]
}

export interface CareerRivalHistory {
  relationship: 'unknown' | 'competitive' | 'rival' | 'nemesis' | 'respect' | 'alliance'
  nemesisLevel: number
  encounterCount: number
  lastOutcome: string | null
}

export interface CareerArchive {
  crewIds: string[]
  moduleIds: string[]
  chassisIds: string[]
  rivalIds: string[]
  sponsorIds: string[]
  regionIds: string[]
  finaleIds: string[]
  eventIds: string[]
  contrabandIds: string[]
}

export interface CareerState {
  rankId: string
  tourTokens: number
  crewProgressById: Record<string, CareerCrewProgress>
  crewRelationshipByPair: Record<string, CrewRelationshipTier>
  persistentInjuriesByMemberId: Record<string, InjuryStage>
  rivalHistoryById: Record<string, CareerRivalHistory>
  archive: CareerArchive
  hqFacilityLevels: Record<string, number>
  ascensionUnlocked: boolean
}
```

- [ ] **Step 4: Add fresh default factories**

`src/domain/expedition/defaults.ts`:

```ts
import type { CareerState, ExpeditionState } from '../../types'

export const createDefaultExpeditionState = (): ExpeditionState => ({
  status: 'idle',
  runId: null,
  routeStep: 0,
  visitedNodeIds: [],
  intelByNodeId: {},
  loadout: {
    tourTypeId: 'standard',
    regionId: 'home',
    activeTourbusAssetId: null,
    crewIds: [],
    cargo: { spareParts: 0, supplies: 0, merchSlots: 0, contrabandSlots: 0 },
    starterPerkId: null,
    contractIds: [],
    pressureModifierIds: []
  },
  startingMoney: 0,
  startingFame: 0,
  unsecuredRewardIds: [],
  securedRewardIds: [],
  pressure: { heat: 0, exposure: 0 },
  condition: { pa: 100, instruments: 100, stageGear: 100, hiddenDefects: [] },
  crewRunById: {},
  activeObligations: [],
  draftTraitIds: [],
  extractionWindowsSeen: [],
  outcome: null
})

export const createDefaultCareerState = (): CareerState => ({
  rankId: 'unknown',
  tourTokens: 0,
  crewProgressById: {},
  crewRelationshipByPair: {},
  persistentInjuriesByMemberId: {},
  rivalHistoryById: {},
  archive: {
    crewIds: [], moduleIds: [], chassisIds: [], rivalIds: [], sponsorIds: [],
    regionIds: ['home'], finaleIds: [], eventIds: [], contrabandIds: []
  },
  hqFacilityLevels: {},
  ascensionUnlocked: false
})
```

Export both type files from `src/types/index.ts` and add required `expedition`/`career` fields to `GameState`.

- [ ] **Step 5: Run the test and typecheck**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionDefaults.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/types src/domain/expedition/defaults.ts tests/node/expeditionDefaults.test.js
git commit -m "feat(expedition): define run and career state"
```

---

### Task 2: Sanitize Expedition and Career Save Boundaries

**Files:**
- Create: `src/context/reducers/expeditionSanitizers.ts`
- Create: `src/context/reducers/careerSanitizers.ts`
- Test: `tests/node/expeditionSanitizers.test.js`

- [ ] **Step 1: Write hostile-input tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeExpeditionState } from '../../src/context/reducers/expeditionSanitizers.ts'
import { sanitizeCareerState } from '../../src/context/reducers/careerSanitizers.ts'

test('expedition sanitizer rejects non-finite pressure and unknown status', () => {
  const value = sanitizeExpeditionState({
    status: 'hacked',
    pressure: { heat: Infinity, exposure: -50 },
    routeStep: -12
  })
  assert.equal(value.status, 'idle')
  assert.deepEqual(value.pressure, { heat: 0, exposure: 0 })
  assert.equal(value.routeStep, 0)
})

test('career sanitizer blocks prototype keys and clamps negative tokens', () => {
  const value = sanitizeCareerState({
    tourTokens: -99,
    rivalHistoryById: { __proto__: { nemesisLevel: 99 } }
  })
  assert.equal(value.tourTokens, 0)
  assert.deepEqual(value.rivalHistoryById, {})
})
```

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionSanitizers.test.js
```

Expected: FAIL because sanitizer modules are missing.

- [ ] **Step 3: Implement strict sanitizers using project guards**

Use `isLooseRecord`, `isFiniteNumber`, `isForbiddenKey`, `finiteNumberOr`, and the default factories. Clamp Heat/Exposure/Condition/Stress to `0..100`, route steps and counters to non-negative integers, array ids to safe strings, and unknown enum values back to defaults. Do not use `Number(value)` coercion.

The public surface must be exactly:

```ts
export const sanitizeExpeditionState = (value: unknown): ExpeditionState
export const sanitizeCareerState = (value: unknown): CareerState
```

- [ ] **Step 4: Run sanitizer tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionSanitizers.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/context/reducers/*Sanitizers.ts tests/node/expeditionSanitizers.test.js
git commit -m "feat(expedition): sanitize persistent run state"
```

---

### Task 3: Add Save Version 3 and Round-Trip Both New Slices

**Files:**
- Modify: `src/context/initialState.ts:244-352`
- Modify: `src/context/usePersistence.ts:65-101`
- Modify: `src/context/reducers/systemReducer.ts:147-262`
- Modify: `src/context/reducers/migrations/index.ts`
- Create: `src/context/reducers/migrations/v2_to_v3.ts`
- Modify: `.claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js`
- Modify tests: `tests/node/saveMigrations.test.js`, `tests/node/saveSliceRoundTrip.test.js`, `tests/node/playwright-screenshot-fixture-validation.test.js`

- [ ] **Step 1: Add failing save round-trip assertions**

Extend `saveSliceRoundTrip.test.js` so a save containing:

```js
expedition: {
  ...createDefaultExpeditionState(),
  status: 'active',
  routeStep: 4,
  pressure: { heat: 33, exposure: 61 }
},
career: {
  ...createDefaultCareerState(),
  tourTokens: 7,
  archive: {
    ...createDefaultCareerState().archive,
    regionIds: ['home', 'industrial']
  }
}
```

loads with those values intact while malformed values sanitize back to defaults. Expedition capability unlocks themselves remain owned by `state.unlocks`/`unlockManager`; `career` stores progress and discovery history only.

- [ ] **Step 2: Add a failing v2-to-v3 migration test**

```js
assert.deepEqual(migrateV2ToV3({ version: 2, player: { money: 500 } }), {
  version: 3,
  player: { money: 500 },
  expedition: createDefaultExpeditionState(),
  career: createDefaultCareerState()
})
```

- [ ] **Step 3: Implement migration and persistence wiring**

`v2_to_v3.ts` must be pure:

```ts
import { isLooseRecord } from '../../../utils/gameState'
import {
  createDefaultCareerState,
  createDefaultExpeditionState
} from '../../../domain/expedition/defaults'

export const migrateV2ToV3 = (value: unknown): unknown => {
  if (!isLooseRecord(value)) return value
  return {
    ...value,
    version: 3,
    expedition: Object.hasOwn(value, 'expedition')
      ? value.expedition
      : createDefaultExpeditionState(),
    career: Object.hasOwn(value, 'career')
      ? value.career
      : createDefaultCareerState()
  }
}
```

Update `CURRENT_SAVE_VERSION` to `3`, append `{ to: 3, migrate: migrateV2ToV3 }`, add `expedition` and `career` to `PERSISTED_FIELDS`, add sanitized fields in `handleLoadGame`, and create fresh defaults in both `initialState` and `createInitialState`.

- [ ] **Step 4: Update screenshot fixture with fresh default objects**

Add the exact default state fields to `BASE_STATE`; do not share mutable arrays between fixture invocations. Use literal fresh structures in the fixture factory:

```js
const createFixtureExpedition = () => ({
  status: 'idle', routeStep: 0,
  visitedNodeIds: [], intelByNodeId: {},
  loadout: {
    tourTypeId: 'standard', regionId: 'home', activeTourbusAssetId: null,
    crewIds: [], cargo: { spareParts: 0, supplies: 0, merchSlots: 0, contrabandSlots: 0 },
    starterPerkId: null, contractIds: [], pressureModifierIds: []
  },
  startingMoney: 0, startingFame: 0, unsecuredRewardIds: [], securedRewardIds: [],
  pressure: { heat: 0, exposure: 0 },
  condition: { pa: 100, instruments: 100, stageGear: 100, hiddenDefects: [] },
  crewRunById: {}, activeObligations: [], draftTraitIds: [], extractionWindowsSeen: [], outcome: null
})
const createFixtureCareer = () => ({
  rankId: 'unknown', tourTokens: 0, crewProgressById: {}, crewRelationshipByPair: {},
  persistentInjuriesByMemberId: {}, rivalHistoryById: {},
  archive: { crewIds: [], moduleIds: [], chassisIds: [], rivalIds: [], sponsorIds: [], regionIds: ['home'], finaleIds: [], eventIds: [], contrabandIds: [] },
  hqFacilityLevels: {}, ascensionUnlocked: false
})

export const BASE_STATE = {
  // existing fields...
  expedition: createFixtureExpedition(),
  career: createFixtureCareer()
}
```

- [ ] **Step 5: Run save/fixture gates**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/saveMigrations.test.js tests/node/saveSliceRoundTrip.test.js tests/node/playwright-screenshot-fixture-validation.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/context .claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js tests/node/saveMigrations.test.js tests/node/saveSliceRoundTrip.test.js tests/node/playwright-screenshot-fixture-validation.test.js
git commit -m "feat(expedition): persist run and career state"
```

---

### Task 4: Add Expedition Reducer and Typed Lifecycle Actions

**Files:**
- Modify: `src/context/actionTypes.ts`
- Create: `src/context/expeditionActionCreators.ts`
- Create: `src/context/reducers/expeditionReducer.ts`
- Create: `src/context/useExpeditionDispatchActions.ts`
- Modify: `src/context/gameReducer.ts`
- Modify: `src/context/useGameDispatchActions.ts`
- Modify: `src/types/game.d.ts`
- Modify: `src/types/actions.d.ts`
- Test: `tests/node/expeditionReducer.test.js`

- [ ] **Step 1: Write reducer tests for preparation, start and replay guards**

Pin these behaviors:

```js
const preparing = gameReducer(initial, createPrepareExpeditionAction())
assert.equal(preparing.expedition.status, 'preparing')

const started = gameReducer(
  preparing,
  createStartExpeditionAction(preparing, validLoadout)
)
assert.equal(started.expedition.status, 'active')
assert.match(started.expedition.runId, /^[0-9a-f-]{36}$/i)
assert.equal(started.expedition.startingMoney, preparing.player.money)
assert.equal(started.expedition.startingFame, preparing.player.fame)

const replay = gameReducer(started, createStartExpeditionAction(started, validLoadout))
assert.strictEqual(replay, started)
```

- [ ] **Step 2: Add action discriminants**

```ts
PREPARE_EXPEDITION: 'PREPARE_EXPEDITION',
START_EXPEDITION: 'START_EXPEDITION',
RECORD_EXPEDITION_ARRIVAL: 'RECORD_EXPEDITION_ARRIVAL',
REVEAL_NODE_INTEL: 'REVEAL_NODE_INTEL',
FINALIZE_EXPEDITION: 'FINALIZE_EXPEDITION',
PREPARE_NEXT_EXPEDITION: 'PREPARE_NEXT_EXPEDITION'
```

- [ ] **Step 3: Implement narrow action creators**

`createStartExpeditionAction(state, loadout)` must call the pure loadout validator before constructing the action; invalid ids, duplicate crew ids, and non-integer cargo counts are rejected before dispatch. The action creator also stamps a stable `runId` with the existing `getSafeUUID()` helper; reducers never generate IDs. `createPrepareNextExpeditionAction()` stamps the fresh seed in the creator. Every new creator stays coupled to the canonical action union with `Extract<GameAction, ...>`:

```ts
export const createStartExpeditionAction = (
  state: GameState,
  candidate: unknown
): Extract<GameAction, { type: typeof ActionTypes.START_EXPEDITION }> => {
  const result = validateExpeditionLoadout(state, candidate)
  if (!result.valid) throw new TypeError(result.reason)
  return {
    type: ActionTypes.START_EXPEDITION,
    payload: { loadout: result.loadout, runId: getSafeUUID() }
  }
}

export const createRecordExpeditionArrivalAction = (
  nodeId: unknown
): Extract<GameAction, { type: typeof ActionTypes.RECORD_EXPEDITION_ARRIVAL }> => {
  if (typeof nodeId !== 'string' || nodeId.length === 0) {
    throw new TypeError('nodeId must be a non-empty string')
  }
  return { type: ActionTypes.RECORD_EXPEDITION_ARRIVAL, payload: { nodeId } }
}

export const createFinalizeExpeditionAction = (
  kind: 'extracted' | 'completed' | 'failed',
  reason: unknown
): Extract<GameAction, { type: typeof ActionTypes.FINALIZE_EXPEDITION }> => {
  if (typeof reason !== 'string' || reason.length === 0) {
    throw new TypeError('finalize reason must be a non-empty string')
  }
  return { type: ActionTypes.FINALIZE_EXPEDITION, payload: { kind, reason } }
}

export const createPrepareNextExpeditionAction = (): Extract<
  GameAction,
  { type: typeof ActionTypes.PREPARE_NEXT_EXPEDITION }
> => ({
  type: ActionTypes.PREPARE_NEXT_EXPEDITION,
  payload: { runSeed: getSecureRandomUint32() }
})
```

- [ ] **Step 4: Implement pure reducer handlers**

`START_EXPEDITION` must:

```ts
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
    loadout: payload.loadout,
    startingMoney: finiteNumberOr(state.player.money, 0),
    startingFame: finiteNumberOr(state.player.fame, 0)
  }
}
```

`PREPARE_NEXT_EXPEDITION` clears only run-scoped data, including `runId`, rotates `runSeed`, and preserves `player`, `band`, `assets`, `liabilities`, `career`, `unlocks`, and settings. A new `runId` is created only when the next `START_EXPEDITION` action is dispatched. The Expedition sanitizer accepts `runId` only as `null` or a bounded non-empty string, so the identifier survives save/reload for the whole finalized run.

- [ ] **Step 5: Wire stable dispatch wrappers**

Compose `useExpeditionDispatchActions` inside `useGameDispatchActions` instead of recreating callbacks in scenes:

```ts
const expeditionActions = useExpeditionDispatchActions(dispatch, state)
return useMemo(() => ({
  ...baseActions,
  ...expeditionActions
}), [baseActions, expeditionActions])
```

- [ ] **Step 6: Run reducer/type tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionReducer.test.js
pnpm run typecheck:core
pnpm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/context src/types tests/node/expeditionReducer.test.js
git commit -m "feat(expedition): add typed run lifecycle actions"
```

---

### Task 5: Add Standard Tour Definition and Validate Loadouts

**Files:**
- Create: `src/data/expedition/tourTypes.ts`
- Create: `src/data/expedition/regions.ts`
- Create: `src/domain/expedition/loadout.ts`
- Test: `tests/node/expeditionDefaults.test.js`

- [ ] **Step 1: Pin the standard tour contract in tests**

```js
const standard = getTourTypeDefinition('standard')
assert.equal(standard.mapDepth, 8)
assert.deepEqual(standard.extractionSteps, [3, 6])
assert.equal(standard.voluntaryRetentionRate, 0.7)
assert.equal(standard.failureRetentionRate, 0.5)
```

- [ ] **Step 2: Add canonical definitions**

```ts
export interface TourTypeDefinition {
  id: string
  mapDepth: number
  extractionSteps: readonly number[]
  voluntaryRetentionRate: number
  failureRetentionRate: number
  completionMultiplier: number
}

export const TOUR_TYPES = Object.freeze({
  standard: Object.freeze({
    id: 'standard',
    mapDepth: 8,
    extractionSteps: Object.freeze([3, 6]),
    voluntaryRetentionRate: 0.7,
    failureRetentionRate: 0.5,
    completionMultiplier: 1.35
  })
})
```

`regions.ts` begins with one canonical region:

```ts
export const REGIONS = Object.freeze({
  home: Object.freeze({ id: 'home', labelKey: 'ui:expedition.region.home' })
})
```

- [ ] **Step 3: Implement `validateExpeditionLoadout`**

It must verify `standard`/`home` as baseline defaults and otherwise check namespaced capability ids through the existing `state.unlocks`/`unlockManager` boundary, verify the selected tourbus asset exists and has kind `tourbus_chassis`, require unique crew ids, and require finite non-negative integer cargo values. Return:

```ts
{ valid: true, loadout: ExpeditionLoadout }
// or
{ valid: false, reason: string }
```

- [ ] **Step 4: Run tests and commit**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionDefaults.test.js tests/node/expeditionReducer.test.js
git add src/data/expedition src/domain/expedition/loadout.ts tests/node
git commit -m "feat(expedition): define standard tour loadout"
```

---

### Task 6: Add Tour Prep and Run Summary Scenes

**Files:**
- Modify: `src/context/gameConstants.ts:9-32`
- Modify: `src/components/SceneRouter.tsx`
- Modify: `src/scenes/mainmenu/hooks/useMainMenuStart.ts:45-75`
- Create: `src/scenes/TourPrep.tsx`
- Create: `src/scenes/RunSummary.tsx`
- Create: `src/ui/expedition/TourPrepLoadout.tsx`
- Create: `src/ui/expedition/RunSummaryCard.tsx`
- Modify: `public/locales/en/ui.json`
- Modify: `public/locales/de/ui.json`
- Test: `tests/ui/TourPrep.test.tsx`, `tests/ui/RunSummary.test.tsx`, `tests/ui/SceneRouter.test.jsx`, `tests/ui/MainMenu.test.jsx`

- [ ] **Step 1: Write scene-routing tests**

Assert `TOUR_PREP` renders TourPrep and `RUN_SUMMARY` renders RunSummary.

- [ ] **Step 2: Add phases**

```ts
TOUR_PREP: 'TOUR_PREP',
RUN_SUMMARY: 'RUN_SUMMARY',
```

- [ ] **Step 3: Change new-game flow to Tour Prep**

In `proceedToTour`, retain the existing full reset/identity restore but replace:

```ts
changeScene(GAME_PHASES.OVERWORLD)
```

with:

```ts
prepareExpedition()
changeScene(GAME_PHASES.TOUR_PREP)
```

Pass `prepareExpedition` through the hook interface rather than importing context inside the hook.

- [ ] **Step 4: Build Tour Prep minimum viable screen**

The first implementation exposes Standard tour, Home region, optional selected owned tourbus, and default empty crew/cargo. Drive validation from the domain helper:

```tsx
const validation = validateExpeditionLoadout(state, loadout)
const onStart = () => {
  if (!validation.valid) return
  startExpedition(validation.loadout)
  changeScene(GAME_PHASES.OVERWORLD)
}

return (
  <TourPrepLoadout loadout={loadout} onChange={setLoadout}>
    <button type="button" disabled={!validation.valid} onClick={onStart}>
      {t('ui:expedition.startTour')}
    </button>
  </TourPrepLoadout>
)
```

- [ ] **Step 5: Build Run Summary screen**

Show outcome kind/reason, retained money/fame, route step, and a `Next Tour` action:

```tsx
const onNextTour = () => {
  prepareNextExpedition()
  changeScene(GAME_PHASES.TOUR_PREP)
}
return <RunSummaryCard outcome={state.expedition.outcome} routeStep={state.expedition.routeStep} onNextTour={onNextTour} />
```

- [ ] **Step 6: Add EN/DE keys with 1:1 structure under `ui:expedition.*`**

No user-facing fallback-only copy in production JSX. Add matching objects:

```json
// public/locales/en/ui.json
{ "expedition": { "startTour": "Start tour", "nextTour": "Next tour", "extract": "Extract", "runSummary": "Tour summary" } }
```

```json
// public/locales/de/ui.json
{ "expedition": { "startTour": "Tour starten", "nextTour": "Nächste Tour", "extract": "Extrahieren", "runSummary": "Tour-Zusammenfassung" } }
```

- [ ] **Step 7: Run UI tests**

```bash
pnpm exec vitest run tests/ui/TourPrep.test.tsx tests/ui/RunSummary.test.tsx tests/ui/SceneRouter.test.jsx tests/ui/MainMenu.test.jsx
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/context/gameConstants.ts src/components/SceneRouter.tsx src/scenes src/ui/expedition public/locales src/scenes/mainmenu/hooks/useMainMenuStart.ts tests/ui
git commit -m "feat(expedition): add tour prep and run summary scenes"
```

---

### Task 7: Make Map Generation Expedition-Aware Without Rewriting MapGenerator

**Files:**
- Modify: `src/context/GameState.tsx:250-280`
- Modify: `src/context/useMapGeneration.ts:48-180`
- Modify: `src/utils/fallbackMap.ts`
- Test: `tests/ui/context/useMapGeneration.test.tsx`, `tests/node/fallbackMap.test.js`, `tests/node/mapGenerator.test.js`

- [ ] **Step 1: Write a failing 8-hop generation test**

For a standard active expedition, assert the generated finale is layer `8` and map generation does **not** run while scene is `TOUR_PREP`.

- [ ] **Step 2: Pass expedition inputs into `useMapGeneration`**

Add:

```ts
currentScene: GameState['currentScene']
expedition: Pick<GameState['expedition'], 'status' | 'loadout'>
```

Generate only when:

```ts
currentScene === GAME_PHASES.OVERWORLD &&
expedition.status === 'active' &&
!gameMap
```

Resolve depth through `getTourTypeDefinition(expedition.loadout.tourTypeId).mapDepth` and call existing `new MapGenerator(seed).generateMap(depth)`.

- [ ] **Step 3: Make fallback depth-safe**

Add `loadFallbackMap(depth)` that returns a validated fallback whose finale layer matches `depth`. Reuse the static fallback and rebuild the final connection:

```ts
export const loadFallbackMap = (depth: number): GameMap => {
  const safeDepth = Math.max(1, Math.trunc(depth))
  const base = structuredClone(FALLBACK_MAP)
  const kept = Object.values(base.nodes).filter(node => node.layer < safeDepth)
  const previous = kept.filter(node => node.layer === safeDepth - 1)
  const finale = { ...base.nodes.finale, id: `node_${safeDepth}_0`, layer: safeDepth, type: 'FINALE' }
  for (const node of previous) node.connections = [finale.id]
  return validateMap({ ...base, nodes: Object.fromEntries([...kept, finale].map(node => [node.id, node])) })
}
```

- [ ] **Step 4: Run map tests**

```bash
pnpm exec vitest run tests/ui/context/useMapGeneration.test.tsx
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/fallbackMap.test.js tests/node/mapGenerator.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/context/GameState.tsx src/context/useMapGeneration.ts src/utils/fallbackMap.ts tests
git commit -m "feat(expedition): generate profile-sized tour maps"
```

---

### Task 8: Implement Hybrid Fog-of-War Node Intelligence

**Files:**
- Create: `src/domain/expedition/nodeIntel.ts`
- Modify: `src/types/expedition.d.ts`
- Modify: `src/scenes/Overworld.tsx:29-45, 155-174`
- Modify: `src/components/overworld/OverworldMap.tsx:18-43, 105-190`
- Modify: `src/components/MapNodeView.tsx:152-269, 275-511`
- Test: `tests/node/expeditionNodeIntel.test.js`
- Test: `tests/ui/MapNode.test.jsx`
- Modify/Test: `tests/ui/OverworldMap.cityStates.test.jsx`

- [ ] **Step 1: Write selector tests for one canonical three-level contract**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { getExpeditionNodeIntel } from '../../src/domain/expedition/nodeIntel.ts'

const node = {
  id: 'n1',
  layer: 3,
  x: 0,
  y: 0,
  type: 'FESTIVAL',
  venue: { id: 'festival_a', name: 'Festival A', pay: 6000, diff: 5, price: 25 }
}
const rivalContext = {
  activeRivalId: 'rival_dead_circuits',
  activeRivalLocationId: 'n1'
}

test('level zero exposes only structural type and rough tiers', () => {
  assert.deepEqual(getExpeditionNodeIntel(node, 0, rivalContext), {
    nodeType: 'FESTIVAL',
    dangerTier: 'high',
    rewardTier: 'high',
    payoutRange: null,
    wearTier: null,
    rivalRisk: null,
    exactPayout: null,
    exactDifficulty: null,
    projectedWear: null,
    rivalId: null
  })
})

test('level one reveals ranges and rival presence but no exact numeric values', () => {
  const intel = getExpeditionNodeIntel(node, 1, rivalContext)
  assert.deepEqual(intel.payoutRange, { min: 5100, max: 6900 })
  assert.equal(intel.rivalRisk, 'high')
  assert.equal(intel.exactPayout, null)
  assert.equal(intel.exactDifficulty, null)
  assert.equal(intel.projectedWear, null)
  assert.equal(intel.rivalId, null)
})

test('level two reveals exact canonical venue values and rival identity', () => {
  const intel = getExpeditionNodeIntel(node, 2, rivalContext)
  assert.equal(intel.exactPayout, 6000)
  assert.equal(intel.exactDifficulty, 5)
  assert.equal(intel.rivalId, 'rival_dead_circuits')
})
```

`projectedWear` intentionally remains `null` in G1 because the Condition formula does not exist until G2. G2 Task 5 extends this same contract instead of inventing a second intel shape.

- [ ] **Step 2: Add the canonical intel result type and deterministic G1 selector**

Extend `src/types/expedition.d.ts`:

```ts
import type { MapNodeType } from '../utils/mapNodeTypes'

export type NodeIntelBand = 'low' | 'medium' | 'high'

export interface ExpeditionNodeIntelContext {
  activeRivalId: string | null
  activeRivalLocationId: string | null
}

export interface ExpeditionNodeIntel {
  nodeType: MapNodeType
  dangerTier: NodeIntelBand
  rewardTier: NodeIntelBand
  payoutRange: { min: number; max: number } | null
  wearTier: NodeIntelBand | null
  rivalRisk: NodeIntelBand | null
  exactPayout: number | null
  exactDifficulty: number | null
  projectedWear: Record<ConditionGroup, number> | null
  rivalId: string | null
}
```

`src/domain/expedition/nodeIntel.ts` uses only data that exists at this gate. No RNG is allowed in tooltip derivation:

```ts
import type {
  ExpeditionNodeIntel,
  ExpeditionNodeIntelContext,
  MapNode,
  NodeIntelBand,
  NodeIntelLevel
} from '../../types'
import { isFiniteNumber } from '../../utils/gameState'

const EMPTY_CONTEXT: ExpeditionNodeIntelContext = {
  activeRivalId: null,
  activeRivalLocationId: null
}

export const getCanonicalNodePayout = (node: MapNode): number | null => {
  const value = node.venue?.pay
  return isFiniteNumber(value) ? Math.max(0, value) : null
}

export const getCanonicalNodeDifficulty = (node: MapNode): number | null => {
  const explicit = node.venue?.difficulty
  const legacy = node.venue?.diff
  const value = isFiniteNumber(explicit)
    ? explicit
    : isFiniteNumber(legacy)
      ? legacy
      : null
  return value === null
    ? null
    : Math.max(1, Math.min(5, Math.trunc(value)))
}

const toDangerTier = (difficulty: number | null): NodeIntelBand =>
  difficulty === null || difficulty <= 2
    ? 'low'
    : difficulty <= 3
      ? 'medium'
      : 'high'

const toRewardTier = (payout: number | null): NodeIntelBand =>
  payout === null || payout < 800
    ? 'low'
    : payout < 3000
      ? 'medium'
      : 'high'

const toPayoutRange = (
  value: number | null
): { min: number; max: number } | null => {
  if (value === null) return null
  return {
    min: Math.max(0, Math.floor((value * 0.85) / 100) * 100),
    max: Math.ceil((value * 1.15) / 100) * 100
  }
}

export const getExpeditionNodeIntel = (
  node: MapNode,
  level: NodeIntelLevel,
  context: ExpeditionNodeIntelContext = EMPTY_CONTEXT
): ExpeditionNodeIntel => {
  const exactPayout = getCanonicalNodePayout(node)
  const exactDifficulty = getCanonicalNodeDifficulty(node)
  const rivalHere =
    context.activeRivalLocationId === node.id &&
    typeof context.activeRivalId === 'string'

  return {
    nodeType: node.type,
    dangerTier: toDangerTier(exactDifficulty),
    rewardTier: toRewardTier(exactPayout),
    payoutRange: level >= 1 ? toPayoutRange(exactPayout) : null,
    wearTier: null,
    rivalRisk: level >= 1 && rivalHere ? 'high' : null,
    exactPayout: level >= 2 ? exactPayout : null,
    exactDifficulty: level >= 2 ? exactDifficulty : null,
    projectedWear: null,
    rivalId: level >= 2 && rivalHere ? context.activeRivalId : null
  }
}
```

This resolves one stable contract up front: the same field names are used by tests, UI, G2 wear projection, and later Pressure/Rival work. Exact payout/difficulty remain hidden through Level 1.

- [ ] **Step 3: Pass Expedition intel and existing rival state into `OverworldMap`**

`src/scenes/Overworld.tsx` adds one focused selector and passes only the fields the map needs:

```tsx
const expedition = useGameSelector(state => state.expedition)

<OverworldMap
  {...existingMapProps}
  expeditionActive={expedition.status === 'active'}
  intelByNodeId={expedition.intelByNodeId}
/>
```

Extend `OverworldMapProps`:

```ts
expeditionActive: boolean
intelByNodeId: Record<string, NodeIntelLevel>
```

Inside the existing node loop:

```tsx
const intelLevel = expeditionActive ? (intelByNodeId[node.id] ?? 0) : 2
const intel = getExpeditionNodeIntel(node, intelLevel, {
  activeRivalId: rivalBand?.id ?? null,
  activeRivalLocationId: rivalBand?.currentLocationId ?? null
})

<MapNodeView
  {...existingNodeProps}
  visibility={visibility}
  intelLevel={intelLevel}
  expeditionIntel={intel}
/>
```

Legacy/non-Expedition maps use Level 2 so this feature does not remove information from the existing mode.

- [ ] **Step 4: Gate the existing rival marker and tooltip details by Expedition intel**

`MapNodeView` renders from the passed `expeditionIntel`; it must not recompute intelligence from structural visibility. In `OverworldMap`, keep the existing rival marker unchanged for legacy play, but require Level 1 in an Expedition:

```tsx
const shouldShowRivalMarker =
  hasRival &&
  visibility !== 'hidden' &&
  (!expeditionActive || intelLevel >= 1)
```

At Level 0 show node type + `dangerTier`/`rewardTier`. At Level 1 add `payoutRange`, `wearTier` when G2 populates it, and `rivalRisk`. At Level 2 add exact payout/difficulty, projected wear when available, and rival identity. Add UI assertions that a Level-1 Festival never contains the exact `6000` payout or exact difficulty value.

- [ ] **Step 5: Run selector/UI tests and commit**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionNodeIntel.test.js
pnpm exec vitest run tests/ui/MapNode.test.jsx tests/ui/OverworldMap.cityStates.test.jsx
pnpm run typecheck:core
git add src/domain/expedition/nodeIntel.ts src/types/expedition.d.ts src/scenes/Overworld.tsx src/components/overworld/OverworldMap.tsx src/components/MapNodeView.tsx tests/node/expeditionNodeIntel.test.js tests/ui/MapNode.test.jsx tests/ui/OverworldMap.cityStates.test.jsx
git commit -m "feat(expedition): add hybrid map intelligence"
```

---

### Task 9: Record Arrivals Exactly Once and Expose Extraction Windows

**Files:**
- Modify: `src/hooks/useArrivalLogic.ts:153-246`
- Modify: `src/scenes/Overworld.tsx`
- Create: `src/ui/expedition/ExpeditionStatusStrip.tsx`
- Modify: `src/ui/overworld/OverworldHUD.tsx`
- Test: `tests/ui/useArrivalLogic.test.jsx`, `tests/ui/OverworldHUD.test.jsx`, `tests/node/expeditionReducer.test.js`

- [ ] **Step 1: Add a failing arrival replay test**

One completed journey to `node_3_1` increments `routeStep` once and appends the node id once; re-rendering the arrival effect must not increment again:

```js
const first = gameReducer(active, createRecordExpeditionArrivalAction('node_3_1'))
const replay = gameReducer(first, createRecordExpeditionArrivalAction('node_3_1'))
assert.equal(first.expedition.routeStep, 1)
assert.deepEqual(first.expedition.visitedNodeIds, ['node_3_1'])
assert.deepEqual(replay.expedition, first.expedition)
```

- [ ] **Step 2: Record arrival through the typed action surface**

Inside the real travel-arrival sequence, after the travel commit is known and before node-specific routing, call:

```ts
recordExpeditionArrival(node.id)
```

The reducer rejects duplicate `visitedNodeIds` and only increments `routeStep` for a new arrival while status is `active`.

- [ ] **Step 3: Derive extraction availability from tour definition**

```ts
export const canExtractAtCurrentStep = (state: GameState): boolean =>
  state.expedition.status === 'active' &&
  getTourTypeDefinition(state.expedition.loadout.tourTypeId)
    .extractionSteps.includes(state.expedition.routeStep)
```

Do not store a second boolean that can become stale.

- [ ] **Step 4: Add compact Expedition status to Overworld HUD**

Show route step, Heat/Exposure placeholders, and enable extraction only at legal windows:

```tsx
const canExtract = canExtractAtStep(state.expedition, tourType)
return <ExpeditionStatusStrip
  routeStep={state.expedition.routeStep}
  heat={state.expedition.pressure.heat}
  exposure={state.expedition.pressure.exposure}
  canExtract={canExtract}
  onExtract={() => setExtractionOpen(true)}
/>
```

- [ ] **Step 5: Run tests and commit**

```bash
pnpm exec vitest run tests/ui/useArrivalLogic.test.jsx tests/ui/OverworldHUD.test.jsx
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionReducer.test.js
git add src/hooks/useArrivalLogic.ts src/scenes/Overworld.tsx src/ui tests
git commit -m "feat(expedition): track route progress and extraction windows"
```

---

### Task 10: Implement Idempotent Hybrid Extraction Settlement

**Files:**
- Create: `src/domain/expedition/extraction.ts`
- Create: `src/ui/expedition/ExtractionDialog.tsx`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Modify: `src/context/expeditionActionCreators.ts`
- Test: `tests/node/expeditionExtraction.test.js`, `tests/ui/ExtractionDialog.test.tsx`

- [ ] **Step 1: Write settlement math tests**

```js
assert.deepEqual(
  calculateRetainedProgress({ startingMoney: 500, currentMoney: 10500, startingFame: 100, currentFame: 2100, retentionRate: 0.7 }),
  { money: 7500, fame: 1500 }
)

assert.deepEqual(
  calculateRetainedProgress({ startingMoney: 5000, currentMoney: 3000, startingFame: 1000, currentFame: 800, retentionRate: 0.5 }),
  { money: 3000, fame: 800 }
)
```

Positive net gains are discounted; losses are never refunded.

- [ ] **Step 2: Implement pure settlement**

```ts
const retain = (start: number, current: number, rate: number): number => {
  const safeStart = Math.max(0, finiteNumberOr(start, 0))
  const safeCurrent = Math.max(0, finiteNumberOr(current, 0))
  if (safeCurrent <= safeStart) return safeCurrent
  return Math.floor(safeStart + (safeCurrent - safeStart) * clampUnit(rate))
}
```

Return both money/fame; never mutate state.

- [ ] **Step 3: Implement one pure settlement transition and keep navigation outside reducers**

`FINALIZE_EXPEDITION` is a no-op unless status is exactly `active`. Put the shared state transition in `src/domain/expedition/extraction.ts` so both the Expedition reducer and the daily-bankruptcy reducer path can use the exact same pure logic without importing one reducer from another:

```ts
export const finalizeExpeditionState = (
  state: GameState,
  payload: FinalizeExpeditionPayload
): GameState => {
  if (state.expedition.status !== 'active') return state
  const settlement = calculateExpeditionSettlement(state, payload.kind)
  return {
    ...state,
    player: {
      ...state.player,
      money: settlement.finalMoney,
      fame: settlement.finalFame
    },
    expedition: {
      ...state.expedition,
      status: payload.kind,
      outcome: settlement.outcome
    }
  }
}
```

The reducer handler is deliberately thin:

```ts
export const handleFinalizeExpedition = (
  state: GameState,
  payload: FinalizeExpeditionPayload
): GameState => finalizeExpeditionState(state, payload)
```

Neither function writes `currentScene`. Add a focused reducer assertion that `currentScene` is unchanged after `FINALIZE_EXPEDITION`, plus a replay assertion that a second finalize returns the exact same state reference.

- [ ] **Step 4: Build confirmation dialog with exact preview and route from the owning callback**

The dialog uses the same domain calculation as reducer settlement. The UI callback performs settlement first, requests a save after the following scene commit, then routes to Run Summary; the reducer itself never changes scene:

```tsx
const preview = calculateExpeditionSettlement(state, 'extracted')
const onConfirmExtraction = () => {
  finalizeExpedition('extracted', 'voluntary')
  saveGameAfterStateCommit()
  changeScene(GAME_PHASES.RUN_SUMMARY)
}

return <ExtractionDialog
  currentMoney={state.player.money}
  currentFame={state.player.fame}
  retainedMoney={preview.finalMoney}
  retainedFame={preview.finalFame}
  lostRewardIds={preview.lostRewardIds}
  onConfirm={onConfirmExtraction}
/>
```

- [ ] **Step 5: Run tests and commit**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionExtraction.test.js
pnpm exec vitest run tests/ui/ExtractionDialog.test.tsx
git add src/domain/expedition/extraction.ts src/context src/ui/expedition tests
git commit -m "feat(expedition): add hybrid extraction settlement"
```

---

### Task 11: Route Finale and Bankruptcy Through Run Summary

**Files:**
- Modify: `src/hooks/postGig/handlers/useContinueHandler.ts:78-190`
- Modify: `src/hooks/postGig/handlers/continueHandlerUtils.ts:160-195`
- Modify: `src/context/reducers/systemReducer.ts:520-650`
- Modify: `src/hooks/useArrivalLogic.ts:80-160`
- Test: `tests/ui/postGigHandlerLogic.test.jsx`, `tests/node/expeditionExtraction.test.js`, `tests/node/advanceDayAssetIntegration.test.js`, `tests/ui/useArrivalLogic.test.jsx`

- [ ] **Step 1: Add failing finale, bankruptcy, and navigation-ownership tests**

Pin:

```text
FINALIZE_EXPEDITION alone changes settlement/status but preserves currentScene
active expedition + successful FINALE -> continuation finalizes -> continuation routes RUN_SUMMARY
active expedition + post-gig bankruptcy -> continuation finalizes -> continuation routes RUN_SUMMARY
active expedition + daily bankruptcy -> ADVANCE_DAY marks expedition failed without scene change -> arrival post-commit effect routes RUN_SUMMARY
legacy/non-expedition bankruptcy -> GAMEOVER unchanged
```

- [ ] **Step 2: Finalize, then navigate from the post-gig continuation callback**

Dispatch order in `handleContinue` must be:

```text
updatePlayer(new money/fame)
quest/band side effects
finalizeExpedition(completed|failed)
saveGameAfterStateCommit()
changeScene(RUN_SUMMARY)
return
```

Sequential reducer dispatches let finalization see the committed post-gig totals, while the owning continuation callback — not the completion reducer — owns navigation. `saveGameAfterStateCommit()` is set before `changeScene` so the existing persistence effect saves the finalized state after the scene commit.

- [ ] **Step 3: Preserve legacy transitions**

Call the Expedition branch before `handleContinueSceneTransition`; only non-Expedition continuations reach the existing helper:

```ts
if (isExpeditionActive && shouldFinalizeExpedition) {
  finalizeExpedition(expeditionOutcome, expeditionReason)
  saveGameAfterStateCommit()
  changeScene(GAME_PHASES.RUN_SUMMARY)
  return
}

handleContinueSceneTransition(legacyArgs)
```

Keep `handleContinueSceneTransition` as the existing `GAMEOVER`/`OVERWORLD` decision body without changing its legacy conditions. Add tests for Expedition and non-Expedition paths so normal continuation remains unchanged.

- [ ] **Step 4: Make daily bankruptcy settlement pure and route after the day commit**

`applyDailyBankruptcyCheck` stays a pure reducer helper. For an active Expedition, call the same pure settlement helper used by `FINALIZE_EXPEDITION` and preserve `currentScene`; legacy bankruptcy keeps the existing `GAMEOVER` transition:

```ts
const applyDailyBankruptcyCheck = (state: GameState): GameState => {
  const total = getTotalDailyObligations(state)
  if (!shouldTriggerBankruptcy(state.player.money, 0, total)) return state
  if (state.expedition.status === 'active') {
    return finalizeExpeditionState(state, { kind: 'failed', reason: 'bankruptcy' })
  }
  return { ...state, currentScene: GAME_PHASES.GAMEOVER }
}
```

Extend `useArrivalLogic`'s existing post-commit routing effect. When the committed day tick leaves `expedition.status === 'failed'`, consume `pendingRouteRef`, call `saveGameAfterStateCommit()`, route to `RUN_SUMMARY`, and return before any queued gig/overworld routing. This mirrors the existing `GAMEOVER` short-circuit without moving navigation into the reducer.

- [ ] **Step 5: Run tests and commit**

```bash
pnpm exec vitest run tests/ui/postGigHandlerLogic.test.jsx tests/ui/useArrivalLogic.test.jsx
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionExtraction.test.js tests/node/advanceDayAssetIntegration.test.js
git add src/hooks/postGig src/hooks/useArrivalLogic.ts src/context/reducers/systemReducer.ts tests
git commit -m "feat(expedition): finalize tours through run summary"
```

---

### Task 12: Add Core Golden Path and Stage Gate

**Files:**
- Create: `tests/golden-path/expeditionCore.test.js`
- Test: `tests/locale/full.test.js`, `tests/locale/smoke.test.js`, `tests/node/localeIntegrity.test.js`

- [ ] **Step 1: Add a real action/reducer golden path**

Test this exact sequence without mocked reducers:

```text
createInitialState
-> PREPARE_EXPEDITION
-> START_EXPEDITION
-> SET_MAP (8-hop deterministic map)
-> RECORD_EXPEDITION_ARRIVAL x3
-> FINALIZE_EXPEDITION(extracted)
-> CHANGE_SCENE(RUN_SUMMARY) from the owning callback
-> PREPARE_NEXT_EXPEDITION(new runSeed)
```

Assert career/assets/unlocks persist, the finalized `runId` remains stable across a save/reload, `PREPARE_NEXT_EXPEDITION` clears that id, the next `START_EXPEDITION` creates a different id, run state resets, `runSeed` changes, settlement is not double-applied, and next scene is Tour Prep.

- [ ] **Step 2: Run Core stage tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/golden-path/expeditionCore.test.js
pnpm run typecheck:core
pnpm run typecheck
pnpm run test:dot
pnpm run deadcode:check
pnpm run deadcode:budget
```

Expected: all PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/golden-path/expeditionCore.test.js
git commit -m "test(expedition): cover core tour lifecycle"
```

**Gate G1 is complete only after this task passes.**
