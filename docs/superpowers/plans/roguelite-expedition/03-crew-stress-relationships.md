# Crew, Stress, Relationships, and Injuries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a three-slot Expedition crew loadout whose roles change route information, repairs, travel, sponsors, and safety while run stress/crises and persistent loyalty/relationships create meaningful consequences without turning the game into a payroll simulator.

**Architecture:** Crew definitions are static content in `src/data/expedition/crew.ts`; availability uses the existing unlock system, run stress/temporary traits live in `expedition.crewRunById`, and loyalty/relationships/story progress live in `career`. The first delivery deliberately keeps one active crew actor per selected slot and one compact semantic stress model. Stress/injury changes are deterministic deltas dispatched from existing travel/gig/rest seams; crisis events reuse the current event engine through an explicit Expedition event-effect adapter.

**Tech Stack:** TypeScript 6, React 19, existing event engine/resolver, typed reducers/actions, i18next, deterministic RNG/action creators, Node/Vitest tests, balance simulator.

---

## Depends On

- `01-expedition-core-extraction.md` merged.
- `02-condition-repairs-cargo.md` may develop in parallel through G3 Tasks 1–8. G3 Tasks 9–10 require **G2 Task 10** (the base typed Expedition event-effect pipeline) because crew crises consume cargo and repair/damage Condition. G4 cannot start until both G2 and all G3 tasks are merged.
- Existing `state.unlocks`/`unlockManager` remains the capability-unlock owner.

## File Structure

**Create:**

- `src/types/crew.d.ts`
- `src/data/expedition/crew.ts`
- `src/domain/expedition/crew.ts`
- `src/domain/expedition/crewStress.ts`
- `src/domain/expedition/relationships.ts`
- `src/domain/expedition/injuries.ts`
- `src/data/events/crew.ts`
- `src/ui/expedition/CrewPicker.tsx`
- `src/ui/expedition/CrewStatusPanel.tsx`
- `tests/node/expeditionCrewRegistry.test.js`
- `tests/node/expeditionCrewStress.test.js`
- `tests/node/expeditionRelationships.test.js`
- `tests/node/expeditionInjuries.test.js`
- `tests/ui/ExpeditionCrewPicker.test.tsx`
- `tests/ui/ExpeditionCrewStatus.test.tsx`
- `src/context/careerActionCreators.ts`
- `src/context/reducers/careerReducer.ts`
- `src/context/useCareerDispatchActions.ts`

**Modify:**

- `src/types/index.ts`
- `src/types/events.d.ts`
- `src/types/game.d.ts`
- `src/types/career.d.ts`
- `src/types/expedition.d.ts`
- `src/domain/expedition/defaults.ts`
- `src/domain/expedition/loadout.ts`
- `src/context/reducers/careerSanitizers.ts`
- `src/context/reducers/expeditionSanitizers.ts`
- `src/context/actionTypes.ts`
- `src/types/actions.d.ts`
- `src/context/expeditionActionCreators.ts`
- `src/context/reducers/expeditionReducer.ts`
- `src/context/useExpeditionDispatchActions.ts`
- `src/domain/eventResolver.ts`
- `src/utils/eventEngine/eventEffectHandlers.ts`
- `src/data/events/index.ts`
- `src/hooks/travel/actions/useHandleNodeArrivalCallback.ts`
- `src/hooks/travel/useVanMaintenance.ts`
- `src/hooks/postGig/handlers/useContinueHandler.ts`
- `src/utils/arrivalUtils.ts`
- `src/ui/expedition/TourPrepLoadout.tsx`
- `src/ui/expedition/ExpeditionStatusStrip.tsx`
- `src/utils/unlockManager.ts` only through existing API usage; do not change storage format
- `public/locales/en/ui.json`
- `public/locales/de/ui.json`
- `public/locales/en/events.json`
- `public/locales/de/events.json`
- `scripts/game-balance-simulation.mjs`
- balance source fingerprint list
- relevant event resolver/registry tests

---

### Task 1: Define the Initial Six Crew Actors and Roles

**Files:**
- Create: `src/types/crew.d.ts`
- Create: `src/data/expedition/crew.ts`
- Modify: `src/types/index.ts`
- Test: `tests/node/expeditionCrewRegistry.test.js`

- [ ] **Step 1: Write the failing registry test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  EXPEDITION_CREW,
  EXPEDITION_CREW_BY_ID,
  STARTER_CREW_IDS
} from '../../src/data/expedition/crew.ts'

test('crew registry has six unique stable actors and four baseline options', () => {
  assert.equal(EXPEDITION_CREW.length, 6)
  assert.equal(new Set(EXPEDITION_CREW.map(actor => actor.id)).size, 6)
  assert.deepEqual(STARTER_CREW_IDS, [
    'crew_mika_tech',
    'crew_anja_roadie',
    'crew_tom_driver',
    'crew_nico_scout'
  ])
  for (const id of STARTER_CREW_IDS) assert.ok(EXPEDITION_CREW_BY_ID[id])
})

test('crew roles are deliberately non-overlapping', () => {
  assert.deepEqual(
    EXPEDITION_CREW.map(actor => actor.role),
    ['technician', 'roadie', 'driver', 'manager', 'scout', 'security']
  )
})
```

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionCrewRegistry.test.js
```

Expected: FAIL because registry is missing.

- [ ] **Step 3: Add exact type contract**

`src/types/crew.d.ts`:

```ts
export type ExpeditionCrewRole =
  | 'technician'
  | 'roadie'
  | 'driver'
  | 'manager'
  | 'scout'
  | 'security'

export interface ExpeditionCrewDefinition {
  id: string
  role: ExpeditionCrewRole
  nameKey: string
  talentKey: string
  traitKey: string
  viceKey: string | null
  baseEffects: {
    fieldRepairEfficiency?: number
    technicalWearMultiplier?: number
    roadWearMultiplier?: number
    scoutIntelBonus?: 1
    contractRewardMultiplier?: number
    heatGainMultiplier?: number
  }
}
```

- [ ] **Step 4: Add exact initial registry**

`src/data/expedition/crew.ts`:

```ts
import type { ExpeditionCrewDefinition } from '../../types'

export const EXPEDITION_CREW = Object.freeze([
  {
    id: 'crew_mika_tech',
    role: 'technician',
    nameKey: 'ui:expedition.crew.mika.name',
    talentKey: 'ui:expedition.crew.mika.talent',
    traitKey: 'ui:expedition.crew.mika.trait',
    viceKey: 'ui:expedition.crew.mika.vice',
    baseEffects: { fieldRepairEfficiency: 0.2, technicalWearMultiplier: 0.9 }
  },
  {
    id: 'crew_anja_roadie',
    role: 'roadie',
    nameKey: 'ui:expedition.crew.anja.name',
    talentKey: 'ui:expedition.crew.anja.talent',
    traitKey: 'ui:expedition.crew.anja.trait',
    viceKey: null,
    baseEffects: { technicalWearMultiplier: 0.92 }
  },
  {
    id: 'crew_tom_driver',
    role: 'driver',
    nameKey: 'ui:expedition.crew.tom.name',
    talentKey: 'ui:expedition.crew.tom.talent',
    traitKey: 'ui:expedition.crew.tom.trait',
    viceKey: null,
    baseEffects: { roadWearMultiplier: 0.85 }
  },
  {
    id: 'crew_leyla_manager',
    role: 'manager',
    nameKey: 'ui:expedition.crew.leyla.name',
    talentKey: 'ui:expedition.crew.leyla.talent',
    traitKey: 'ui:expedition.crew.leyla.trait',
    viceKey: 'ui:expedition.crew.leyla.vice',
    baseEffects: { contractRewardMultiplier: 1.1 }
  },
  {
    id: 'crew_nico_scout',
    role: 'scout',
    nameKey: 'ui:expedition.crew.nico.name',
    talentKey: 'ui:expedition.crew.nico.talent',
    traitKey: 'ui:expedition.crew.nico.trait',
    viceKey: null,
    baseEffects: { scoutIntelBonus: 1 }
  },
  {
    id: 'crew_saskia_security',
    role: 'security',
    nameKey: 'ui:expedition.crew.saskia.name',
    talentKey: 'ui:expedition.crew.saskia.talent',
    traitKey: 'ui:expedition.crew.saskia.trait',
    viceKey: null,
    baseEffects: { heatGainMultiplier: 0.8 }
  }
] as const satisfies readonly ExpeditionCrewDefinition[])

export const EXPEDITION_CREW_BY_ID = Object.freeze(
  Object.fromEntries(EXPEDITION_CREW.map(actor => [actor.id, actor]))
) as Readonly<Record<string, ExpeditionCrewDefinition>>

export const STARTER_CREW_IDS = Object.freeze([
  'crew_mika_tech',
  'crew_anja_roadie',
  'crew_tom_driver',
  'crew_nico_scout'
] as const)
```

Manager and Security are later unlocks; starter actors are always available and do not need stored unlock markers. Later actors use `expedition.crew.<id>` unlock ids.

- [ ] **Step 5: Run registry/type tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionCrewRegistry.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/types/crew.d.ts src/types/index.ts src/data/expedition/crew.ts tests/node/expeditionCrewRegistry.test.js
git commit -m "feat(expedition): add crew registry"
```

---

### Task 2: Enforce Three Crew Slots and Existing Unlock Ownership

**Files:**
- Create: `src/domain/expedition/crew.ts`
- Modify: `src/domain/expedition/loadout.ts`
- Test: `tests/node/expeditionCrewRegistry.test.js`
- Test: `tests/node/expeditionReducer.test.js`

- [ ] **Step 1: Add failing loadout tests**

```js
import {
  MAX_EXPEDITION_CREW_SLOTS,
  isCrewAvailable,
  validateCrewSelection
} from '../../src/domain/expedition/crew.ts'

test('crew selection is limited to three unique actors', () => {
  assert.equal(MAX_EXPEDITION_CREW_SLOTS, 3)
  assert.equal(validateCrewSelection([
    'crew_mika_tech', 'crew_anja_roadie', 'crew_tom_driver'
  ], []), true)
  assert.equal(validateCrewSelection([
    'crew_mika_tech', 'crew_anja_roadie', 'crew_tom_driver', 'crew_nico_scout'
  ], []), false)
  assert.equal(validateCrewSelection(['crew_mika_tech', 'crew_mika_tech'], []), false)
})

test('manager requires the existing unlock registry', () => {
  assert.equal(isCrewAvailable('crew_leyla_manager', []), false)
  assert.equal(
    isCrewAvailable('crew_leyla_manager', ['expedition.crew.crew_leyla_manager']),
    true
  )
})
```

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionCrewRegistry.test.js
```

Expected: FAIL because crew domain is missing.

- [ ] **Step 3: Implement exact availability rules**

```ts
import { EXPEDITION_CREW_BY_ID, STARTER_CREW_IDS } from '../../data/expedition/crew'

export const MAX_EXPEDITION_CREW_SLOTS = 3
const STARTER_SET = new Set<string>(STARTER_CREW_IDS)

export const crewUnlockId = (crewId: string): string =>
  `expedition.crew.${crewId}`

export const isCrewAvailable = (
  crewId: string,
  unlocks: readonly string[]
): boolean =>
  Object.hasOwn(EXPEDITION_CREW_BY_ID, crewId) &&
  (STARTER_SET.has(crewId) || unlocks.includes(crewUnlockId(crewId)))

export const validateCrewSelection = (
  crewIds: readonly string[],
  unlocks: readonly string[]
): boolean =>
  crewIds.length <= MAX_EXPEDITION_CREW_SLOTS &&
  new Set(crewIds).size === crewIds.length &&
  crewIds.every(id => isCrewAvailable(id, unlocks))
```

`validateExpeditionLoadout()` receives the current `state.unlocks`; do not read localStorage directly and do not add unlock arrays to `career`.

- [ ] **Step 4: Run loadout tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionCrewRegistry.test.js tests/node/expeditionReducer.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/expedition/crew.ts src/domain/expedition/loadout.ts tests/node/expeditionCrewRegistry.test.js tests/node/expeditionReducer.test.js
git commit -m "feat(expedition): enforce crew slots and unlocks"
```

---

### Task 3: Initialize Run Stress From the Selected Crew

**Files:**
- Modify: `src/context/expeditionActionCreators.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Modify: `src/context/reducers/expeditionSanitizers.ts`
- Test: `tests/node/expeditionReducer.test.js`

- [ ] **Step 1: Add failing start test**

```js
test('starting an expedition initializes exactly the selected crew run state', () => {
  const next = handleStartExpedition(stateWithCrewSelection, payload)
  assert.deepEqual(next.expedition.crewRunById, {
    crew_mika_tech: {
      stress: 0,
      stressStatus: 'calm',
      injuryStage: 'none',
      runTraitIds: []
    },
    crew_nico_scout: {
      stress: 0,
      stressStatus: 'calm',
      injuryStage: 'none',
      runTraitIds: []
    }
  })
})
```

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionReducer.test.js
```

Expected: FAIL because selected crew is not initialized.

- [ ] **Step 3: Add pure factory**

```ts
import type { ExpeditionCrewRunState } from '../../types'

export const createCrewRunState = (): ExpeditionCrewRunState => ({
  stress: 0,
  stressStatus: 'calm',
  injuryStage: 'none',
  runTraitIds: []
})
```

`START_EXPEDITION` payload carries validated crew ids. Reducer constructs a null-prototype-safe record containing only those ids.

- [ ] **Step 4: Run tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionReducer.test.js tests/node/expeditionSanitizers.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/context/expeditionActionCreators.ts src/context/reducers/expeditionReducer.ts src/context/reducers/expeditionSanitizers.ts tests/node/expeditionReducer.test.js
git commit -m "feat(expedition): initialize run crew state"
```

---

### Task 4: Implement Semantic Stress and Role-Aggregate Helpers

**Files:**
- Create: `src/domain/expedition/crewStress.ts`
- Modify: `src/domain/expedition/crew.ts`
- Test: `tests/node/expeditionCrewStress.test.js`

- [ ] **Step 1: Write failing stress tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getCrewStressStatus,
  calculateCrewStressDelta
} from '../../src/domain/expedition/crewStress.ts'

test('stress thresholds use semantic states', () => {
  assert.equal(getCrewStressStatus(0), 'calm')
  assert.equal(getCrewStressStatus(40), 'strained')
  assert.equal(getCrewStressStatus(70), 'critical')
  assert.equal(getCrewStressStatus(90), 'breaking')
})

