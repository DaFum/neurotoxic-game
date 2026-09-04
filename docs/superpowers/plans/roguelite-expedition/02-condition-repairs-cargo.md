# Condition, Repairs, Chassis and Cargo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn vehicle choice, Cargo, technical Condition, skill-based repairs, hidden defects, inspections and insurance into concrete Expedition decisions that feed active performance and the G1 failure shell.

**Architecture:** Vehicle durability remains owned by `state.player.van.condition`; technical Condition is Expedition-owned. Cargo is an actual committed manifest and active Expedition consumers see only that manifest. `getEffectiveExpeditionRules(state)` is introduced here with a G2 baseline and extended in place by G3–G5 so repair/travel formulas never bypass the eventual unified composition path.

**Tech Stack:** TypeScript 6, React 19, current tourbus/chassis/module owners, existing Roadie/Kabelsalat/Amp Calibration minigames, reducers/actions, Node/Vitest/Playwright.

---

## Authority and dependencies

```text
approved design spec > master plan > this child plan
```

`00-*` files are NON-NORMATIVE. G2 depends only on G1A. G3/G4/G5 extend the public effective-rules helper and consumers created here; they do not create parallel repair/travel profiles.

---

## File structure

**Create:**

- `src/domain/expedition/effectiveRules.ts`
- `src/domain/expedition/chassis.ts`
- `src/domain/expedition/cargo.ts`
- `src/domain/expedition/condition.ts`
- `src/domain/expedition/repairs.ts`
- `src/domain/expedition/defects.ts`
- `src/domain/expedition/insurance.ts`
- `src/data/expedition/insurance.ts`
- `src/ui/expedition/ConditionPanel.tsx`
- `src/ui/expedition/SupplyStopModal.tsx`
- `src/ui/expedition/RepairMinigameResult.tsx`
- `tests/node/expeditionChassis.test.js`
- `tests/node/expeditionCargo.test.js`
- `tests/node/expeditionCondition.test.js`
- `tests/node/expeditionRepair.test.js`
- `tests/node/expeditionDefects.test.js`
- `tests/node/expeditionInsurance.test.js`
- `tests/ui/ExpeditionConditionPanel.test.tsx`
- `tests/ui/ExpeditionSupplyStop.test.tsx`

**Modify:**

- `src/types/expedition.d.ts`
- `src/types/actions.d.ts`
- `src/context/actionTypes.ts`
- `src/context/GameState.tsx`
- `src/context/expeditionActionCreators.ts`
- `src/context/useExpeditionDispatchActions.ts`
- `src/context/reducers/expeditionReducer.ts`
- `src/context/reducers/expeditionSanitizers.ts`
- `src/context/reducers/minigameReducer.ts`
- `src/context/reducers/gigReducer.ts`
- `src/context/reducers/assetReducer.ts`
- `src/hooks/travel/useTravelMinigame.ts`
- `src/hooks/travel/useVanMaintenance.ts`
- `src/hooks/postGig/handlers/useContinueHandler.ts`
- `src/hooks/useArrivalLogic.ts`
- `src/utils/eventEngine/eventEffectHandlers.ts`
- active gig/rhythm hit/miss modifier owners
- `tests/ui/useRoadieLogic.test.jsx`
- `tests/ui/useKabelsalatGameEnd.test.jsx`
- `tests/logic/ampCalibrationReducer.test.js`
- `tests/node/useTravelLogic.test.js`
- `public/locales/en/ui.json`
- `public/locales/de/ui.json`

---

## Task 1: Derive four real Expedition chassis playstyles from existing assets

Do not create a second purchasable chassis registry. Map existing chassis flavor/tier/config into:

```ts
export type ExpeditionChassisArchetype =
  | 'compact'
  | 'diy'
  | 'coach'
  | 'armored_hauler'

export interface ExpeditionChassisProfile {
  archetype: ExpeditionChassisArchetype
  fuelConsumptionMultiplier: number
  roadWearMultiplier: number
  cargoCapacityBonus: number
  fieldRepairEfficiency: number
  crewStressMultiplier: number
  authorityEventWeightMultiplier: number
  hiddenContrabandCapacity: number
}
```

