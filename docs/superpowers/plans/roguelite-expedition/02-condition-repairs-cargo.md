# Condition, Repairs, and Cargo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing van, long-term tourbus modules, pre-gig minigames, and Supply Stops into a coherent expedition risk layer with cargo limits, grouped technical condition, hidden defects, repair choices, and simulator-visible economic sinks without introducing a third vehicle state model.

**Architecture:** Keep `player.van.fuel` and `player.van.condition` authoritative for live travel because the travel minigame already settles those values. Select one existing `tourbus_chassis` asset in the Expedition loadout for chassis/module identity and derive expedition bonuses through a pure adapter. Store only non-vehicle technical condition (`pa`, `instruments`, `stageGear`), cargo consumables, setup protection, and hidden defects in `expedition`; all wear/repair mutations go through typed action creators and the Expedition reducer.

**Tech Stack:** TypeScript 6, React 19, existing long-term asset registry/selectors, existing travel/minigame reducers, deterministic action creators, Vitest/Node tests, i18next, balance simulator.

---

## Depends On

- `01-expedition-core-extraction.md` merged through G1.
- `GameState.expedition` exists and saves round-trip.
- `TourPrep` can choose `activeTourbusAssetId`.
- Standard Expedition can reach Overworld and complete gigs.

## File Structure

**Create:**

- `src/domain/expedition/vehicle.ts`
- `src/domain/expedition/cargo.ts`
- `src/domain/expedition/condition.ts`
- `src/domain/expedition/repairs.ts`
- `src/data/expedition/insurance.ts`
- `src/domain/expedition/insurance.ts`
- `src/data/expedition/repairCatalog.ts`
- `src/ui/expedition/ConditionPanel.tsx`
- `src/ui/expedition/RepairChoices.tsx`
- `tests/node/expeditionVehicleAdapter.test.js`
- `tests/node/expeditionCargo.test.js`
- `tests/node/expeditionCondition.test.js`
- `tests/node/expeditionRepairs.test.js`
- `tests/node/expeditionInsurance.test.js`
- `tests/ui/ExpeditionConditionPanel.test.tsx`
- `tests/ui/SupplyStopExpedition.test.tsx`

**Modify:**

- `src/types/assets.d.ts`
- `src/types/expedition.d.ts`
- `src/types/events.d.ts`
- `src/utils/assetSelectors/assetFinancials.ts`
- `src/utils/assetSections/tourbusModules.ts`
- `src/context/actionTypes.ts`
- `src/types/actions.d.ts`
- `src/context/expeditionActionCreators.ts`
- `src/context/reducers/expeditionReducer.ts`
- `src/context/reducers/expeditionSanitizers.ts`
- `src/context/useExpeditionDispatchActions.ts`
- `src/context/reducers/minigameReducer.ts`
- `src/utils/gameState/delta.ts`
- `src/hooks/postGig/handlers/useContinueHandler.ts`
- `src/ui/SupplyStopModal.tsx`
- `src/hooks/overworld/useSupplyStopModal.ts`
- `src/components/overworld/OverworldModals.tsx`
- `src/ui/expedition/TourPrepLoadout.tsx`
- `src/ui/expedition/ExpeditionStatusStrip.tsx`
- `public/locales/en/ui.json`
- `public/locales/de/ui.json`
- `scripts/game-balance-simulation.mjs`
- relevant source list in `scripts/game-balance-simulation.mjs`
- `tests/ui/SupplyStopModal.test.jsx`
- `tests/node/eventReducer.test.js`
- existing minigame reducer tests for Roadie/Kabelsalat/Amp Calibration

---

### Task 1: Extend Expedition State With Cargo and Setup Protection

**Files:**
- Modify: `src/types/expedition.d.ts`
- Modify: `src/domain/expedition/defaults.ts`
- Modify: `src/context/reducers/expeditionSanitizers.ts`
- Test: `tests/node/expeditionDefaults.test.js`
- Test: `tests/node/expeditionSanitizers.test.js`

- [ ] **Step 1: Write failing state-shape tests**

Add:

```js
test('expedition defaults include empty consumable cargo and zero setup protection', () => {
  const state = createDefaultExpeditionState()
  assert.deepEqual(state.cargo, {
    spareParts: 0,
    supplies: 0,
    merchSlotsUsed: 0,
    contrabandSlotsUsed: 0
  })
  assert.deepEqual(state.setupProtection, {
    pa: 0,
    instruments: 0,
    stageGear: 0
  })
})

test('expedition sanitizer clamps cargo and setup protection', () => {
  const state = sanitizeExpeditionState({
    cargo: { spareParts: Infinity, supplies: -4, merchSlotsUsed: 3.9 },
    setupProtection: { pa: 140, instruments: -1, stageGear: 22 }
  })
  assert.deepEqual(state.cargo, {
    spareParts: 0,
    supplies: 0,
    merchSlotsUsed: 3,
    contrabandSlotsUsed: 0
  })
  assert.deepEqual(state.setupProtection, {
    pa: 100,
    instruments: 0,
    stageGear: 22
  })
})
```

- [ ] **Step 2: Run tests and verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionDefaults.test.js tests/node/expeditionSanitizers.test.js
```

Expected: FAIL because `cargo` and `setupProtection` are absent.

- [ ] **Step 3: Add exact state fields**

Add to `src/types/expedition.d.ts`:

```ts
export interface ExpeditionCargoState {
  spareParts: number
  supplies: number
  merchSlotsUsed: number
  contrabandSlotsUsed: number
}

export interface ExpeditionSetupProtection {
  pa: number
  instruments: number
  stageGear: number
}
```

Add to `ExpeditionState`:

```ts
cargo: ExpeditionCargoState
setupProtection: ExpeditionSetupProtection
```

In `createDefaultExpeditionState()` add:

```ts
cargo: {
  spareParts: 0,
  supplies: 0,
  merchSlotsUsed: 0,
  contrabandSlotsUsed: 0
},
setupProtection: {
  pa: 0,
  instruments: 0,
  stageGear: 0
},
```

Sanitize cargo counters as bounded non-negative integers and setup protection with the existing `0..100` clamp. Do not coerce strings/booleans.

- [ ] **Step 4: Re-run tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionDefaults.test.js tests/node/expeditionSanitizers.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/types/expedition.d.ts src/domain/expedition/defaults.ts src/context/reducers/expeditionSanitizers.ts tests/node/expeditionDefaults.test.js tests/node/expeditionSanitizers.test.js
git commit -m "feat(expedition): add cargo and setup protection state"
```

---

### Task 2: Add a Pure Vehicle/Asset Adapter Instead of Duplicating Van State

**Files:**
- Create: `src/domain/expedition/vehicle.ts`
- Modify: `src/types/assets.d.ts`
- Modify: `src/utils/assetSelectors/assetFinancials.ts`
- Test: `tests/node/expeditionVehicleAdapter.test.js`