test('gig stress rises with technical danger', () => {
  assert.equal(calculateCrewStressDelta({ kind: 'gig', technicalCondition: 80 }), 6)
  assert.equal(calculateCrewStressDelta({ kind: 'gig', technicalCondition: 35 }), 10)
})

test('rest strongly reduces stress', () => {
  assert.equal(calculateCrewStressDelta({ kind: 'rest', technicalCondition: 100 }), -25)
})
```

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionCrewStress.test.js
```

Expected: FAIL because stress domain is missing.

- [ ] **Step 3: Implement initial stress rules**

```ts
import type { CrewStressStatus } from '../../types'

export const getCrewStressStatus = (stress: number): CrewStressStatus => {
  if (stress >= 90) return 'breaking'
  if (stress >= 70) return 'critical'
  if (stress >= 40) return 'strained'
  return 'calm'
}

export const calculateCrewStressDelta = ({
  kind,
  technicalCondition
}: {
  kind: 'travel' | 'gig' | 'rest' | 'restStop' | 'crisisWin'
  technicalCondition: number
}): number => {
  if (kind === 'rest') return -25
  if (kind === 'restStop') return -15
  if (kind === 'crisisWin') return -10
  const technicalPenalty = technicalCondition < 40 ? 4 : technicalCondition < 70 ? 2 : 0
  return (kind === 'gig' ? 6 : 4) + technicalPenalty
}
```

Add role aggregation helper:

```ts
export const getCrewAggregateEffects = (
  crewIds: readonly string[]
): Required<Pick<ExpeditionCrewDefinition['baseEffects'],
  'fieldRepairEfficiency' | 'technicalWearMultiplier' | 'roadWearMultiplier' |
  'contractRewardMultiplier' | 'heatGainMultiplier'>> & { scoutIntelBonus: number } => {
  let technicalWearMultiplier = 1
  let roadWearMultiplier = 1
  let contractRewardMultiplier = 1
  let heatGainMultiplier = 1
  let fieldRepairEfficiency = 0
  let scoutIntelBonus = 0
  for (const id of crewIds) {
    const actor = EXPEDITION_CREW_BY_ID[id]
    if (!actor) continue
    const e = actor.baseEffects
    fieldRepairEfficiency += e.fieldRepairEfficiency ?? 0
    technicalWearMultiplier *= e.technicalWearMultiplier ?? 1
    roadWearMultiplier *= e.roadWearMultiplier ?? 1
    contractRewardMultiplier *= e.contractRewardMultiplier ?? 1
    heatGainMultiplier *= e.heatGainMultiplier ?? 1
    scoutIntelBonus = Math.max(scoutIntelBonus, e.scoutIntelBonus ?? 0)
  }
  return {
    fieldRepairEfficiency,
    technicalWearMultiplier,
    roadWearMultiplier,
    contractRewardMultiplier,
    heatGainMultiplier,
    scoutIntelBonus
  }
}
```

- [ ] **Step 4: Run tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionCrewStress.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/expedition/crew.ts src/domain/expedition/crewStress.ts tests/node/expeditionCrewStress.test.js
git commit -m "feat(expedition): define crew stress and role effects"
```

---

### Task 5: Add Typed Run-Crew Stress Mutations

**Files:**
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/context/expeditionActionCreators.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Modify: `src/context/useExpeditionDispatchActions.ts`
- Test: `tests/node/expeditionReducer.test.js`

- [ ] **Step 1: Add failing hostile/replay tests**

Assert hostile payloads cannot update run state and valid stress clamps:

```js
const initial = { ...createInitialState(), expedition: makeActiveExpedition({ crewRunById: { crew_mika_tech: { stress: 92, stressStatus: 'critical', injuryStage: 'none', runTraitIds: [] } } }) }
assert.throws(() => createAdjustCrewStressAction(initial, '__proto__', Infinity), /crew|finite/i)
const next = gameReducer(initial, createAdjustCrewStressAction(initial, 'crew_mika_tech', 20))
assert.equal(next.expedition.crewRunById.crew_mika_tech.stress, 100)
assert.equal(next.expedition.crewRunById.crew_mika_tech.stressStatus, 'breaking')
```

- [ ] **Step 2: Add exact action payload**

```ts
export interface ApplyCrewStressPayload {
  deltasByCrewId: Record<string, number>
  reason: 'travel' | 'gig' | 'rest' | 'restStop' | 'event' | 'crisis'
}
```

Action creator filters ids to selected `crewRunById` and finite integer deltas in `-100..100`.

- [ ] **Step 3: Implement reducer**

For each own key in the sanitized payload:

```ts
const stress = Math.max(0, Math.min(100, finiteNumberOr(current.stress, 0) + delta))
nextCrew[id] = {
  ...current,
  stress,
  stressStatus: getCrewStressStatus(stress)
}
```

Ignore the action if the Expedition is not active.

- [ ] **Step 4: Run reducer/action serialization gates**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionReducer.test.js tests/node/actionCreatorSerialization.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/context/actionTypes.ts src/types/actions.d.ts src/context/expeditionActionCreators.ts src/context/reducers/expeditionReducer.ts src/context/useExpeditionDispatchActions.ts tests/node/expeditionReducer.test.js tests/node/actionCreatorSerialization.test.js
git commit -m "feat(expedition): add crew stress actions"
```

---

### Task 6: Wire Stress Into Travel, Gigs, Rest Stops, and Voluntary Rest

**Files:**
- Modify: `src/hooks/travel/actions/useHandleNodeArrivalCallback.ts`
- Modify: `src/hooks/travel/useVanMaintenance.ts`
- Modify: `src/hooks/postGig/handlers/useContinueHandler.ts`
- Modify: `src/utils/arrivalUtils.ts`
- Test: `tests/node/useTravelLogic.test.js`, `tests/ui/useArrivalLogic.test.jsx`, `tests/node/postGig.test.js`, `tests/ui/usePostGigLogic.test.jsx`

- [ ] **Step 1: Add failing integration tests**

For an active Expedition with two selected crew, pin each canonical seam:

```jsx
const adjustCrewStress = vi.fn()
const active = makeExpeditionState({ crewIds: ['crew_mika_tech', 'crew_tom_driver'] })
await completeTravel({ state: active, adjustCrewStress })
expect(adjustCrewStress).toHaveBeenCalledWith({ crew_mika_tech: 4, crew_tom_driver: 4 })

await handleArrival({ ...active, node: { type: 'REST_STOP' }, adjustCrewStress })
expect(adjustCrewStress).toHaveBeenCalledWith({ crew_mika_tech: -15, crew_tom_driver: -15 })

await handleRestInVan({ state: active, adjustCrewStress })
expect(adjustCrewStress).toHaveBeenCalledWith({ crew_mika_tech: -25, crew_tom_driver: -25 })

await continuePostGig({ state: active, technicalCondition: 55, adjustCrewStress })
expect(adjustCrewStress).toHaveBeenCalledWith({ crew_mika_tech: 6, crew_tom_driver: 6 })

adjustCrewStress.mockClear()
await continuePostGig({ state: active, technicalCondition: 35, adjustCrewStress })
expect(adjustCrewStress).toHaveBeenCalledWith({ crew_mika_tech: 10, crew_tom_driver: 10 })
```