Initial bounded semantics:

```text
compact
  fuel x0.85 | road wear x1.10 | cargo +0 | field repair +0.00 | Stress x1.05 | Authority x0.95 | hidden Contraband 0

diy
  fuel x1.00 | road wear x1.15 | cargo +1 | field repair +0.20 | Stress x1.00 | Authority x1.00 | hidden Contraband 1

coach
  fuel x1.20 | road wear x0.85 | cargo +3 | field repair +0.05 | Stress x0.85 | Authority x1.05 | hidden Contraband 0

armored_hauler
  fuel x1.35 | road wear x0.75 | cargo +4 | field repair +0.10 | Stress x0.95 | Authority x1.20 | hidden Contraband 2
```

Each value must be consumed by one production owner. Tests compare identical route/build with two archetypes and prove travel cost, capacity and at least one risk/recovery choice differ before modules are considered.

---

## Task 2: Extend existing modules only when they have real Expedition consumers

Use current module ids/ownership. Add Expedition affordances through one resolver:

```ts
export interface ExpeditionVehicleModuleProfile {
  cargoCapacityBonus: number
  fuelConsumptionMultiplier: number
  roadWearMultiplier: number
  inspectionLevel: 0 | 1 | 2
  authorityIntelBonus: 0 | 1
  hiddenContrabandCapacity: number
  restStressRecoveryBonus: number
}
```

Required v1 examples:

```text
tb_gps_jammer -> authorityIntelBonus +1 and bounded Authority weighting reduction if existing module semantics permit
a cargo/storage module -> cargo capacity
bunks/rest module -> restStressRecoveryBonus
protection/repair module -> road wear or inspectionLevel
```

If a current module cannot be connected to a real app consumer, do not invent a simulator-only field for it.

---

## Task 3: Introduce the single effective-rules module now, then extend it in place

G2 creates `src/domain/expedition/effectiveRules.ts`. It is the only public compositional entrypoint from this gate onward.

```ts
export interface ExpeditionNumericRules {
  startingSpareParts: number
  startingHeat: number
  fuelConsumptionMultiplier: number
  roadWearMultiplier: number
  technicalWearMultiplier: number
  repairCostMultiplier: number
  fieldRepairEfficiency: number
  gigRewardMultiplier: number
  contractRewardMultiplier: number
  contractPenaltyMultiplier: number
  pressureRewardMultiplier: number
  heatGainMultiplier: number
  exposureGainMultiplier: number
  crewStressMultiplier: number
  extractionRetentionMultiplier: number
  rareRewardMultiplier: number
  completionMultiplier: number
  rivalEventWeightMultiplier: number
  authorityEventWeightMultiplier: number
  rivalRewardMultiplier: number
  finaleRewardMultiplier: number
  nodeIntelFloor: 0 | 1 | 2
  explicitExtractionRareCarrySlots: number
}

export interface ExpeditionRuleFlags {
  fieldRepairNoHiddenDefect: boolean
  fieldRepairMinimumCondition: number
  severeReliefBypass: boolean
}

export interface EffectiveExpeditionRules {
  numeric: ExpeditionNumericRules
  flags: ExpeditionRuleFlags
  legendary: Record<string, boolean>
}

export const getEffectiveExpeditionRules = (state: GameState): EffectiveExpeditionRules
```

At G2, composition is:

```text
base -> selected G2 chassis -> installed G2 module profile
```

G3, G4 and G5 modify this **same function/module** to append Crew, starter perk, run draft, region/tour, Tour Pressure, Nemesis and Legendary layers. No G2 formula may read chassis/module fields directly after this task except while constructing the effective rule result.

Tests pin base/chassis/module contributions before later layers exist.

---

## Task 4: Materialize Cargo from real owned content and make the manifest the only active-run view

```ts
export interface ExpeditionCargoState {
  spareParts: number
  supplies: number
  merch: ExpeditionMerchSelection[]
  contraband: ExpeditionContrabandSelection[]
  merchSlotsUsed: number
  contrabandSlotsUsed: number
  technicalGearSlotsUsed: number
  totalSlotsUsed: number
  capacity: number
}
```