- [ ] **Step 1: Write failing adapter tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { getExpeditionVehicleState } from '../../src/domain/expedition/vehicle.ts'

const baseState = {
  player: { van: { fuel: 77, condition: 64 } },
  expedition: { loadout: { activeTourbusAssetId: 'bus_1' } },
  assets: [
    {
      id: 'bus_1',
      kind: 'tourbus_chassis',
      condition: 12,
      slots: [
        { installedModuleId: 'tb_roof_rack' },
        { installedModuleId: 'tb_sleeping_bunks' }
      ]
    }
  ]
}

test('vehicle adapter keeps live fuel and condition on player.van', () => {
  const result = getExpeditionVehicleState(baseState)
  assert.equal(result.fuel, 77)
  assert.equal(result.condition, 64)
  assert.equal(result.assetId, 'bus_1')
})

test('vehicle adapter falls back safely when selected asset is missing', () => {
  const result = getExpeditionVehicleState({
    ...baseState,
    expedition: { loadout: { activeTourbusAssetId: 'missing' } }
  })
  assert.equal(result.assetId, null)
  assert.deepEqual(result.moduleIds, [])
})
```

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionVehicleAdapter.test.js
```

Expected: FAIL because the adapter is missing.

- [ ] **Step 3: Add Expedition-specific module bonus fields**

Extend `AssetBoni` with:

```ts
cargoCapacityBonus?: number
roadWearMultiplier?: number
technicalWearMultiplier?: number
fieldRepairEfficiency?: number
inspectionLevel?: number
hiddenContrabandSlots?: number
```

All multipliers default to `1`, integer/additive bonuses default to `0`.

- [ ] **Step 4: Implement the adapter**

`src/domain/expedition/vehicle.ts` public contract:

```ts
import type { GameState } from '../../types'
import { finiteNumberOr } from '../../utils/finiteNumber'
import { getAssetAggregateBoni } from '../../utils/assetSelectors'

export interface ExpeditionVehicleState {
  assetId: string | null
  fuel: number
  condition: number
  moduleIds: string[]
  cargoCapacityBonus: number
  roadWearMultiplier: number
  technicalWearMultiplier: number
  fieldRepairEfficiency: number
  inspectionLevel: number
  hiddenContrabandSlots: number
}

export const getExpeditionVehicleState = (
  state: Pick<GameState, 'player' | 'assets' | 'expedition'>
): ExpeditionVehicleState => {
  const selectedId = state.expedition.loadout.activeTourbusAssetId
  const asset =
    selectedId === null
      ? null
      : state.assets.find(
          candidate =>
            candidate.id === selectedId && candidate.kind === 'tourbus_chassis'
        ) ?? null
  const boni = asset ? getAssetAggregateBoni(asset) : {}
  const moduleIds = asset
    ? asset.slots.flatMap(slot =>
        typeof slot.installedModuleId === 'string' ? [slot.installedModuleId] : []
      )
    : []
  return {
    assetId: asset?.id ?? null,
    fuel: Math.max(0, finiteNumberOr(state.player.van?.fuel, 0)),
    condition: Math.max(0, Math.min(100, finiteNumberOr(state.player.van?.condition, 100))),
    moduleIds,
    cargoCapacityBonus: finiteNumberOr(boni.cargoCapacityBonus, 0),
    roadWearMultiplier: finiteNumberOr(boni.roadWearMultiplier, 1),
    technicalWearMultiplier: finiteNumberOr(boni.technicalWearMultiplier, 1),
    fieldRepairEfficiency: finiteNumberOr(boni.fieldRepairEfficiency, 0),
    inspectionLevel: finiteNumberOr(boni.inspectionLevel, 0),
    hiddenContrabandSlots: finiteNumberOr(boni.hiddenContrabandSlots, 0)
  }
}
```

Update `src/utils/assetSelectors/assetFinancials.ts` so the new keys are included in the existing aggregation lists:

```ts
const ADDITIVE_BONI_KEYS = [
  // existing keys...
  'cargoCapacityBonus',
  'fieldRepairEfficiency',
  'inspectionLevel',
  'hiddenContrabandSlots'
] as const satisfies readonly (keyof AssetBoni)[]

const MULTIPLICATIVE_BONI_KEYS = [
  // existing keys...
  'roadWearMultiplier',
  'technicalWearMultiplier'
] as const satisfies readonly (keyof AssetBoni)[]
```

- [ ] **Step 5: Run adapter and selector tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionVehicleAdapter.test.js tests/node/assetSelectors.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/types/assets.d.ts src/utils/assetSelectors/assetFinancials.ts src/domain/expedition/vehicle.ts tests/node/expeditionVehicleAdapter.test.js
git commit -m "feat(expedition): adapt existing tourbus state"
```

---

### Task 3: Give Existing Tourbus Modules Expedition Rule Effects

**Files:**
- Modify: `src/utils/assetSections/tourbusModules.ts`
- Test: `tests/node/assetConfig.test.js`, `tests/node/assetModuleRegistry.test.js`, `tests/node/tourbusModules.test.js`, `tests/node/tourbusAntiStacking.test.js`
- Test: `tests/node/expeditionVehicleAdapter.test.js`

- [ ] **Step 1: Add failing assertions for selected existing module ids**

```js
test('roof rack and trailer hitch expand expedition cargo capacity', () => {
  assert.equal(MODULE_REGISTRY.get('tb_roof_rack')?.boni.cargoCapacityBonus, 2)
  assert.equal(MODULE_REGISTRY.get('tb_trailer_hitch')?.boni.cargoCapacityBonus, 4)
})

test('sleeping bunks trade cargo capacity for travel recovery', () => {
  assert.equal(MODULE_REGISTRY.get('tb_sleeping_bunks')?.boni.cargoCapacityBonus, -2)
})

test('gps jammer exposes an expedition inspection/evasion affordance', () => {
  assert.equal(MODULE_REGISTRY.get('tb_gps_jammer')?.boni.hiddenContrabandSlots, 1)
})
```

- [ ] **Step 2: Run and verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionVehicleAdapter.test.js
```

Expected: FAIL because the new boni are undefined.

- [ ] **Step 3: Add these exact additive effects without removing existing boni**

Update the current objects:

```ts
// tb_roof_rack
boni: { merchCapacityBonus: 30, cargoCapacityBonus: 2 }

// tb_sleeping_bunks
boni: { travelStaminaRegen: 5, cargoCapacityBonus: -2 }

// tb_trailer_hitch
boni: { merchCapacityBonus: 50, cargoCapacityBonus: 4 }

// tb_gps_jammer
boni: { diyRiskMultiplier: 0.5, hiddenContrabandSlots: 1, inspectionLevel: 1 }

// tb_smoke_screen
boni: { reducesTheftRiskTravel: true, roadWearMultiplier: 0.9 }

// tb_racing_seats
boni: { staminaRegenBonusPerDay: 3, roadWearMultiplier: 0.95 }
```