Add one legacy/inactive case asserting zero calls.

- [ ] **Step 2: Verify failures**

```bash
pnpm exec vitest run tests/ui/useArrivalLogic.test.jsx tests/ui/postGigHandlerLogic.test.jsx
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/useTravelLogic.test.js
```

Expected: new stress assertions FAIL.

- [ ] **Step 3: Add one helper to build same-delta maps**

```ts
export const buildCrewStressDeltas = (
  crewIds: readonly string[],
  delta: number
): Record<string, number> =>
  Object.fromEntries(crewIds.map(id => [id, delta]))
```

- [ ] **Step 4: Dispatch at canonical existing seams**

Use the `adjustCrewStress` dispatcher already added to the hook interfaces and the shared `buildCrewStressDeltas` helper:

```ts
// accepted travel, before arrival recovery
adjustCrewStress(buildCrewStressDeltas(activeCrewIds, 4))

// successful REST/REST_STOP arrival
adjustCrewStress(buildCrewStressDeltas(activeCrewIds, -15))

// confirmed Rest in Van
adjustCrewStress(buildCrewStressDeltas(activeCrewIds, -25))

// guarded post-gig continuation after technical condition is settled
const gigStress = technicalCondition < 40 ? 10 : 6
adjustCrewStress(buildCrewStressDeltas(activeCrewIds, gigStress))
```

Call these only when `state.expedition.status === 'active'`; do not add stress changes to daily tick, which would double-count action-driven stress and make non-action days ambiguous.

- [ ] **Step 5: Run regression gates**

```bash
pnpm run test:ui
pnpm run test:node
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/travel src/hooks/postGig/handlers/useContinueHandler.ts src/utils/arrivalUtils.ts src/domain/expedition/crewStress.ts tests
git commit -m "feat(expedition): apply crew stress from tour actions"
```

---

### Task 7: Implement Persistent Loyalty and Canonical Relationship Pair Keys

**Files:**
- Create: `src/domain/expedition/relationships.ts`
- Create: `src/context/careerActionCreators.ts`
- Create: `src/context/reducers/careerReducer.ts`
- Create: `src/context/useCareerDispatchActions.ts`
- Modify: `src/types/career.d.ts`
- Modify: `src/context/reducers/careerSanitizers.ts`
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/context/gameReducer.ts`
- Test: `tests/node/expeditionRelationships.test.js`
- Test: `tests/node/saveSliceRoundTrip.test.js`

- [ ] **Step 1: Write failing relationship tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  toCrewRelationshipKey,
  shiftRelationshipTier
} from '../../src/domain/expedition/relationships.ts'

test('pair key is order independent', () => {
  assert.equal(
    toCrewRelationshipKey('crew_mika_tech', 'crew_tom_driver'),
    toCrewRelationshipKey('crew_tom_driver', 'crew_mika_tech')
  )
})

test('relationship tier changes one step and clamps', () => {
  assert.equal(shiftRelationshipTier('neutral', -1), 'tense')
  assert.equal(shiftRelationshipTier('hostile', -1), 'hostile')
  assert.equal(shiftRelationshipTier('tense', 2), 'bonded')
})
```

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionRelationships.test.js
```

Expected: FAIL because relationship domain is missing.

- [ ] **Step 3: Implement exact helper**

```ts
import type { CrewRelationshipTier } from '../../types'

const RELATIONSHIP_ORDER: CrewRelationshipTier[] = [
  'hostile', 'tense', 'neutral', 'bonded'
]

export const toCrewRelationshipKey = (a: string, b: string): string =>
  [a, b].sort().join('::')

export const shiftRelationshipTier = (
  current: CrewRelationshipTier,
  delta: number
): CrewRelationshipTier => {
  const index = RELATIONSHIP_ORDER.indexOf(current)
  const safeIndex = index < 0 ? 2 : index
  return RELATIONSHIP_ORDER[Math.max(0, Math.min(3, safeIndex + Math.trunc(delta)))] ?? 'neutral'
}
```

- [ ] **Step 4: Add the first explicit Career action boundary**

Add to `ActionTypes`:

```ts
UPDATE_CREW_CAREER: 'UPDATE_CREW_CAREER',
SHIFT_CREW_RELATIONSHIP: 'SHIFT_CREW_RELATIONSHIP',
```

Add payloads to `src/types/actions.d.ts`:

```ts
export interface UpdateCrewCareerPayload {
  crewId: string
  loyaltyDelta: number
  storyStepDelta: number
  signatureTraitId: string | null
}

export interface ShiftCrewRelationshipPayload {
  firstCrewId: string
  secondCrewId: string
  tierDelta: number
}
```

`src/context/careerActionCreators.ts` owns boundary validation:

```ts
import { ActionTypes } from './actionTypes'
import type { GameAction } from '../types'
import { isFiniteNumber } from '../utils/gameState'
import { EXPEDITION_CREW_BY_ID } from '../data/expedition/crew'

export const updateCrewCareer = (
  crewId: unknown,
  loyaltyDelta: unknown,
  storyStepDelta: unknown,
  signatureTraitId: unknown
): Extract<GameAction, { type: typeof ActionTypes.UPDATE_CREW_CAREER }> => {
  if (
    typeof crewId !== 'string' ||
    !Object.hasOwn(EXPEDITION_CREW_BY_ID, crewId)
  ) {
    throw new TypeError('Unknown expedition crew id')
  }
  if (!isFiniteNumber(loyaltyDelta) || !isFiniteNumber(storyStepDelta)) {
    throw new TypeError('Crew career deltas must be finite numbers')
  }
  return {
    type: ActionTypes.UPDATE_CREW_CAREER,
    payload: {
      crewId,
      loyaltyDelta,
      storyStepDelta,
      signatureTraitId:
        typeof signatureTraitId === 'string' ? signatureTraitId : null
    }
  }
}

export const shiftCrewRelationship = (
  firstCrewId: unknown,
  secondCrewId: unknown,
  tierDelta: unknown
): Extract<GameAction, { type: typeof ActionTypes.SHIFT_CREW_RELATIONSHIP }> => {
  if (
    typeof firstCrewId !== 'string' ||
    typeof secondCrewId !== 'string' ||
    !Object.hasOwn(EXPEDITION_CREW_BY_ID, firstCrewId) ||
    !Object.hasOwn(EXPEDITION_CREW_BY_ID, secondCrewId) ||
    firstCrewId === secondCrewId
  ) {
    throw new TypeError('Relationship action requires two distinct known crew ids')
  }
  if (!isFiniteNumber(tierDelta)) {
    throw new TypeError('Relationship tier delta must be finite')
  }
  return {
    type: ActionTypes.SHIFT_CREW_RELATIONSHIP,
    payload: {
      firstCrewId,
      secondCrewId,
      tierDelta: Math.trunc(tierDelta)
    }
  }
}
```

Relationship pair keys are therefore never accepted in an action payload. The creator carries the two validated crew ids and the reducer derives the canonical key itself. Add hostile-boundary tests for `crewId: 'constructor'`, `crewId: '__proto__'`, a syntactically safe but unknown direct reducer pair such as `fake_a`/`crew_mika_tech`, direct reducer payloads containing `NaN`/`Infinity`, and corrupted stored `loyalty`/`storyStep`; action creators must reject hostile IDs and reducers must return the original state or normalize stored addends without persisting non-finite values.

- [ ] **Step 5: Implement and route `careerReducer`**

`src/context/reducers/careerReducer.ts` imports the strict numeric helpers, crew registry, and canonical relationship-key helper explicitly, then exports two handlers compatible with the root reducer map:

```ts
import { finiteNumberOr, isFiniteNumber } from '../../utils/gameState'
import { EXPEDITION_CREW_BY_ID } from '../../data/expedition/crew'
import { shiftRelationshipTier, toCrewRelationshipKey } from '../../domain/expedition/relationships'

