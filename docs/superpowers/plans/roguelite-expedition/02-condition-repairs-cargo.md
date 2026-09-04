# Condition, Repairs, Chassis, Cargo, Inspections and Insurance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make vehicle choice, Cargo, technical wear, repair skill, hidden defects, inspections and insurance create visible trade-offs without introducing duplicate vehicle or inventory ownership.

**Architecture:** `player.van.fuel` and `player.van.condition` remain authoritative for live travel; selected `tourbus_chassis` assets/modules define Expedition build rules through pure adapters. `expedition.condition` owns only PA/Instruments/Stage Gear plus defect/setup state, while the active Cargo manifest constrains what the run can use even though canonical ownership remains in `band.inventory`/`band.stash`.

**Tech Stack:** TypeScript 6, React 19, current asset registry/selectors, existing Roadie/Kabelsalat/Amp minigames, event resolver, reducers/actions, i18next, Node/Vitest/Playwright.

---

## Depends On

- G1A prepared run/loadout/active lifecycle.
- `getExpeditionSpendableCash` and `canSpendExpeditionCash` from G1.
- No G3/G4 dependency is required for the core G2 tasks; later Crew/Pressure plans consume the adapters added here.

## File Structure

**Create:**

- `src/domain/expedition/vehicle.ts`
- `src/domain/expedition/chassis.ts`
- `src/domain/expedition/cargo.ts`
- `src/domain/expedition/condition.ts`
- `src/domain/expedition/repairs.ts`
- `src/domain/expedition/defects.ts`
- `src/domain/expedition/inspection.ts`
- `src/domain/expedition/insurance.ts`
- `src/ui/expedition/ConditionPanel.tsx`
- `src/ui/expedition/InspectionPanel.tsx`
- `tests/node/expeditionChassis.test.js`
- `tests/node/expeditionCargo.test.js`
- `tests/node/expeditionCondition.test.js`
- `tests/node/expeditionRepairs.test.js`
- `tests/node/expeditionDefects.test.js`
- `tests/node/expeditionInsurance.test.js`

**Modify:**

- `src/types/assets.d.ts`
- `src/types/expedition.d.ts`
- `src/utils/assetSelectors/assetFinancials.ts`
- `src/utils/assetSections/tourbusModules.ts`
- `src/context/actionTypes.ts`
- `src/types/actions.d.ts`
- `src/context/expeditionActionCreators.ts`
- `src/context/reducers/expeditionReducer.ts`
- `src/context/reducers/expeditionSanitizers.ts`
- `src/context/reducers/minigameReducer.ts`
- `src/context/reducers/bandReducer.ts`
- `src/hooks/travel/useTravelMinigame.ts`
- `src/hooks/postGig/handlers/useContinueHandler.ts`
- `src/hooks/useContrabandStash.ts`
- `src/hooks/minigames/useRoadieLogic.ts`
- `src/hooks/useMinigameSceneLogic.ts`
- `src/utils/eventEngine/eventEffectHandlers.ts`
- `src/utils/gameState/delta.ts`
- `src/utils/economy/gigLogic/calculators/calculateMerchIncome.ts`
- its owning Gig economy call site
- `src/ui/SupplyStopModal.tsx`
- `src/hooks/overworld/useSupplyStopModal.ts`
- `src/hooks/preGig/usePreGigHandlers.ts`
- `src/scenes/PreGig.tsx`
- existing rhythm hit/miss hooks (`useHandleHit` / `useHandleMiss` owners)
- `public/locales/en/ui.json`
- `public/locales/de/ui.json`

---

## Task 1: Derive four actual chassis playstyles from existing tourbus ownership

- [ ] **Step 1: Write failing profile tests**

Use real owned `tourbus_chassis` fixtures and assert that chassis choice changes more than capacity:

```js
assert.equal(getExpeditionChassisProfile(legitTier1).id, 'compact')
assert.equal(getExpeditionChassisProfile(diyTier1).id, 'diy')
assert.equal(getExpeditionChassisProfile(legitTier3).id, 'coach')
assert.equal(getExpeditionChassisProfile(diyTier3).id, 'armored_hauler')
```

- [ ] **Step 2: Add the final adapter**

```ts
export interface ExpeditionChassisProfile {
  id: 'compact' | 'diy' | 'coach' | 'armored_hauler'
  fuelConsumptionMultiplier: number
  roadWearMultiplier: number
  cargoCapacityBonus: number
  fieldRepairEfficiency: number
  crewStressMultiplier: number
  authorityEventWeightMultiplier: number
  hiddenContrabandSlots: number
}
```