Do not change module price/unlock data in this delivery. Balance simulator data will show whether module costs need later recalibration.

- [ ] **Step 4: Run module validation**

```bash
pnpm run test:node -- tests/node/expeditionVehicleAdapter.test.js
pnpm run typecheck:core
```

Expected: PASS; existing module registry validation remains green.

- [ ] **Step 5: Commit**

```bash
git add src/utils/assetSections/tourbusModules.ts tests/node/expeditionVehicleAdapter.test.js
git commit -m "feat(expedition): add tourbus expedition bonuses"
```

---

### Task 4: Implement Cargo Capacity and Loadout Validation

**Files:**
- Create: `src/domain/expedition/cargo.ts`
- Modify: `src/domain/expedition/loadout.ts`
- Modify: `src/ui/expedition/TourPrepLoadout.tsx`
- Test: `tests/node/expeditionCargo.test.js`
- Test: `tests/ui/TourPrep.test.tsx`

- [ ] **Step 1: Write failing cargo tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BASE_EXPEDITION_CARGO_CAPACITY,
  getExpeditionCargoCapacity,
  getExpeditionCargoUsed,
  canFitExpeditionCargo
} from '../../src/domain/expedition/cargo.ts'

const cargo = {
  spareParts: 2,
  supplies: 1,
  merchSlotsUsed: 3,
  contrabandSlotsUsed: 1
}

test('base cargo capacity is twelve slots', () => {
  assert.equal(BASE_EXPEDITION_CARGO_CAPACITY, 12)
  assert.equal(getExpeditionCargoUsed(cargo), 7)
})

test('vehicle bonus changes capacity but never below four', () => {
  assert.equal(getExpeditionCargoCapacity(4), 16)
  assert.equal(getExpeditionCargoCapacity(-20), 4)
})

test('cargo cannot exceed derived capacity', () => {
  assert.equal(canFitExpeditionCargo(cargo, 7), true)
  assert.equal(canFitExpeditionCargo(cargo, 6), false)
})
```

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionCargo.test.js
```

Expected: FAIL because cargo domain is missing.

- [ ] **Step 3: Implement exact cargo arithmetic**

`src/domain/expedition/cargo.ts`:

```ts
import type { ExpeditionCargoState } from '../../types'

export const BASE_EXPEDITION_CARGO_CAPACITY = 12
export const MIN_EXPEDITION_CARGO_CAPACITY = 4

export const getExpeditionCargoUsed = (cargo: ExpeditionCargoState): number =>
  cargo.spareParts +
  cargo.supplies +
  cargo.merchSlotsUsed +
  cargo.contrabandSlotsUsed

export const getExpeditionCargoCapacity = (capacityBonus: number): number =>
  Math.max(
    MIN_EXPEDITION_CARGO_CAPACITY,
    BASE_EXPEDITION_CARGO_CAPACITY + Math.trunc(capacityBonus)
  )

export const canFitExpeditionCargo = (
  cargo: ExpeditionCargoState,
  capacity: number
): boolean => getExpeditionCargoUsed(cargo) <= capacity
```

Update loadout validation to derive vehicle bonus via `getExpeditionVehicleState` and reject start when selected cargo does not fit.

- [ ] **Step 4: Render capacity in Tour Prep**

The UI must display one bounded line such as `Cargo 7 / 12` and disable `Start Tour` when over capacity. Do not add a new permanent HUD bar:

```tsx
const capacity = getExpeditionCargoCapacity(state, loadout)
const used = getExpeditionCargoUsed(loadout.cargo)
return <p aria-live="polite">{t('ui:expedition.cargo.summary', { used, capacity })}</p>
```

Tour Prep folds `used <= capacity` into its existing `validateExpeditionLoadout` result.

- [ ] **Step 5: Run tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionCargo.test.js
pnpm exec vitest run tests/ui/TourPrep.test.tsx
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/expedition/cargo.ts src/domain/expedition/loadout.ts src/ui/expedition/TourPrepLoadout.tsx tests/node/expeditionCargo.test.js tests/ui/TourPrep.test.tsx
git commit -m "feat(expedition): enforce cargo capacity"
```

---

### Task 5: Implement Deterministic Grouped Wear

**Files:**
- Create: `src/domain/expedition/condition.ts`
- Modify: `src/domain/expedition/nodeIntel.ts`
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/context/expeditionActionCreators.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Test: `tests/node/expeditionCondition.test.js`
- Modify: `tests/node/expeditionNodeIntel.test.js`
- Test: `tests/node/expeditionReducer.test.js`

- [ ] **Step 1: Write failing domain tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateGigConditionWear,
  getConditionBand
} from '../../src/domain/expedition/condition.ts'

test('condition bands match the design thresholds', () => {
  assert.equal(getConditionBand(100), 'good')
  assert.equal(getConditionBand(69), 'worn')
  assert.equal(getConditionBand(39), 'critical')
  assert.equal(getConditionBand(19), 'breaking')
})

test('hard high-performance gigs wear more gear than easy gigs', () => {
  assert.deepEqual(
    calculateGigConditionWear({
      venueDifficulty: 4,
      accuracy: 80,
      technicalWearMultiplier: 1,
      protection: { pa: 0, instruments: 0, stageGear: 0 }
    }),
    { pa: 8, instruments: 4, stageGear: 5 }
  )
})

test('setup protection reduces but never reverses wear', () => {
  const wear = calculateGigConditionWear({
    venueDifficulty: 4,
    accuracy: 80,
    technicalWearMultiplier: 1,
    protection: { pa: 50, instruments: 100, stageGear: 0 }
  })
  assert.deepEqual(wear, { pa: 4, instruments: 0, stageGear: 5 })
})
```

Extend `tests/node/expeditionNodeIntel.test.js` to pin the staged G1 contract once Condition exists:

```js
import { getExpeditionNodeIntel } from '../../src/domain/expedition/nodeIntel.ts'

const wearNode = {
  id: 'wear-node',
  layer: 3,
  x: 0,
  y: 0,
  type: 'FESTIVAL',
  venue: { id: 'wear-venue', name: 'Wear Venue', pay: 4000, diff: 4 }
}

const level1 = getExpeditionNodeIntel(wearNode, 1)
assert.equal(level1.wearTier, 'high')
assert.equal(level1.projectedWear, null)

const level2 = getExpeditionNodeIntel(wearNode, 2)
assert.deepEqual(level2.projectedWear, {
  pa: 8,
  instruments: 4,
  stageGear: 5
})
```