export const handleUpdateCrewCareer = (state, payload) => {
  if (
    typeof payload.crewId !== 'string' ||
    !Object.hasOwn(EXPEDITION_CREW_BY_ID, payload.crewId) ||
    !isFiniteNumber(payload.loyaltyDelta) ||
    !isFiniteNumber(payload.storyStepDelta)
  ) {
    return state
  }

  const stored = state.career.crewProgressById[payload.crewId] ?? {
    loyalty: 0,
    storyStep: 0,
    signatureTraitIds: []
  }
  const previous = {
    ...stored,
    loyalty: Math.max(0, Math.min(100, finiteNumberOr(stored.loyalty, 0))),
    storyStep: Math.max(0, Math.trunc(finiteNumberOr(stored.storyStep, 0))),
    signatureTraitIds: Array.isArray(stored.signatureTraitIds)
      ? stored.signatureTraitIds.filter((id): id is string => typeof id === 'string')
      : []
  }
  const safeSignatureTraitId =
    typeof payload.signatureTraitId === 'string' ? payload.signatureTraitId : null
  const nextTraitIds = safeSignatureTraitId
    ? [...new Set([...previous.signatureTraitIds, safeSignatureTraitId])]
    : previous.signatureTraitIds

  return {
    ...state,
    career: {
      ...state.career,
      crewProgressById: {
        ...state.career.crewProgressById,
        [payload.crewId]: {
          ...previous,
          loyalty: Math.max(
            0,
            Math.min(100, previous.loyalty + payload.loyaltyDelta)
          ),
          storyStep: Math.max(
            0,
            previous.storyStep + Math.trunc(payload.storyStepDelta)
          ),
          signatureTraitIds: nextTraitIds
        }
      }
    }
  }
}

export const handleShiftCrewRelationship = (state, payload) => {
  if (
    typeof payload.firstCrewId !== 'string' ||
    typeof payload.secondCrewId !== 'string' ||
    !Object.hasOwn(EXPEDITION_CREW_BY_ID, payload.firstCrewId) ||
    !Object.hasOwn(EXPEDITION_CREW_BY_ID, payload.secondCrewId) ||
    payload.firstCrewId === payload.secondCrewId ||
    !isFiniteNumber(payload.tierDelta)
  ) {
    return state
  }
  const pairKey = toCrewRelationshipKey(
    payload.firstCrewId,
    payload.secondCrewId
  )
  return {
    ...state,
    career: {
      ...state.career,
      crewRelationshipByPair: {
        ...state.career.crewRelationshipByPair,
        [pairKey]: shiftRelationshipTier(
          state.career.crewRelationshipByPair[pairKey] ?? 'neutral',
          Math.trunc(payload.tierDelta)
        )
      }
    }
  }
}
```

Import both handlers into `gameReducer.ts` and add the two entries to `reducerMap`. Add both action variants to `GameAction`.

`src/context/useCareerDispatchActions.ts` exposes memoized callbacks that dispatch only `updateCrewCareer(...)` and `shiftCrewRelationship(...)`; later plans extend this hook rather than creating another career dispatch surface.

- [ ] **Step 6: Extend the failing relationship test through the root reducer**

Add assertions through the root reducer:

```js
let state = createInitialState()
state = gameReducer(state, shiftCrewRelationship('crew_mika_tech', 'crew_tom_driver', -1))
assert.equal(state.career.crewRelationshipByPair['crew_mika_tech::crew_tom_driver'], 'tense')
state = gameReducer(state, updateCrewCareer('crew_mika_tech', 5, 1, 'signature_macgyver'))
state = gameReducer(state, updateCrewCareer('crew_mika_tech', 0, 0, 'signature_macgyver'))
assert.deepEqual(state.career.crewProgressById.crew_mika_tech.signatureTraitIds, ['signature_macgyver'])

const beforeMalformedPair = state
const malformedPair = gameReducer(state, {
  type: ActionTypes.SHIFT_CREW_RELATIONSHIP,
  payload: { firstCrewId: 'fake_a', secondCrewId: 'crew_mika_tech', tierDelta: 1 }
})
assert.strictEqual(malformedPair, beforeMalformedPair)
```

- [ ] **Step 7: Run persistence/reducer tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionRelationships.test.js tests/node/saveSliceRoundTrip.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/domain/expedition/relationships.ts src/types/career.d.ts src/types/actions.d.ts src/context/actionTypes.ts src/context/careerActionCreators.ts src/context/reducers/careerReducer.ts src/context/reducers/careerSanitizers.ts src/context/useCareerDispatchActions.ts src/context/gameReducer.ts tests/node/expeditionRelationships.test.js tests/node/saveSliceRoundTrip.test.js
git commit -m "feat(expedition): persist crew loyalty and relationships"
```

---

### Task 8: Add Band-Member Injury Escalation Without Random Instant Failure

**Files:**
- Create: `src/domain/expedition/injuries.ts`
- Modify: `src/types/expedition.d.ts`
- Modify: `src/domain/expedition/defaults.ts`
- Modify: `src/context/reducers/expeditionSanitizers.ts`
- Modify: `src/context/expeditionActionCreators.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Test: `tests/node/expeditionInjuries.test.js`

- [ ] **Step 1: Add failing injury tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getInjuryRiskBand,
  advanceInjuryStage
} from '../../src/domain/expedition/injuries.ts'

test('stamina risk is telegraphed before critical injury', () => {
  assert.equal(getInjuryRiskBand(60), 'safe')
  assert.equal(getInjuryRiskBand(34), 'strained')
  assert.equal(getInjuryRiskBand(19), 'danger')
})

test('injury advances one stage per accepted injury event', () => {
  assert.equal(advanceInjuryStage('none'), 'strain')
  assert.equal(advanceInjuryStage('strain'), 'light')
  assert.equal(advanceInjuryStage('light'), 'serious')
  assert.equal(advanceInjuryStage('serious'), 'critical')
  assert.equal(advanceInjuryStage('critical'), 'critical')
})
```

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionInjuries.test.js
```

Expected: FAIL because injury domain is missing.

- [ ] **Step 3: Add run injury state by existing band member id**

Add:

```ts
memberInjuriesById: Record<string, InjuryStage>
```

Default `{}`; sanitizer accepts only known injury enums and safe own keys.

- [ ] **Step 4: Implement pure injury rules**

```ts
import type { InjuryStage } from '../../types'

const ORDER: InjuryStage[] = ['none', 'strain', 'light', 'serious', 'critical']

export const getInjuryRiskBand = (
  stamina: number
): 'safe' | 'strained' | 'danger' =>
  stamina < 20 ? 'danger' : stamina < 35 ? 'strained' : 'safe'