Derive from existing `tourbus_chassis` flavor/tier without adding a second asset collection:

```text
legit tier 1      -> compact
DIY tier 1        -> diy
legit tier 2/3    -> coach
DIY tier 2/3      -> armored_hauler
```

Initial rule identities:

```text
compact:        fuel x0.85, road wear x1.05, cargo +0, repair +0, stress x1.00, authority x1.00
DIY:            fuel x1.00, road wear x1.00, cargo +0, repair +0.25, stress x1.00, authority x1.00
coach:          fuel x1.20, road wear x0.90, cargo +4, repair +0, stress x0.85, authority x1.00
armored_hauler: fuel x1.25, road wear x1.10, cargo +3, repair +0.10, stress x1.05, authority x0.80, hidden Contraband +2
```

These are initial tuning values, but the *rule axes* are required. Chassis selection is therefore a playstyle decision even with zero modules installed.

- [ ] **Step 3: Apply the profile at real consumers**

```text
fuelConsumptionMultiplier     -> travel Fuel settlement
roadWearMultiplier            -> vehicle travel wear
cargoCapacityBonus            -> Cargo capacity
fieldRepairEfficiency         -> field repair restore
crewStressMultiplier          -> G3 travel/rest stress composition
Authority weight              -> G4 Pressure Director
hiddenContrabandSlots         -> G4 authority/Contraband options
```

- [ ] **Step 4: Run tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionChassis.test.js tests/node/assetSelectors.test.js
pnpm run typecheck:core
```

Expected: PASS.

---

## Task 2: Give existing modules rule-changing Expedition affordances

Extend `AssetBoni` only where the module has a real consumer:

```ts
cargoCapacityBonus?: number
roadWearMultiplier?: number
technicalWearMultiplier?: number
fieldRepairEfficiency?: number
inspectionLevel?: number
hiddenContrabandSlots?: number
authorityIntelBonus?: 1
freeFieldRepairCharges?: number
poorRoadProtection?: boolean
mobileStudioAtRest?: boolean
```

Initial mappings:

```text
tb_roof_rack       -> cargo +2
tb_trailer_hitch   -> cargo +4
tb_sleeping_bunks  -> cargo -2; G3 Rest recovery bonus
tb_gps_jammer      -> hiddenContraband +1; inspectionLevel +1; authorityIntelBonus 1
tb_smoke_screen    -> poorRoadProtection true
tb_racing_seats    -> roadWear x0.95
```

`authorityIntelBonus` is consumed only by G1 node-Intel projection: it reveals the qualitative Authority-risk band one Intel step earlier, never exact event identity or payout. This is the approved vehicle-module information source without making Scout Recon redundant.

Do not add a module field unless its G1/G2/G3/G4 production consumer and test are in the same implementation sequence.

---

## Task 3: Materialize a real Cargo manifest and use it at every active-run consumer

- [ ] **Step 1: Define one active-run manifest**

```ts
export interface ExpeditionCargoManifest {
  spareParts: number
  supplies: number
  merch: ExpeditionMerchSelection[]
  contraband: ExpeditionContrabandSelection[]
  technicalGearSlots: number
}

export interface ExpeditionCargoView {
  merch: ExpeditionMerchSelection[]
  contraband: ExpeditionContrabandSelection[]
}
```

Capacity is derived from:

```text
base capacity
+ chassis profile
+ installed module effects
- selected spare parts/supplies
- selected merch
- selected Contraband
- committed technical equipment slots
```

`materializeExpeditionCargo(state, loadout)` returns `null` if selected content is not owned or capacity is exceeded.

- [ ] **Step 2: Add the read boundary**

```ts
getExpeditionCargoView(state)
getExpeditionMerchQuantity(state, inventoryKey)
isContrabandInExpeditionManifest(state, stashKey, instanceId?)
```

Inactive run -> current canonical inventory/stash behavior. Active run -> committed manifest, clamped down to content still canonically owned.

- [ ] **Step 3: Wire every consumer**

```text
calculateMerchIncome + owning Gig economy call -> manifest-limited quantities
useContrabandStash                             -> manifest-only list
bandReducer USE_CONTRABAND                    -> reject omitted entries
useRoadieLogic                                 -> manifest-only candidates
useMinigameSceneLogic                          -> manifest-only candidates
event risk/confiscation                        -> manifest-only candidates; synchronize after canonical stash removal
```

Global non-Expedition crafting/events keep canonical inventory access.

- [ ] **Step 4: Add end-to-end tests**

```text
omitted merch remains owned but earns €0 Expedition merch revenue
selected merch cannot sell above committed quantity
omitted Contraband cannot be shown/used/selected/confiscated
selected Contraband disappears from manifest view after canonical consumption
active equipment changes are blocked by G1 so technicalGearSlots cannot drift
```

---

## Task 4: Apply explainable travel and gig wear exactly once

- [ ] **Step 1: Keep real owners separate**

```text
Vehicle condition -> state.player.van.condition
PA/Instruments/Stage Gear -> state.expedition.condition
```

Do not add a synthetic `vehicle` field to `ExpeditionConditionState`.

- [ ] **Step 2: Add grouped technical condition**

```ts
export type ConditionGroup = 'pa' | 'instruments' | 'stageGear'
export type ConditionBand = 'good' | 'worn' | 'critical' | 'breaking'