The projection is a forecast at reference **70% accuracy**, multiplier `1`, and zero setup protection. It is not the guaranteed post-gig wear because the player's actual performance remains skill-dependent.

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionCondition.test.js
```

Expected: FAIL because condition helpers are missing.

- [ ] **Step 3: Implement exact initial wear formula**

```ts
import type { ConditionGroup, ExpeditionSetupProtection } from '../../types'

export type ConditionBand = 'good' | 'worn' | 'critical' | 'breaking'

export const getConditionBand = (condition: number): ConditionBand => {
  if (condition >= 70) return 'good'
  if (condition >= 40) return 'worn'
  if (condition >= 20) return 'critical'
  return 'breaking'
}

const protectedWear = (raw: number, protectionPct: number): number =>
  Math.max(0, Math.round(raw * (1 - Math.max(0, Math.min(100, protectionPct)) / 100)))

export const calculateGigConditionWear = ({
  venueDifficulty,
  accuracy,
  technicalWearMultiplier,
  protection
}: {
  venueDifficulty: number
  accuracy: number
  technicalWearMultiplier: number
  protection: ExpeditionSetupProtection
}): Record<ConditionGroup, number> => {
  const difficulty = Math.max(1, Math.min(5, Math.trunc(venueDifficulty)))
  const performanceIntensity = accuracy >= 70 ? 2 : accuracy < 50 ? -1 : 0
  const intensity = Math.max(1, difficulty + performanceIntensity)
  const multiplier = Math.max(0, technicalWearMultiplier)
  const raw = {
    pa: Math.round((2 + intensity) * multiplier),
    instruments: Math.round((1 + Math.ceil(intensity / 2)) * multiplier),
    stageGear: Math.round((2 + Math.ceil(intensity / 2)) * multiplier)
  }
  return {
    pa: protectedWear(raw.pa, protection.pa),
    instruments: protectedWear(raw.instruments, protection.instruments),
    stageGear: protectedWear(raw.stageGear, protection.stageGear)
  }
}
```

- [ ] **Step 4: Populate the existing node-intel wear fields from the canonical formula**

Extend `src/domain/expedition/nodeIntel.ts`; do not rename the G1 fields:

```ts
import type { ConditionGroup, NodeIntelBand } from '../../types'
import { calculateGigConditionWear } from './condition'

export const projectNodeTechnicalWear = (
  node: MapNode
): Record<ConditionGroup, number> =>
  calculateGigConditionWear({
    venueDifficulty: getCanonicalNodeDifficulty(node) ?? 1,
    accuracy: 70,
    technicalWearMultiplier: 1,
    protection: { pa: 0, instruments: 0, stageGear: 0 }
  })

const toWearTier = (
  wear: Record<ConditionGroup, number>
): NodeIntelBand => {
  const total = wear.pa + wear.instruments + wear.stageGear
  if (total >= 12) return 'high'
  if (total >= 6) return 'medium'
  return 'low'
}
```

In `getExpeditionNodeIntel`, derive the projection once and expose only its qualitative band at Level 1:

```ts
const projectedWear = level >= 1 ? projectNodeTechnicalWear(node) : null

// inside the existing returned object
wearTier: projectedWear ? toWearTier(projectedWear) : null,
projectedWear: level >= 2 ? projectedWear : null,
```

This preserves the G1 result shape and keeps actual run wear in post-gig settlement, where real accuracy and setup protection are known.

- [ ] **Step 5: Add reducer action**

Add `APPLY_EXPEDITION_WEAR` with payload:

```ts
export interface ApplyExpeditionWearPayload {
  pa: number
  instruments: number
  stageGear: number
}
```

Action creator sanitizes each field to finite non-negative `0..100`. Reducer only applies when `expedition.status === 'active'`, subtracts each wear value with clamp `0..100`, and clears `setupProtection` after applying the gig wear once.

- [ ] **Step 6: Run domain/reducer/intel tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionCondition.test.js tests/node/expeditionNodeIntel.test.js tests/node/expeditionReducer.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain/expedition/condition.ts src/domain/expedition/nodeIntel.ts src/context/actionTypes.ts src/types/actions.d.ts src/context/expeditionActionCreators.ts src/context/reducers/expeditionReducer.ts tests/node/expeditionCondition.test.js tests/node/expeditionNodeIntel.test.js tests/node/expeditionReducer.test.js
git commit -m "feat(expedition): apply grouped technical wear"
```

---

### Task 6: Convert Existing Pre-Gig Minigames Into Technical Protection

**Files:**
- Modify: `src/context/reducers/minigameReducer.ts`
- Modify: `src/domain/expedition/condition.ts`
- Test: `tests/ui/useRoadieLogic.test.jsx`, `tests/ui/useKabelsalatGameEnd.test.jsx`, `tests/logic/ampCalibrationReducer.test.js`
- Test: `tests/node/expeditionCondition.test.js`

- [ ] **Step 1: Write failing protection assertions**

Add integration expectations:

```js
assert.deepEqual(stateAfterPerfectAmp.expedition.setupProtection, {
  pa: 60,
  instruments: 0,
  stageGear: 0
})

assert.deepEqual(stateAfterPerfectKabelsalat.expedition.setupProtection, {
  pa: 0,
  instruments: 50,
  stageGear: 0
})

assert.deepEqual(stateAfterZeroDamageRoadie.expedition.setupProtection, {
  pa: 0,
  instruments: 0,
  stageGear: 60
})
```

Only assert these bonuses when an Expedition is active; legacy runs remain behaviorally unchanged.

- [ ] **Step 2: Verify failure**

```bash
pnpm exec vitest run tests/ui/ampCalibration.test.jsx tests/ui/kabelsalatMinigame.test.jsx tests/ui/roadieMinigame.test.jsx
```

Expected: Expedition protection assertions FAIL.

- [ ] **Step 3: Add pure conversion helpers**

```ts
export const ampScoreToProtection = (score: number): number =>
  score >= 90 ? 60 : score >= 70 ? 40 : score >= 50 ? 20 : 0

export const kabelsalatResultToProtection = (success: boolean, stress: number): number =>
  success && stress === 0 ? 50 : success ? 30 : 0

export const roadieDamageToProtection = (damage: number): number =>
  damage <= 0 ? 60 : damage <= 25 ? 40 : damage <= 50 ? 20 : 0
```

- [ ] **Step 4: Update completion reducers without changing scene ownership**

At the point each reducer already computes its sanitized final result, if `state.expedition.status === 'active'`, merge only the associated protection field using `Math.max`:

```ts
const withProtection = (
  nextState: GameState,
  key: keyof ExpeditionSetupProtection,
  value: number
): GameState => nextState.expedition.status !== 'active'
  ? nextState
  : {
      ...nextState,
      expedition: {
        ...nextState.expedition,
        setupProtection: {
          ...nextState.expedition.setupProtection,
          [key]: Math.max(nextState.expedition.setupProtection[key], value)
        }
      }
    }
```