export const advanceInjuryStage = (stage: InjuryStage): InjuryStage => {
  const i = ORDER.indexOf(stage)
  return ORDER[Math.min(ORDER.length - 1, Math.max(0, i) + 1)] ?? 'strain'
}
```

- [ ] **Step 5: Add deterministic injury action intent**

`createResolvePostGigInjuryAction(state, memberId, roll)` remains deterministic and can advance only one stage:

```ts
export const createResolvePostGigInjuryAction = (
  state: GameState,
  memberId: string,
  roll: number
): Extract<GameAction, { type: typeof ActionTypes.ADVANCE_EXPEDITION_INJURY }> | null => {
  const member = state.band.members.find(item => item.id === memberId)
  if (!member) throw new TypeError('Unknown band member')
  const risk = member.stamina >= 35 ? 0 : member.stamina >= 20 ? 0.1 : 0.25
  if (risk === 0 || roll >= risk) return null
  const current = state.expedition.memberInjuriesById[memberId] ?? 'none'
  return {
    type: ActionTypes.ADVANCE_EXPEDITION_INJURY,
    payload: { memberId, expectedStage: current, nextStage: advanceInjuryStage(current) }
  }
}
```

Reducer rejects stale `expectedStage` replays, so one roll cannot skip stages.

- [ ] **Step 6: Run tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionInjuries.test.js tests/node/expeditionReducer.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain/expedition/injuries.ts src/types/expedition.d.ts src/domain/expedition/defaults.ts src/context/reducers/expeditionSanitizers.ts src/context/expeditionActionCreators.ts src/context/reducers/expeditionReducer.ts tests/node/expeditionInjuries.test.js tests/node/expeditionReducer.test.js
git commit -m "feat(expedition): add staged band injuries"
```

---

### Task 9: Extend the G2 Event Pipeline With Crew Stress and Explicit Rival-Battle Intent

**Dependency:** G2 Task 10 is complete and its `EventDelta.expedition -> eventResolver -> APPLY_EXPEDITION_EVENT_DELTA -> expeditionReducer` path is green.

**Files:**
- Modify: `src/types/events.d.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/types/game.d.ts`
- Modify: `src/types/expedition.d.ts`
- Modify: `src/domain/expedition/defaults.ts`
- Modify: `src/context/reducers/expeditionSanitizers.ts`
- Modify: `src/utils/eventEngine/eventEffectHandlers.ts`
- Modify: `src/domain/eventResolver.ts`
- Modify: `src/context/actionTypes.ts`
- Modify: `src/context/expeditionActionCreators.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Test: `tests/node/eventEngine_resolver.test.js`
- Test: `tests/node/domain/eventResolver.test.js`
- Test: `tests/node/eventReducer.test.js`
- Test: `tests/node/actionCreatorSerialization.test.js`

This task **extends** the single G2 event contract. It must not reintroduce direct Expedition handling in `src/utils/gameState/delta.ts` and must not create a second event adapter.

- [ ] **Step 1: Add a failing crew/rival extension test through the full pipeline**

Use an active Expedition with Mika selected:

```js
const choice = {
  effect: {
    type: 'expedition',
    delta: {
      crewStress: { crew_mika_tech: 15 },
      heat: 4,
      condition: { pa: -5 },
      cargo: { spareParts: -1 },
      rivalBattlePending: true
    }
  }
}

const engineResolution = resolveEventChoice(choice, activeState)
assert.deepEqual(engineResolution.delta.expedition?.crewStress, {
  crew_mika_tech: 15
})
assert.equal(engineResolution.delta.expedition?.rivalBattlePending, true)

const resolution = resolveEvent(choice, activeState, fixedClock)
let reduced = activeState
for (const action of resolution.actions) reduced = gameReducer(reduced, action)
assert.equal(reduced.expedition.crewRunById.crew_mika_tech.stress, 15)
assert.equal(reduced.expedition.pressure.heat, activeState.expedition.pressure.heat + 4)
assert.equal(reduced.expedition.condition.pa, activeState.expedition.condition.pa - 5)
assert.equal(reduced.expedition.cargo.spareParts, 0)
assert.equal(reduced.expedition.rivalBattlePending, true)
```

Add direct reducer assertions for unknown `crewId: 'fake_a'`, prototype names, unselected known crew, `NaN` stress, and a non-boolean Rival Battle payload; all must preserve the original state reference.

- [ ] **Step 2: Extend the existing event/state types, defaults, and sanitizer**

Add to the **existing** `ExpeditionEventDelta` from G2:

```ts
crewStress?: Record<string, number>
rivalBattlePending?: boolean
```

Extend the existing `ApplyExpeditionEventDeltaPayload` with:

```ts
crewStress: Record<string, number>
```

Add to `ExpeditionState`:

```ts
rivalBattlePending: boolean
```

Default it to `false`. `sanitizeExpeditionState` accepts only a literal boolean and otherwise falls back to `false`.

- [ ] **Step 3: Extend the registered `expedition` event handler, do not replace it**

Inside the G2 handler, add structural finite-number handling for crew stress and the one-way battle intent:

```ts
if (isLooseRecord(raw.crewStress)) {
  const crewStress = { ...(current.crewStress ?? {}) }
  for (const [crewId, value] of Object.entries(raw.crewStress)) {
    if (isForbiddenKey(crewId) || !isFiniteNumber(value)) continue
    crewStress[crewId] = finiteNumberOr(crewStress[crewId], 0) + value
  }
  if (Object.keys(crewStress).length > 0) next.crewStress = crewStress
}

if (raw.rivalBattlePending === true) next.rivalBattlePending = true
```

The event engine performs only structural sanitation here. Known/selected crew validation remains at the action-creator and reducer boundaries where `EXPEDITION_CREW_BY_ID` and current loadout are available.

- [ ] **Step 4: Extend the existing event action creator and add an explicit battle-pending action**

`createApplyExpeditionEventDeltaAction(state, raw)` now receives the current `GameState` so it can keep crew-stress entries only when:

```text
Object.hasOwn(EXPEDITION_CREW_BY_ID, crewId)
AND state.expedition.loadout.crewIds.includes(crewId)
AND value is finite
```

The creator preserves all G2 pressure/Condition/cargo validation.

Add one separate action:

```ts
SET_RIVAL_BATTLE_PENDING: 'SET_RIVAL_BATTLE_PENDING'
```

with payload `boolean` and creator:

```ts
export const createSetRivalBattlePendingAction = (
  value: unknown
): Extract<GameAction, { type: typeof ActionTypes.SET_RIVAL_BATTLE_PENDING }> => {
  if (typeof value !== 'boolean') throw new TypeError('rival battle pending must be boolean')
  return { type: ActionTypes.SET_RIVAL_BATTLE_PENDING, payload: value }
}
```

- [ ] **Step 5: Extend `eventResolver` without adding event-specific string checks**

Change the G2 creator call to pass `state`, then convert the sanitized battle intent to the explicit setter action:

```ts
if (expeditionDelta) {
  const expeditionAction = createApplyExpeditionEventDeltaAction(
    state,
    expeditionDelta
  )
  if (expeditionAction) actions.push(expeditionAction)
  if (expeditionDelta.rivalBattlePending === true) {
    actions.push(createSetRivalBattlePendingAction(true))
  }
}
```

Do not inspect event ids such as `expedition_rival_double_booked` or choice ids such as `battle` in `eventResolver`.

- [ ] **Step 6: Revalidate crew endpoints and the battle flag in `expeditionReducer`**

Extend the existing G2 `APPLY_EXPEDITION_EVENT_DELTA` handler. Before applying anything, reject a payload if any `crewStress` key is unknown, not selected in the active loadout, prototype-derived, or non-finite. Apply valid signed stress with clamp `0..100` using `finiteNumberOr` for stored stress.

`SET_RIVAL_BATTLE_PENDING` updates only an active Expedition, accepts only boolean payloads, and returns the identical state when the value is unchanged. Post-rival-gig resolution uses the same action with `false`; no reducer infers this flag from rival state.

- [ ] **Step 7: Run extension pipeline and serialization gates**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/eventEngine_resolver.test.js \
  tests/node/domain/eventResolver.test.js \
  tests/node/eventReducer.test.js \
  tests/node/actionCreatorSerialization.test.js
pnpm run typecheck:core
pnpm run typecheck
```