export interface ExpeditionConditionState {
  pa: number
  instruments: number
  stageGear: number
  hiddenDefects: HiddenDefectState[]
  setupProtection: Record<ConditionGroup, number>
  repairContext: ExpeditionRepairMinigameContext | null
}
```

Bands:

```text
70–100 good
40–69 worn
20–39 critical
0–19 breaking
```

- [ ] **Step 3: Travel wear uses behavior**

Travel settlement derives Fuel and vehicle wear from existing distance/road/travel result plus:

```text
chassis Fuel multiplier
chassis/module road-wear multiplier
cargo load ratio
G3 Driver effect
poor-road module rule
```

Use the real travel-minigame settlement owner once; no parallel travel wear action.

- [ ] **Step 4: Gig wear uses active performance**

```ts
calculateGigConditionWear({
  venueDifficulty,
  accuracy,
  technicalWearMultiplier,
  protection
})
```

Higher difficulty/intensity raises raw wear; better setup protection lowers it. Actual accuracy is used at settlement, while Intel projections use a fixed reference accuracy only as a forecast.

---

## Task 5: Make technical Condition visibly affect active gigs

Add a pure selector:

```ts
export interface ExpeditionGigTechnicalModifiers {
  timingWindowMultiplier: number
  missPenaltyMultiplier: number
  comboRecoveryMultiplier: number
  audioHazardChance: number
  disabledGroups: ConditionGroup[]
}

export const getExpeditionGigTechnicalModifiers = (
  state: GameState
): ExpeditionGigTechnicalModifiers
```

Initial behavior:

```text
PA worn/critical     -> increasing audio/timing hazard, surfaced before play
Instruments worn     -> slightly narrower hit window and larger miss stamina cost
Stage Gear worn      -> slower combo/crowd recovery
Condition 0 group    -> disabledGroups contains that group; Gig Start blocked until recovery/failure choice
```

Inject through the existing `useHandleHit` / `useHandleMiss` / Gig modifier seams. PreGig shows every material modifier in plain language before Start. Never hide a difficulty modifier that can make player skill feel invalid.

Tests run the same chart/inputs with healthy vs critical Condition and assert the production modifier changes only the documented dimensions.

---

## Task 6: Turn field repair into active skill using existing minigames

- [ ] **Step 1: Add repair context**

```ts
export interface ExpeditionRepairMinigameContext {
  group: ConditionGroup
  source: 'supply_stop' | 'failure_crisis'
  mode: 'field'
  baseRestore: number
  expectedRouteStep: number
}
```

- [ ] **Step 2: Route group to existing minigame**

```text
PA          -> Amp Calibration
Stage Gear  -> Kabelsalat
Instruments -> Roadie
```

Entering the minigame stores `repairContext`; normal pre-gig minigame use leaves it `null`.

- [ ] **Step 3: Resolve quality into repair strength**

Normalize the existing minigame result to `quality` in `0..1` and use:

```ts
const restore = Math.round(
  Math.min(60, 20 + quality * 35 + chassis.fieldRepairEfficiency * 20)
)
```

Consume one spare part. `quality < 0.45` creates one hidden defect chance; `quality >= 0.8` clears the field-repair defect chance. G4/G5 run traits may alter these rules only through the unified effective-rules helper.

Professional repair remains a direct expensive reliable action and does not require a minigame.

- [ ] **Step 4: Prove skill matters**

Same damaged state + low vs high minigame quality must produce different restored Condition and subsequent wear/resource burden. G6 reuses this production path in its skill probe.

---

## Task 7: Add improvisation, cannibalization and hidden defects

Repair classes:

```text
professional: expensive; reliable; no defect
field: spare part + minigame quality
improvise: no/low Cash; lower restore; guaranteed hidden-defect risk token
cannibalize: sacrifice one healthy technical group/component budget to restore another
continue broken: allowed only above 0; active gameplay penalty remains visible
```

Hidden defect state:

```ts
export interface HiddenDefectState {
  id: string
  group: ConditionGroup
  severity: 1 | 2 | 3
  revealed: boolean
  source: 'field_repair' | 'improvise' | 'critical_wear'
  triggered: boolean
}
```

Creation is deterministic from committed run seed + route step + source. Undiscovered defects never leak into UI selectors. Trigger/resolve is once-only.

---

## Task 8: Add explicit inspections

Inspection choices are available before large Gig/Festival nodes and at Supply Stops:

```text
quick_check:
  cost 0
  reveals condition bands only; no hidden-defect certainty