Do not change `currentScene`; continuation callbacks still own navigation.

- [ ] **Step 5: Run minigame and type gates**

```bash
pnpm run test:ui
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/context/reducers/minigameReducer.ts src/domain/expedition/condition.ts tests
git commit -m "feat(expedition): convert setup minigames to wear protection"
```

---

### Task 7: Apply Gig Wear Exactly Once During Post-Gig Settlement

**Files:**
- Modify: `src/hooks/postGig/handlers/useContinueHandler.ts`
- Modify: `src/domain/expedition/condition.ts`
- Test: `tests/ui/postGigHandlerLogic.test.jsx`

- [ ] **Step 1: Add failing post-gig test**

Create an active Expedition state with PA 100, difficulty-4 venue, accuracy 80, no protection, invoke `handleContinue`, and assert one wear dispatch:

```jsx
const applyExpeditionWear = vi.fn()
const props = createPostGigProps({
  expedition: { status: 'active', setupProtection: { pa: 0, instruments: 0, stageGear: 0 } },
  currentGig: { difficulty: 4 },
  lastGigStats: { accuracy: 80, failed: false },
  applyExpeditionWear
})
const { result } = renderHook(() => useContinueHandler(props))
act(() => result.current.handleContinue())
act(() => result.current.handleContinue())
expect(applyExpeditionWear).toHaveBeenCalledTimes(1)
expect(applyExpeditionWear).toHaveBeenCalledWith({ pa: 8, instruments: 4, stageGear: 5 })
```

- [ ] **Step 2: Verify failure**

```bash
pnpm exec vitest run tests/ui/postGigHandlerLogic.test.jsx
```

Expected: FAIL because wear is not dispatched.

- [ ] **Step 3: Derive wear from canonical gig data**

Inside the existing guarded continuation block, after `lastGigStats` is available and before run routing, derive:

```ts
const wear = calculateGigConditionWear({
  venueDifficulty: finiteNumberOr(currentGig?.diff, 1),
  accuracy: finiteNumberOr(lastGigStats?.accuracy, 0),
  technicalWearMultiplier: getExpeditionVehicleState(gameState).technicalWearMultiplier,
  protection: gameState.expedition.setupProtection
})
applyExpeditionWear(wear)
```

Do not use `lastGigStats.score` as percentage; the repo's `accuracy` field is the `0..100` outcome metric.

- [ ] **Step 4: Run post-gig regression tests**

```bash
pnpm exec vitest run tests/ui/postGigHandlerLogic.test.jsx
pnpm run typecheck:core
```

Expected: PASS; wear dispatch occurs once.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/postGig/handlers/useContinueHandler.ts tests/ui/postGigHandlerLogic.test.jsx
git commit -m "feat(expedition): settle technical wear after gigs"
```

---

### Task 8: Implement Repair Options and Hidden Defects

**Files:**
- Create: `src/data/expedition/repairCatalog.ts`
- Create: `src/domain/expedition/repairs.ts`
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/context/expeditionActionCreators.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Test: `tests/node/expeditionRepairs.test.js`
- Test: `tests/node/expeditionReducer.test.js`

- [ ] **Step 1: Write failing repair tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getProfessionalRepairCost,
  resolveFieldRepair,
  resolveImprovisedRepair,
  resolveCannibalizeRepair
} from '../../src/domain/expedition/repairs.ts'

test('professional repair targets ninety and costs by missing points', () => {
  assert.equal(getProfessionalRepairCost(50), 800)
})

test('field repair consumes one spare and gains thirty-five plus efficiency', () => {
  assert.deepEqual(resolveFieldRepair(35, 0.2), {
    nextCondition: 77,
    sparePartsConsumed: 1
  })
})

test('improvised repair creates a deterministic hidden-defect request', () => {
  assert.deepEqual(resolveImprovisedRepair(30), {
    nextCondition: 50,
    shouldCreateHiddenDefect: true
  })
})

test('cannibalize transfers forty condition with forty-five restored', () => {
  assert.deepEqual(resolveCannibalizeRepair(70, 20), {
    sourceCondition: 30,
    targetCondition: 65
  })
})
```

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionRepairs.test.js
```

Expected: FAIL because repair domain is missing.

- [ ] **Step 3: Implement exact initial repair tuning**

`src/domain/expedition/repairs.ts`:

```ts
export const PROFESSIONAL_REPAIR_TARGET = 90
export const PROFESSIONAL_REPAIR_COST_PER_POINT = 20

export const getProfessionalRepairCost = (condition: number): number =>
  Math.max(0, PROFESSIONAL_REPAIR_TARGET - Math.max(0, Math.min(100, condition))) *
  PROFESSIONAL_REPAIR_COST_PER_POINT

export const resolveFieldRepair = (
  condition: number,
  efficiencyBonus: number
): { nextCondition: number; sparePartsConsumed: number } => ({
  nextCondition: Math.min(100, condition + Math.round(35 * (1 + Math.max(0, efficiencyBonus)))),
  sparePartsConsumed: 1
})

export const resolveImprovisedRepair = (
  condition: number
): { nextCondition: number; shouldCreateHiddenDefect: boolean } => ({
  nextCondition: Math.min(100, condition + 20),
  shouldCreateHiddenDefect: true
})

export const resolveCannibalizeRepair = (
  sourceCondition: number,
  targetCondition: number
): { sourceCondition: number; targetCondition: number } => ({
  sourceCondition: Math.max(0, sourceCondition - 40),
  targetCondition: Math.min(100, targetCondition + 45)
})
```

- [ ] **Step 4: Add typed repair action**

Use one action payload representing a fully resolved deterministic mutation:

```ts
export interface RepairExpeditionConditionPayload {
  target: ConditionGroup
  nextTargetCondition: number
  source: ConditionGroup | null
  nextSourceCondition: number | null
  moneyCost: number
  sparePartsConsumed: number
  hiddenDefect: HiddenDefectState | null
}
```

Action creator accepts a repair intent plus current state, validates availability/cost, and if improvisation creates a hidden defect, generates its deterministic id and severity using an action-creator RNG derived from the current `rngSeed`. Reducer performs no randomness, rechecks current money/spares/source group, applies the resolved mutation, and refuses replay if resources no longer match.

- [ ] **Step 5: Hidden defect ids are stable and bounded**

Use canonical ids:

```ts
const DEFECT_BY_GROUP = {
  pa: 'loose_power_connector',
  instruments: 'unstable_signal_chain',
  stageGear: 'damaged_mount'
} as const
```

Improvised repair creates at most one undiscovered defect with the same `id + group`; repeated improvisation updates severity to `major` instead of duplicating the entry.

- [ ] **Step 6: Run tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionRepairs.test.js tests/node/expeditionReducer.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/data/expedition/repairCatalog.ts src/domain/expedition/repairs.ts src/context/actionTypes.ts src/types/actions.d.ts src/context/expeditionActionCreators.ts src/context/reducers/expeditionReducer.ts tests/node/expeditionRepairs.test.js tests/node/expeditionReducer.test.js
git commit -m "feat(expedition): add repair and hidden defect choices"
```