`materializeExpeditionCargo(state, loadout)` derives slot use from actual selected owned merchandise, stash instances/stacks and committed technical gear; callers never submit slot counters.

Capacity:

```ts
capacity = BASE_CARGO_CAPACITY
  + getExpeditionChassisProfile(state).cargoCapacityBonus
  + getExpeditionVehicleModuleProfile(state).cargoCapacityBonus
```

G1 START invokes this once after validation.

During `status === 'active'`, all of these consumers use `getExpeditionCargoView(state)` and cannot see omitted content:

```text
Merch gig income/settlement
Contraband stash/use UI and reducer
USE_CONTRABAND
Roadie/minigame candidate selection
Expedition event/confiscation selection
Crafting/use path if exposed during Expedition
```

Tests prove omitted merch earns €0 Expedition merch revenue and omitted Contraband cannot be selected, used or confiscated.

---

## Task 5: Add technical Condition and connect it to active gameplay

```ts
export type ConditionGroup = 'pa' | 'instruments' | 'stageGear'

export interface ExpeditionConditionState {
  pa: number
  instruments: number
  stageGear: number
  defects: HiddenDefectState[]
}
```

Clamp groups `0..100`. Vehicle remains `state.player.van.condition`.

Canonical gameplay profile:

```ts
export interface ExpeditionGigTechnicalModifiers {
  timingWindowMultiplier: number
  missStaminaCostMultiplier: number
  comboRecoveryMultiplier: number
  audioHazardLevel: 0 | 1 | 2 | 3
  disabledGroups: ConditionGroup[]
}
```

Initial semantics:

```text
PA >=70                     no penalty
PA 40..69                   audioHazardLevel 1
PA 1..39                    audioHazardLevel 2; timing window x0.96
PA 0                        disabledGroups includes pa

Instruments 40..69          timing window x0.98
Instruments 1..39           timing window x0.93; miss stamina x1.15
Instruments 0               disabledGroups includes instruments

Stage Gear 40..69           combo recovery x0.95
Stage Gear 1..39            combo recovery x0.85; audioHazardLevel at least 1
Stage Gear 0                disabledGroups includes stageGear
```

PreGig displays every material modifier before Start. Active rhythm/gig owners consume these exact fields; no duplicate score engine.

Post-Gig wear uses canonical Gig evidence and `getEffectiveExpeditionRules(state).numeric.technicalWearMultiplier` exactly once.

---

## Task 6: Route field repair through the unified effective-rules path

This closes the direct-chassis bypass from the 2026-09-04 review.

```ts
export interface ExpeditionRepairMinigameContext {
  group: ConditionGroup
  source: 'supply_stop' | 'failure_crisis' | 'blocked_pregig'
  mode: 'field'
  baseRestore: number
  expectedRouteStep: number
}
```

Minigame mapping:

```text
PA          -> Amp Calibration
Stage Gear  -> Kabelsalat
Instruments -> Roadie
```

Canonical resolver:

```ts
export const calculateFieldRepairResult = (
  state: GameState,
  group: ConditionGroup,
  quality: number
): { restore: number; createDefect: boolean } => {
  const rules = getEffectiveExpeditionRules(state)
  const boundedQuality = Math.max(0, Math.min(1, quality))
  const rawRestore = 20 + boundedQuality * 35 + rules.numeric.fieldRepairEfficiency * 20
  const minimum = rules.flags.fieldRepairMinimumCondition

  return {
    restore: Math.max(minimum, Math.min(60, Math.round(rawRestore))),
    createDefect: !rules.flags.fieldRepairNoHiddenDefect && boundedQuality < 0.45
  }
}
```

G3 Technician contributes `+0.20` to the **same** `fieldRepairEfficiency` numeric rule. G4 `field_engineer` draft/related rule sets `fieldRepairNoHiddenDefect` and/or minimum restore through the same effective rules. No repair code reads `chassis.fieldRepairEfficiency` directly.

Reducer action carries only source/group/quality evidence and expected route step; reducer/shared resolver recomputes restore, cost, spare-part consumption and defect creation.