crew_inspection:
  requires selected G3 Technician/Roadie or module inspectionLevel >=1
  reveals one deterministic hidden defect if present

full_service:
  uses spendable Expedition Cash
  reveals all hidden defects
  restores +10 to the lowest technical group, capped at 100
```

The player sees inspection value before paying. Full Service uses `canSpendExpeditionCash` and canonical money mutation once.

---

## Task 9: Add optional insurance as a real risk-management sink

Define policies in `src/data/expedition/insurance.ts`:

```text
roadside  -> one vehicle rescue; excludes Contraband-caused authority outcomes
equipment -> one technical zero-Condition rescue to 25; no vehicle coverage
touring   -> one rescue of either class; highest premium; still excludes deliberate sabotage
```

Premium is paid at START from spendable Expedition Cash. Claim use is one-shot run state and reducer-derived from canonical failure source. Insurance never deletes an explicit high-risk consequence that its policy excludes.

---

## Task 10: Guarantee zero-Condition recovery without PreGig softlock

Expose `getTechnicalFailureSignal(state)` for G1B.

A mandatory current PreGig with any disabled technical group produces `technical_shutdown` after Insurance/G5 Salvage Rights have had their canonical chance.

The same PreGig screen must show:

```text
field_repair   -> when spare part + repair minigame path is legal
cannibalize    -> when a valid source group/component exists
professional   -> only if current location explicitly provides it and Cash is spendable
accept_failure -> always available
```

Successful repair clears disabled status and enables Start. `accept_failure` finalizes the G1 failure path. No state may render Start disabled with zero enabled actions.

---

## Task 11: Build Supply Stop / Condition UI

`ConditionPanel` shows grouped semantic bands, exact values on detail expansion, revealed defects only and active modifiers.

`SupplyStopModal` offers only legal actions from pure selectors:

```text
buy spare parts
buy supplies
professional repair
field repair
improvise
cannibalize
inspection/full service
```

Every price is derived by the owning domain helper and checked with `canSpendExpeditionCash` in reducer/action validation. UI never submits money deltas or restored Condition values.

---

## Task 12: G2 simulator/test handoff

G2 adds production metrics but does not independently implement simulation formulas. Export production helpers used later by G6:

```text
getExpeditionChassisProfile
getExpeditionCargoView
calculateGigConditionWear
getExpeditionGigTechnicalModifiers
calculateFieldRepairResult
getTechnicalFailureSignal
```

Required telemetry ownership points:

```text
vehicle minimum -> player.van.condition
technical minima -> expedition.condition groups
repair spend -> after canonical money mutation
field repair quality/use -> after repair reducer succeeds
defect created/revealed/triggered -> after reducer transition
insurance premium/claim -> after canonical transition
manifest utilization -> active materialized manifest
```

Run:

```bash
pnpm run test:node
pnpm run test:ui
pnpm run typecheck:core
pnpm run deadcode:check
```

Expected: PASS.

---

## G2 Exit Criteria

- Chassis choice itself creates a playstyle before modules are considered.
- Active Expedition merch/Contraband consumers cannot see omitted manifest content.
- Fuel/vehicle and technical Condition keep their real existing owners.
- Travel/gig wear comes from behavior and settles exactly once.
- Technical Condition changes active gameplay and is telegraphed.
- Field-repair quality materially changes restored Condition.
- Hidden defects have create→reveal→trigger/resolve lifecycle without information leaks.
- Inspections and insurance create optional Cash-vs-risk decisions.
- Vehicle modules include at least one real map-information affordance in addition to protection/capacity rules.
- Condition 0 always leads to recovery or explicit run termination, never a softlock.