---

### Task 9: Add Optional Expedition Insurance as a Risk Sink

**Files:**
- Create: `src/data/expedition/insurance.ts`
- Create: `src/domain/expedition/insurance.ts`
- Modify: `src/types/expedition.d.ts`
- Modify: `src/domain/expedition/defaults.ts`
- Modify: `src/domain/expedition/loadout.ts`
- Modify: `src/context/expeditionActionCreators.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Modify: `src/context/reducers/expeditionSanitizers.ts`
- Modify: `src/hooks/travel/handleCompleteTravelMinigame.ts`
- Modify: `src/domain/expedition/condition.ts`
- Modify: `src/ui/expedition/TourPrepLoadout.tsx`
- Modify: `public/locales/en/ui.json`
- Modify: `public/locales/de/ui.json`
- Test: `tests/node/expeditionInsurance.test.js`
- Test: `tests/node/expeditionReducer.test.js`
- Test: `tests/node/useTravelLogic.test.js`
- Test: `tests/ui/TourPrep.test.tsx`

Insurance is optional pre-tour risk management. It must never become mandatory daily upkeep and it must not insure Fuel, Heat, crew stress, contract failure, or ordinary lost profits.

- [ ] **Step 1: Write failing policy and one-claim tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getInsurancePremium,
  resolveInsuranceProtection
} from '../../src/domain/expedition/insurance.ts'

test('fixed v1 premiums are deterministic', () => {
  assert.equal(getInsurancePremium(null), 0)
  assert.equal(getInsurancePremium('roadside'), 350)
  assert.equal(getInsurancePremium('equipment'), 450)
  assert.equal(getInsurancePremium('touring'), 750)
})

test('roadside insurance rescues vehicle once but not equipment', () => {
  assert.deepEqual(resolveInsuranceProtection({
    policyId: 'roadside', claimUsed: false, target: 'vehicle', conditionAfterWear: 0
  }), { condition: 25, claimUsed: true })
  assert.deepEqual(resolveInsuranceProtection({
    policyId: 'roadside', claimUsed: false, target: 'pa', conditionAfterWear: 0
  }), { condition: 0, claimUsed: false })
})

test('a used policy cannot trigger a second claim', () => {
  assert.deepEqual(resolveInsuranceProtection({
    policyId: 'touring', claimUsed: true, target: 'pa', conditionAfterWear: 0
  }), { condition: 0, claimUsed: true })
})
```

- [ ] **Step 2: Define three policies plus no-policy**

```ts
export type ExpeditionInsurancePolicyId =
  | 'roadside'
  | 'equipment'
  | 'touring'

export const EXPEDITION_INSURANCE_POLICIES = Object.freeze({
  roadside: { premium: 350, coveredTargets: ['vehicle'], rescueCondition: 25 },
  equipment: { premium: 450, coveredTargets: ['pa', 'instruments', 'stageGear'], rescueCondition: 25 },
  touring: { premium: 750, coveredTargets: ['vehicle', 'pa', 'instruments', 'stageGear'], rescueCondition: 30 }
} as const)
```

`null` means uninsured and has premium `0`.

- [ ] **Step 3: Extend loadout/run state without duplicating Condition**

Add to `ExpeditionLoadout`:

```ts
insurancePolicyId: ExpeditionInsurancePolicyId | null
```

Add to `ExpeditionState`:

```ts
insuranceClaimUsed: boolean
insurancePremiumPaid: number
```

Defaults are `null`, `false`, and `0`. The sanitizer accepts only the three policy ids. `validateExpeditionLoadout` rejects a policy when `state.player.money < getInsurancePremium(policyId)`.

- [ ] **Step 4: Charge the premium exactly once when the Expedition starts**

Extend the existing `START_EXPEDITION` reducer branch:

```ts
const premium = getInsurancePremium(payload.loadout.insurancePolicyId)
if (finiteNumberOr(state.player.money, 0) < premium) return state

return {
  ...state,
  player: { ...state.player, money: state.player.money - premium },
  expedition: {
    ...createDefaultExpeditionState(),
    status: 'active',
    loadout: payload.loadout,
    insurancePremiumPaid: premium,
    startingMoney: finiteNumberOr(state.player.money, 0) - premium,
    startingFame: finiteNumberOr(state.player.fame, 0)
  }
}
```

The premium is part of pre-tour spend; extraction never refunds it. A replayed `START_EXPEDITION` while already active remains rejected by the lifecycle reducer.

- [ ] **Step 5: Apply claims only at the two canonical Condition seams**

Pure resolver:

```ts
export const resolveInsuranceProtection = (input: InsuranceProtectionInput) => {
  if (input.claimUsed || input.conditionAfterWear > 0 || input.policyId === null) {
    return { condition: input.conditionAfterWear, claimUsed: input.claimUsed }
  }
  const policy = EXPEDITION_INSURANCE_POLICIES[input.policyId]
  if (!policy.coveredTargets.includes(input.target)) {
    return { condition: input.conditionAfterWear, claimUsed: false }
  }
  return { condition: policy.rescueCondition, claimUsed: true }
}
```

For non-vehicle groups, call it in the Expedition wear reducer after canonical wear is computed but before the group is committed. For vehicle condition, call the same resolver immediately after `handleCompleteTravelMinigame` has committed the canonical `player.van.condition` and before arrival/failure routing; if a claim fires, dispatch the existing typed player/van update plus an Expedition action that marks `insuranceClaimUsed:true`. Never pre-emptively claim above condition `0`.

- [ ] **Step 6: Add insurance to Tour Prep as an optional trade-off**

```tsx
<InsurancePicker
  selectedPolicyId={draft.insurancePolicyId}
  money={player.money}
  policies={EXPEDITION_INSURANCE_POLICIES}
  onSelect={insurancePolicyId => updateDraft({ insurancePolicyId })}
/>
```

Show premium, covered groups, and the one-claim rescue condition. Do not display actuarial percentages or imply the policy covers failures outside Condition.

- [ ] **Step 7: Run insurance/travel/save/UI gates**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/expeditionInsurance.test.js \
  tests/node/expeditionReducer.test.js \
  tests/node/useTravelLogic.test.js