Required parity tests:

```text
same quality + compact chassis vs DIY -> restore differs through effective rules
same chassis + Technician -> same production formula gains Technician contribution
field_engineer rule -> same formula suppresses defect/minimum rule
G6 imports calculateFieldRepairResult, never duplicates formula
```

Use the real existing tests:

```bash
pnpm exec vitest run tests/ui/useRoadieLogic.test.jsx tests/ui/useKabelsalatGameEnd.test.jsx tests/logic/ampCalibrationReducer.test.js
```

---

## Task 7: Implement complete hidden-defect create→reveal→trigger→resolve lifecycle

Replace ambiguous booleans with one state machine:

```ts
export type HiddenDefectStatus = 'hidden' | 'revealed' | 'triggered' | 'resolved'
export type HiddenDefectTrigger = 'post_travel' | 'pre_gig' | 'post_gig'

export interface HiddenDefectState {
  id: string
  group: ConditionGroup
  severity: 1 | 2 | 3
  status: HiddenDefectStatus
  source: 'field_repair' | 'improvise' | 'critical_wear'
  createdAtRouteStep: number
  triggerAt: HiddenDefectTrigger
  triggerRouteStep: number
}
```

### Creation

`createHiddenDefect(runSeed, group, source, routeStep)` deterministically derives id/severity/trigger point. Duplicate source+group+routeStep cannot create a second entry.

### Reveal

```ts
REVEAL_EXPEDITION_DEFECT {
  defectId: string
  source: 'crew_inspection' | 'module_inspection' | 'full_service'
  expectedRouteStep: number
}
```

Reducer proves the source entitlement, defect is still `hidden`, current step matches and reveal rules allow it, then sets `revealed`. The UI/ARIA tree never exposes hidden id, severity, group-specific warning text or trigger timing before this transition.

### Trigger

```ts
TRIGGER_EXPEDITION_DEFECT {
  defectId: string
  trigger: HiddenDefectTrigger
  expectedRouteStep: number
}
```

Lifecycle owner dispatches only after its canonical committed transition. Reducer proves the defect's stored trigger type/route step match and status is `hidden` or `revealed`, then applies one exact consequence and sets `triggered`:

```text
severity 1 -> owned Condition group -8
severity 2 -> owned Condition group -15
severity 3 -> owned Condition group -25 and exposes immediate repair/failure warning if resulting group reaches 0
```

The consequence uses canonical Condition mutation and cannot retrigger on replay.

### Resolve

Successful professional/field/cannibalize repair of the affected group may dispatch:

```ts
RESOLVE_EXPEDITION_DEFECT {
  defectId: string
  repairResolutionId: string
  expectedRouteStep: number
}
```

Reducer proves the referenced canonical repair just succeeded and group matches, then sets `resolved`. Full service may reveal and resolve according to its defined paid result. Resolved defects never trigger again.

Required tests:

```text
hidden defect absent from visual/ARIA selectors
valid inspection hidden -> revealed
wrong/fake inspection source -> identical state
valid lifecycle trigger applies exact severity consequence once
trigger replay -> identical state
repair result resolves matching defect only
save/reload preserves status and future trigger
G6 telemetry created/revealed/triggered/resolved increments only after reducer transition
```

---

## Task 8: Make inspections meaningful and source-owned

Inspection choices:

```text
quick_check
  cost 0
  shows condition bands only
  cannot reveal a hidden defect

crew_inspection
  requires selected G3 Technician/Roadie
  reveals one deterministic eligible hidden defect

module_inspection
  requires effective vehicle inspectionLevel >=1
  reveals one deterministic eligible hidden defect

full_service
  requires location service + spendable Expedition Cash
  reveals all current hidden defects
  restores +10 to lowest technical group, capped 100
  resolves defects whose service rule covers the repaired group
```

Selectors return legal actions; reducer computes price/result. UI never submits Money delta, Condition value or defect status.

---

## Task 9: Add optional insurance as a real pre-tour risk-management sink

Registry:

```ts
export interface ExpeditionInsurancePolicy {
  id: 'roadside' | 'equipment' | 'touring'
  premium: number
  coverage: 'vehicle' | 'technical' | 'either'
}
```