Expected: PASS, including the unchanged G2 base event tests.

- [ ] **Step 8: Commit**

```bash
git add src/types/events.d.ts src/types/actions.d.ts src/types/game.d.ts src/types/expedition.d.ts src/domain/expedition/defaults.ts src/context/reducers/expeditionSanitizers.ts src/utils/eventEngine/eventEffectHandlers.ts src/domain/eventResolver.ts src/context/actionTypes.ts src/context/expeditionActionCreators.ts src/context/reducers/expeditionReducer.ts tests/node/eventEngine_resolver.test.js tests/node/domain/eventResolver.test.js tests/node/eventReducer.test.js tests/node/actionCreatorSerialization.test.js
git commit -m "feat(events): extend expedition effects for crew crises"
```

---

### Task 10: Add Three Initial Crew Crisis Events

**Files:**
- Create: `src/data/events/crew.ts`
- Modify: `src/data/events/index.ts`
- Modify: `public/locales/en/events.json`
- Modify: `public/locales/de/events.json`
- Test: `tests/data/events/validation.test.js`, `tests/node/eventValidator.test.js`, `tests/ui/events.data.test.jsx`

- [ ] **Step 1: Add failing registry test**

Assert `KNOWN_EVENT_IDS` includes:

```js
[
  'expedition_crew_tech_breakdown',
  'expedition_crew_driver_exhausted',
  'expedition_crew_conflict_mika_tom'
]
```

- [ ] **Step 2: Verify failure**

```bash
pnpm run test:node
```

Expected: missing event ids.

- [ ] **Step 3: Add exact event definitions under existing `band` category**

Use existing validator-compatible fields. The first definition establishes the exact shape; the other two follow the same typed event schema:

```ts
export const EXPEDITION_CREW_EVENTS = [
  {
    id: 'expedition_crew_tech_breakdown',
    category: 'band', trigger: 'random', chance: 0.08,
    condition: state =>
      state.expedition.status === 'active' &&
      state.expedition.loadout.crewIds.includes('crew_mika_tech') &&
      (state.expedition.crewRunById.crew_mika_tech?.stress ?? 0) >= 70,
    options: [
      { id: 'pay_repair', label: 'events:expedition_crew_tech_breakdown.pay', effect: { type: 'composite', effects: [
        { type: 'resource', resource: 'money', value: -850 },
        { type: 'expedition', delta: { crewStress: { crew_mika_tech: -20 }, condition: { pa: 20 } } }
      ] } },
      { id: 'use_spare', label: 'events:expedition_crew_tech_breakdown.spare', condition: state => state.expedition.cargo.spareParts > 0, effect: { type: 'expedition', delta: { cargo: { spareParts: -1 }, crewStress: { crew_mika_tech: -10 }, condition: { pa: 12 } } } },
      { id: 'play_smaller', label: 'events:expedition_crew_tech_breakdown.smaller', effect: { type: 'composite', effects: [
        { type: 'resource', resource: 'fame', value: -300 },
        { type: 'expedition', delta: { condition: { pa: 5 } } }
      ] } }
    ]
  },
  {
    id: 'expedition_crew_driver_exhausted', category: 'band', trigger: 'travel', chance: 0.08,
    condition: state =>
      state.expedition.status === 'active' &&
      state.expedition.loadout.crewIds.includes('crew_tom_driver') &&
      (state.expedition.crewRunById.crew_tom_driver?.stress ?? 0) >= 70,
    options: [
      { id: 'rest', label: 'events:expedition_crew_driver_exhausted.rest', effect: { type: 'composite', effects: [
        { type: 'stat', stat: 'stamina', value: 10 },
        { type: 'expedition', delta: { crewStress: { crew_tom_driver: -25 } } }
      ] } },
      { id: 'push_on', label: 'events:expedition_crew_driver_exhausted.push', effect: { type: 'expedition', delta: { crewStress: { crew_tom_driver: 15 }, heat: 3 } } }
    ]
  },
  {
    id: 'expedition_crew_conflict_mika_tom', category: 'band', trigger: 'random', chance: 0.06,
    condition: state =>
      state.expedition.status === 'active' &&
      state.expedition.loadout.crewIds.includes('crew_mika_tech') &&
      state.expedition.loadout.crewIds.includes('crew_tom_driver'),
    options: [
      { id: 'mediate', label: 'events:expedition_crew_conflict_mika_tom.mediate', condition: state => state.expedition.loadout.crewIds.includes('crew_leyla_manager'), effect: { type: 'composite', effects: [
        { type: 'stat', stat: 'harmony', value: 5 },
        { type: 'expedition', delta: { crewStress: { crew_mika_tech: -10, crew_tom_driver: -10 } } }
      ] } },
      { id: 'side_with_mika', label: 'events:expedition_crew_conflict_mika_tom.side', effect: { type: 'composite', effects: [
        { type: 'stat', stat: 'harmony', value: -5 },
        { type: 'expedition', delta: { crewStress: { crew_mika_tech: -15, crew_tom_driver: 10 } } }
      ] } }
    ]
  }
]
```

For v1 the conflict event is deliberately an explicit Mika/Tom pair so raw event deltas can stay keyed by known crew ids. Additional pair events can reuse the same pattern later. Permanent relationship/loyalty changes remain typed career actions dispatched once from the resolution callback for the selected option id.

- [ ] **Step 4: Register and localize**

Register the new array in the existing validated registry:

```ts
// src/data/events/index.ts
import { EXPEDITION_CREW_EVENTS } from './crew'

export const ALL_RAW_EVENTS = [
  ...TRANSPORT_EVENTS,
  ...BAND_EVENTS,
  ...GIG_EVENTS,
  ...FINANCIAL_EVENTS,
  ...SPECIAL_EVENTS,
  ...CRISIS_EVENTS,
  ...CONSEQUENCE_EVENTS,
  ...RELATIONSHIP_EVENTS,
  ...QUEST_EVENTS,
  ...EXPEDITION_CREW_EVENTS
]
```

Add the exact `expedition_crew_tech_breakdown`, `expedition_crew_driver_exhausted`, and `expedition_crew_conflict_mika_tom` title/description/option/outcome keys to both `public/locales/en/events.json` and `public/locales/de/events.json`.

- [ ] **Step 5: Run event/i18n gates**