pnpm exec vitest run tests/ui/TourPrep.test.tsx
pnpm run typecheck:core
```

Expected: PASS; premiums charge once, a covered zero-condition event is rescued once, and uninsured/used/unsupported targets remain unchanged.

- [ ] **Step 8: Commit**

```bash
git add src/data/expedition/insurance.ts src/domain/expedition/insurance.ts src/types/expedition.d.ts src/domain/expedition/defaults.ts src/domain/expedition/loadout.ts src/context src/hooks/travel src/ui/expedition/TourPrepLoadout.tsx public/locales tests
git commit -m "feat(expedition): add optional run insurance"
```


### Task 10: Extend Event Delta With an Expedition Subdelta

**Files:**
- Modify: `src/types/events.d.ts`
- Modify: `src/utils/gameState/delta.ts`
- Test: `tests/node/eventReducer.test.js`

- [ ] **Step 1: Add failing event-delta test**

```js
test('event delta can change expedition pressure, condition, cargo, and crew stress', () => {
  const next = applyEventDelta(baseActiveExpeditionState, {
    expedition: {
      heat: 10,
      exposure: -5,
      condition: { pa: -8 },
      cargo: { spareParts: 1 },
      crewStress: { crew_mika_tech: 12 }
    }
  })
  assert.equal(next.expedition.pressure.heat, 10)
  assert.equal(next.expedition.pressure.exposure, 0)
  assert.equal(next.expedition.condition.pa, 92)
  assert.equal(next.expedition.cargo.spareParts, 1)
  assert.equal(next.expedition.crewRunById.crew_mika_tech.stress, 12)
})
```

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/eventReducer.test.js
```

Expected: FAIL because `EventDelta` has no Expedition branch.

- [ ] **Step 3: Add strict type**

```ts
export interface ExpeditionEventDelta {
  heat?: number
  exposure?: number
  condition?: Partial<Record<ConditionGroup, number>>
  cargo?: Partial<Pick<ExpeditionCargoState, 'spareParts' | 'supplies'>>
  crewStress?: Record<string, number>
}
```

Add `expedition?: ExpeditionEventDelta` to `EventDelta`.

- [ ] **Step 4: Apply through the same pure delta pipeline**

Extend `calculateAppliedDelta` / `applyEventDelta` using the same strict guards. Keep the writable Expedition subset explicit:

```ts
if (delta.expedition && next.expedition.status === 'active') {
  const effect = sanitizeExpeditionEventDelta(delta.expedition, next.expedition)
  next = {
    ...next,
    expedition: {
      ...next.expedition,
      condition: applyConditionDelta(next.expedition.condition, effect.condition),
      pressure: applyPressureDelta(next.expedition.pressure, {
        heat: effect.heat,
        exposure: effect.exposure
      }),
      cargo: applyCargoDelta(next.expedition.cargo, effect.cargo),
      crewRunById: applyKnownCrewStressDeltas(next.expedition.crewRunById, effect.crewStress)
    }
  }
}
```

`sanitizeExpeditionEventDelta` has no fields for `outcome`, `loadout`, `routeStep`, or `career`, so raw events cannot mutate them.

- [ ] **Step 5: Run event regression**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/eventReducer.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/types/events.d.ts src/utils/gameState/delta.ts tests/node/eventReducer.test.js
git commit -m "feat(expedition): support event-driven run deltas"
```

---

### Task 11: Add Expedition Repair/Supply Actions to Supply Stop UI

**Files:**
- Create: `src/ui/expedition/RepairChoices.tsx`
- Modify: `src/ui/SupplyStopModal.tsx`
- Modify: `src/hooks/overworld/useSupplyStopModal.ts`
- Modify: `src/components/overworld/OverworldModals.tsx`
- Modify: `src/context/useExpeditionDispatchActions.ts`
- Test: `tests/ui/SupplyStopModal.test.jsx`
- Test: `tests/ui/SupplyStopExpedition.test.tsx`

- [ ] **Step 1: Add failing UI tests**

Test an active Expedition Supply Stop and assert tabs/buttons for:

```text
Inventory
Repairs
Supplies
```

Assert:

- `Buy Spare Part` costs `€250` and adds one cargo unit when capacity permits.
- `Buy Supply` costs `€150` and adds one cargo unit.
- professional repair shows exact computed cost and disables when money is insufficient.
- field repair disables with zero spare parts.
- double-clicking a purchase/repair dispatches once via the existing purchase lock pattern.

- [ ] **Step 2: Verify failure**

```bash
pnpm exec vitest run tests/ui/SupplyStopModal.test.jsx tests/ui/SupplyStopExpedition.test.tsx
```

Expected: FAIL because Expedition tabs are absent.

- [ ] **Step 3: Add exact consumable prices**

`src/data/expedition/repairCatalog.ts`:

```ts
export const EXPEDITION_SUPPLY_PRICES = Object.freeze({
  sparePart: 250,
  supply: 150
})
```

- [ ] **Step 4: Reuse existing purchase-lock behavior**

`SupplyStopModal` keeps its existing inventory flow intact. When `expedition.status === 'active'`, render tabs and pass repair/cargo actions through the same `processingItemId` + ref guard used for normal purchases. Do not call a raw mutation twice during the same click cycle.

- [ ] **Step 5: Add cargo purchase actions**

Add `ADD_EXPEDITION_CARGO` payload:

```ts
export interface AddExpeditionCargoPayload {
  kind: 'spareParts' | 'supplies'
  quantity: number
  moneyCost: number
  expectedUsedSlots: number
  capacity: number
}
```

The action creator derives and stamps `capacity`; reducer rechecks money and current used slots, subtracts money using the canonical player clamp, and increments only the requested cargo field. Replay after the first purchase fails because `expectedUsedSlots` no longer matches.

- [ ] **Step 6: Run UI/reducer tests**

```bash
pnpm exec vitest run tests/ui/SupplyStopModal.test.jsx tests/ui/SupplyStopExpedition.test.tsx
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionReducer.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/ui/SupplyStopModal.tsx src/ui/expedition/RepairChoices.tsx src/hooks/overworld/useSupplyStopModal.ts src/components/overworld/OverworldModals.tsx src/context src/data/expedition/repairCatalog.ts tests/ui/SupplyStopModal.test.jsx tests/ui/SupplyStopExpedition.test.tsx
git commit -m "feat(expedition): add supply stop repairs and consumables"
```

---

### Task 12: Surface Condition Without Creating HUD Clutter

**Files:**
- Create: `src/ui/expedition/ConditionPanel.tsx`
- Modify: `src/ui/expedition/ExpeditionStatusStrip.tsx`
- Modify: `public/locales/en/ui.json`
- Modify: `public/locales/de/ui.json`
- Test: `tests/ui/ExpeditionConditionPanel.test.tsx`

- [ ] **Step 1: Write failing UI test**

Assert the persistent status strip shows a single aggregate `Equipment` indicator. Opening it shows PA/Instruments/Stage Gear bands and only discovered defects. Undiscovered defects must not appear in text/ARIA output.

- [ ] **Step 2: Verify failure**

```bash
pnpm exec vitest run tests/ui/ExpeditionConditionPanel.test.tsx
```

Expected: FAIL because panel is missing.

- [ ] **Step 3: Implement aggregate selector**

Use:

```ts
export const getAggregateTechnicalCondition = (
  condition: ExpeditionConditionState
): number =>
  Math.round((condition.pa + condition.instruments + condition.stageGear) / 3)