Initial policies:

```text
roadside  premium €300 -> one vehicle rescue; excludes Contraband/intentional sabotage Authority outcomes
equipment premium €350 -> one technical zero-Condition rescue to 25; no vehicle coverage
touring   premium €550 -> one rescue of either class; same exclusions
```

Premium is derived/charged once at START through `canSpendExpeditionCash`. Run state stores policy id + `claimConsumed` only.

Claim trigger is source-derived from the canonical vehicle/technical zero-condition path. Reducer derives rescue amount and refuses excluded source families. Tests cover forged claim, replay and save/reload.

---

## Task 10: Guarantee Condition-0 recovery and export the G1B technical failure signal

A mandatory current PreGig with a disabled technical group must never render Start disabled with no enabled action.

Available actions:

```text
field_repair   when spare part + repair minigame path is legal
cannibalize    when a healthy eligible source group/component exists
professional   when current location provides service + spendable Cash
insurance      when policy has unused eligible claim
salvage_rights when G5 Legendary is eligible and has a legal sacrifice
accept_failure always available after rescue evaluation
```

`getTechnicalFailureSignal(state)` returns a G1B failure source only when a required disabled group remains unresolved and the player explicitly accepts failure or has exhausted/declined all canonical recovery choices.

Successful recovery clears disabled state and permits Start.

Golden path:

```text
post-gig wear -> Condition reaches 0
-> next node mandatory Gig
-> PreGig exposes recovery choices
-> successful repair enables Start
OR accept_failure creates technical_shutdown pending failure
-> never softlocks
```

---

## Task 11: Settle travel wear/Fuel through the real vehicle owner

Create one canonical resolver at the current travel settlement seam:

```ts
export interface ExpeditionTravelSettlement {
  fuelConsumed: number
  vehicleWear: number
}

export const resolveExpeditionTravelCost = (
  state: GameState,
  routeContext: RouteContext
): ExpeditionTravelSettlement
```

It uses:

```text
base route distance/road risk
* getEffectiveExpeditionRules(state).numeric.fuelConsumptionMultiplier
* getEffectiveExpeditionRules(state).numeric.roadWearMultiplier
```

Vehicle wear commits only to `state.player.van.condition`; it is never copied into Expedition technical Condition. Insurance/G1 Mobility failure consume that canonical owner.

G3 Driver and G5 Region/Tour/Pressure later modify the same effective multipliers.

Tests run identical trip with different chassis/Driver/Pressure profiles and prove the actual `player.van.condition`/Fuel owner changes.

---

## Task 12: Build Condition/Cargo UI and telemetry handoff

`ConditionPanel` shows exact values on expansion, semantic bands, revealed/triggered defects only and active gameplay penalties.

`SupplyStopModal` exposes only selector-approved actions:

```text
buy spare parts
buy supplies
professional repair
field repair
improvise
cannibalize
inspection/full service
```

Telemetry is emitted only after canonical reducer transitions:

```text
vehicle minimum          -> player.van.condition
technical minima         -> expedition.condition groups
repair spend             -> after Money mutation
field repair quality/use -> after repair success
defect created/revealed/triggered/resolved -> after state transition
insurance premium/claim  -> after canonical transition
manifest utilization     -> materialized active manifest
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

## G2 Exit criteria

- Chassis choice itself changes Fuel, cargo, repair and risk decisions before modules.
- Every active Expedition merch/Contraband consumer is manifest-only.
- Vehicle Condition remains in `player.van.condition`; technical Condition remains Expedition-owned.
- Active technical Condition visibly changes rhythm/gig behavior.
- Field Repair reads only the unified effective-rules result; chassis, Technician and field-engineer effects converge on the same formula.
- Hidden defects have executable create/reveal/trigger/resolve transitions, exact consequences and no pre-reveal UI/ARIA leak.
- Inspections and insurance create real Cash-vs-risk choices.
- Condition 0 always reaches recovery or explicit failure, never a softlock.
- G6 can import production helpers/telemetry without inventing simulator-only formulas.