```bash
pnpm run test:node
pnpm run test:additional
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/data/events/crew.ts src/data/events/index.ts public/locales/en/events.json public/locales/de/events.json tests
git commit -m "feat(events): add expedition crew crises"
```

---

### Task 11: Surface Crew in Tour Prep and Contextually During Runs

**Files:**
- Create: `src/ui/expedition/CrewPicker.tsx`
- Create: `src/ui/expedition/CrewStatusPanel.tsx`
- Modify: `src/ui/expedition/TourPrepLoadout.tsx`
- Modify: `src/ui/expedition/ExpeditionStatusStrip.tsx`
- Modify: `public/locales/en/ui.json`
- Modify: `public/locales/de/ui.json`
- Test: `tests/ui/ExpeditionCrewPicker.test.tsx`
- Test: `tests/ui/ExpeditionCrewStatus.test.tsx`

- [ ] **Step 1: Write failing UI tests**

Assert:

- four starter crew cards render before unlocks;
- locked Manager/Security render only when their unlock ids exist;
- selecting a fourth actor is prevented;
- status strip shows no six extra stress bars;
- opening `Crew` shows semantic status (`calm`, `strained`, `critical`, `breaking`) plus injury/loyalty when relevant.

- [ ] **Step 2: Verify failure**

```bash
pnpm exec vitest run tests/ui/ExpeditionCrewPicker.test.tsx tests/ui/ExpeditionCrewStatus.test.tsx
```

Expected: FAIL because UI is missing.

- [ ] **Step 3: Implement picker/status components**

Implement the picker/status components from canonical selectors:

```tsx
export const CrewPicker = ({ crewIds, unlocks, onChange }: Props) => {
  const available = EXPEDITION_CREW.filter(actor => isCrewAvailable(actor.id, unlocks))
  const toggle = (id: string) => {
    const next = crewIds.includes(id) ? crewIds.filter(value => value !== id) : [...crewIds, id]
    if (next.length <= MAX_EXPEDITION_CREW_SLOTS) onChange(next)
  }
  return <CrewChoiceList actors={available} selectedIds={crewIds} onToggle={toggle} />
}

export const CrewStatusPanel = ({ state }: { state: GameState }) => (
  <CrewStatusList rows={state.expedition.loadout.crewIds.map(id => buildCrewStatusRow(state, id))} />
)
```

- [ ] **Step 4: Add EN/DE crew copy**

Add matching locale structure. Example keys:

```json
{ "expedition": { "crew": { "roles": { "technician": "Technician", "roadie": "Roadie", "driver": "Driver", "manager": "Manager", "scout": "Scout", "security": "Security" }, "stress": { "calm": "Calm", "strained": "Strained", "critical": "Critical", "breaking": "Breaking" }, "loyalty": "Loyalty", "slots": "Crew {{used}} / {{max}}" } } }
```

```json
{ "expedition": { "crew": { "roles": { "technician": "Techniker", "roadie": "Roadie", "driver": "Fahrer", "manager": "Manager", "scout": "Scout", "security": "Security" }, "stress": { "calm": "Ruhig", "strained": "Angespannt", "critical": "Kritisch", "breaking": "Kurz vor dem Ausstieg" }, "loyalty": "Loyalität", "slots": "Crew {{used}} / {{max}}" } } }
```

Add the six actor-specific name/talent/trait/vice keys beside this shared structure in both languages.

- [ ] **Step 5: Run UI/a11y/i18n**

```bash
pnpm exec vitest run tests/ui/ExpeditionCrewPicker.test.tsx tests/ui/ExpeditionCrewStatus.test.tsx
pnpm run test:additional
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/ui/expedition public/locales/en/ui.json public/locales/de/ui.json tests/ui/ExpeditionCrewPicker.test.tsx tests/ui/ExpeditionCrewStatus.test.tsx
git commit -m "feat(expedition): add crew loadout and status UI"
```

---

### Task 12: Add G3 Crew/Stress/Injury Metrics to Balance Simulation

**Files:**
- Modify: `scripts/game-balance-simulation.mjs`
- Modify: `scripts/utils/balance-report-metadata.mjs`
- Test: `tests/node/game-balance-simulation.test.js`, `tests/node/balanceSourceFiles.test.js`

- [ ] **Step 1: Add failing report-contract fields**

Require:

```js
[
  'avgCrewStressAtExtraction',
  'p90CrewStressAtExtraction',
  'crewCrisisRunsPct',
  'breakingCrewRunsPct',
  'injuryRunsPct',
  'seriousInjuryRunsPct',
  'avgRestStressRelief',
  'crewRolePickRates'
]
```

- [ ] **Step 2: Verify failure**

```bash
pnpm run test:node
```

Expected: report contract FAILS on new fields.

- [ ] **Step 3: Import production crew helpers and add source fingerprints**

Import production helpers directly into the simulator and fingerprint them:

```js
import { getCrewStressStatus, calculateCrewStressDelta, getCrewAggregateEffects } from '../src/domain/expedition/crewStress.ts'
import { getInjuryRiskBand, advanceInjuryStage } from '../src/domain/expedition/injuries.ts'
```

```js
for (const source of [
  'src/data/expedition/crew.ts',
  'src/domain/expedition/crew.ts',
  'src/domain/expedition/crewStress.ts',
  'src/domain/expedition/injuries.ts'
]) {
  assert.ok(BALANCE_SOURCE_FILES.includes(source))
}
```

- [ ] **Step 4: Add deterministic crew policies to scenario variants**

At minimum simulate these four selections in addition to scenario economics:

```text
Technical: Mika + Anja + Tom
Intel: Nico + Tom + Mika
Sponsor: Leyla + Nico + Tom (only in a branch with Manager unlocked)
Chaos Safety: Saskia + Mika + Tom (only in a branch with Security unlocked)
```

Use separate scenario ids/seed streams for strategy comparison rather than swapping crew inside the same seeded run.

- [ ] **Step 5: Report, but do not hard-gate, initial crew design bands**

First report only measured distributions. Suggested soft review warnings:

- `breakingCrewRunsPct > 25%` on Standard baseline;
- `seriousInjuryRunsPct > 15%` on Standard baseline;
- any one crew actor picked in `>80%` of simulated strategies with both higher reward and lower failure than alternatives.

These remain design warnings until playtest/simulator data establishes stable targets.

- [ ] **Step 6: Run G3 gate**

```bash
pnpm run test:node
pnpm run test:ui
pnpm run typecheck:core
pnpm run deadcode:check
pnpm run simulate:balance
```

Expected: PASS; new crew metrics appear in calibration and holdout artifacts.

- [ ] **Step 7: Commit**

```bash
git add scripts/game-balance-simulation.mjs reports tests
git commit -m "test(balance): measure expedition crew pressure"
```

---

## G3 Exit Criteria

- Exactly three crew slots; no payroll/timesheet system.
- Starter crew and unlock-gated crew use the existing unlock boundary.
- Stress is event/action-driven, semantic in UI, and saved safely.
- Rest actually reduces crew pressure, making it a strategically valuable option.
- Injury escalation is staged and telegraphed; one RNG roll cannot instantly destroy a run.
- Loyalty/relationships persist, run stress does not.
- Crew crises are normal validated events and cannot mutate persistent career state through raw event data.
- Simulator can compare crew strategies and expose dominant picks before Pressure/Contracts are added.