```

Status strip renders only the aggregate. The panel renders individual groups with translated semantic bands and discovered defects.

- [ ] **Step 4: Add EN/DE keys together**

Add matching namespaced keys in both locales:

```json
{
  "expedition": {
    "condition": { "good": "Good", "worn": "Worn", "critical": "Critical", "breaking": "Breaking", "hiddenDefect": "Hidden defect" },
    "cargo": { "summary": "Cargo {{used}} / {{capacity}}", "spareParts": "Spare parts", "supplies": "Supplies" },
    "repair": { "professional": "Professional repair", "field": "Field repair", "improvise": "Improvise", "cannibalize": "Cannibalize" }
  }
}
```

```json
{
  "expedition": {
    "condition": { "good": "Gut", "worn": "Abgenutzt", "critical": "Kritisch", "breaking": "Kurz vor Ausfall", "hiddenDefect": "Verdeckter Defekt" },
    "cargo": { "summary": "Ladung {{used}} / {{capacity}}", "spareParts": "Ersatzteile", "supplies": "Vorräte" },
    "repair": { "professional": "Professionell reparieren", "field": "Feldreparatur", "improvise": "Improvisieren", "cannibalize": "Ausschlachten" }
  }
}
```

- [ ] **Step 5: Run UI/i18n gates**

```bash
pnpm exec vitest run tests/ui/ExpeditionConditionPanel.test.tsx
pnpm run test:additional
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/ui/expedition/ConditionPanel.tsx src/ui/expedition/ExpeditionStatusStrip.tsx public/locales/en/ui.json public/locales/de/ui.json tests/ui/ExpeditionConditionPanel.test.tsx
git commit -m "feat(expedition): surface technical condition"
```

---

### Task 13: Add G2 Condition/Cargo Coverage to the Balance Simulator

**Files:**
- Modify: `scripts/game-balance-simulation.mjs`
- Modify: `scripts/utils/balance-report-metadata.mjs`
- Test: `tests/node/game-balance-simulation.test.js`, `tests/node/balanceSourceFiles.test.js`

- [ ] **Step 1: Add failing report-contract assertions**

Extend the simulator report test to require these per-scenario fields:

```js
[
  'avgConditionAtFinale',
  'p10ConditionAtFinale',
  'avgProfessionalRepairs',
  'avgFieldRepairs',
  'avgImprovisedRepairs',
  'avgSparePartsConsumed',
  'avgSupplySpend',
  'avgRepairSpend',
  'avgInsuranceSpend',
  'insuranceClaimRunsPct',
  'hiddenDefectRunsPct',
  'disabledAssetRunsPct',
  'avgCargoUsedPct'
]
```

- [ ] **Step 2: Verify report contract fails**

```bash
pnpm run test:node
```

Expected: FAIL only on missing new G2 report fields/source entries.

- [ ] **Step 3: Import production helpers**

The simulator must import and use:

```js
import {
  calculateGigConditionWear,
  getAggregateTechnicalCondition
} from '../src/domain/expedition/condition.ts'
import {
  getProfessionalRepairCost,
  resolveFieldRepair,
  resolveImprovisedRepair
} from '../src/domain/expedition/repairs.ts'
import {
  getExpeditionCargoCapacity,
  getExpeditionCargoUsed
} from '../src/domain/expedition/cargo.ts'
import {
  getInsurancePremium,
  resolveInsuranceProtection
} from '../src/domain/expedition/insurance.ts'
```

Add `src/data/expedition/insurance.ts`, `src/domain/expedition/insurance.ts`, and every other new production file that materially affects simulation output to `BALANCE_SOURCE_FILES`.

- [ ] **Step 4: Add deterministic simulator policy**

For G2 only, use one explicit baseline expedition policy:

```text
- start with 2 spare parts and 1 supply
- if aggregate technical condition < 35 and a Supply Stop is available: professional repair when affordable
- else if any group < 30 and spare parts remain: field repair the lowest group
- else if any group < 20: improvised repair the lowest group
- never cannibalize in baseline policy
```

This is a simulator policy, not player AI truth; label it as such in the Markdown report.

- [ ] **Step 5: Add report section `Condition, Repairs & Cargo`**

Report mean/P10 condition, repair mix, Cash sinks, defects, disabled equipment, and cargo utilization. Add a deterministic row builder:

```js
const buildConditionReportRow = summary => ({
  avgMinCondition: summary.condition.avgMinimum,
  p10MinCondition: summary.condition.p10Minimum,
  professionalRepairPct: summary.repairs.professionalPct,
  fieldRepairPct: summary.repairs.fieldPct,
  repairSpend: summary.spendByCategory.repair,
  supplySpend: summary.spendByCategory.supply,
  hiddenDefectRunsPct: summary.condition.hiddenDefectRunsPct,
  disabledEquipmentRunsPct: summary.condition.disabledRunsPct,
  avgCargoUtilizationPct: summary.cargo.avgUtilizationPct
})
```

These remain descriptive until G6.

- [ ] **Step 6: Run one smoke simulation then full 2,000-run report**

```bash
pnpm run simulate:balance -- --runs 20
pnpm run simulate:balance
```

Expected: smoke completes; full report keeps 2,000 runs per scenario and existing holdout logic.

- [ ] **Step 7: Run G2 gate**

```bash
pnpm run test:node
pnpm run test:ui
pnpm run typecheck:core
pnpm run deadcode:check
pnpm run simulate:balance
```

Expected: all code gates PASS; simulator reports G2 metrics with no missing source fingerprint inputs.

- [ ] **Step 8: Commit**

```bash
git add scripts/game-balance-simulation.mjs reports tests
git commit -m "test(balance): measure expedition condition and cargo"
```

---

## G2 Exit Criteria

- No new vehicle state exists besides the explicit adapter bridge.
- Travel still settles fuel/vehicle condition only once through the existing travel minigame reducer.
- Technical wear is deterministic and applied exactly once after gigs.
- Cargo has a meaningful capacity trade-off.
- Supply Stops can buy safety through parts/supplies/repairs.
- Improvisation can create hidden defects; undiscovered defects never leak into UI.
- Existing minigames reduce future technical wear instead of becoming detached side activities.
- Simulator records repair/cargo/condition economic pressure before balance tuning starts.
