# Condition, Repairs, Cargo and Vehicle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Expedition vehicle/technical-risk layer with deterministic chassis playstyles, one effective-rules path, real cargo manifests, gameplay-relevant Condition, complete repair/defect/inspection/insurance lifecycles and exactly-once travel/day economics.

**Architecture:** Existing `CHASSIS_CONFIG`, `MODULE_REGISTRY`, `player.van.condition`, inventory/stash and purchase systems remain canonical. Expedition technical Condition owns only PA/Instruments/Stage Gear. All composable Expedition numeric/flag rules flow through `getEffectiveExpeditionRules(state)`. Legacy day-tick wear/economy is explicitly adapted while an Expedition is active so no second hidden wear/cash path exists.

**Tech Stack:** TypeScript 6, React 19, current assets/modules/minigames/event engine, Node/Vitest/Playwright.

---

## Authority and dependencies

```text
approved design spec > master plan > this child plan
G2 depends on G1A only
```

G3-G5 extend `getEffectiveExpeditionRules(state)` in place. G2 must pass with neutral/default contributions for later gates.

---

## File structure

**Create:**

- `src/domain/expedition/chassis.ts`
- `src/domain/expedition/modules.ts`
- `src/domain/expedition/effectiveRules.ts`
- `src/domain/expedition/cargo.ts`
- `src/domain/expedition/condition.ts`
- `src/domain/expedition/repairs.ts`
- `src/domain/expedition/defects.ts`
- `src/domain/expedition/insurance.ts`
- `src/domain/expedition/travel.ts`
- `src/ui/expedition/TechnicalConditionPanel.tsx`
- `src/ui/expedition/RepairChoices.tsx`
- `tests/node/expeditionChassis.test.js`
- `tests/node/expeditionEffectiveRules.test.js`
- `tests/node/expeditionCargo.test.js`
- `tests/node/expeditionCondition.test.js`
- `tests/node/expeditionRepairs.test.js`
- `tests/node/expeditionDefects.test.js`
- `tests/node/expeditionInsurance.test.js`
- `tests/node/expeditionTravel.test.js`
- `tests/node/expeditionDailyTick.test.js`

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
- `src/context/reducers/assetReducer.ts`
- `src/utils/assetConfig.ts`
- `src/utils/dailyTickLogic.ts`
- `src/utils/eventEngine/eventEffectHandlers.ts`
- `src/domain/eventResolver.ts`
- `src/ui/SupplyStopModal.tsx`
- current PreGig/rhythm modifier owners
- `tests/ui/useRoadieLogic.test.jsx`
- `tests/ui/useKabelsalatGameEnd.test.jsx`
- `tests/logic/ampCalibrationReducer.test.js`
- `public/locales/en/ui.json`
- `public/locales/de/ui.json`

---

## Task 1: Derive four chassis playstyles from every supported real Tourbus flavor/tier

Do not create a purchasable chassis registry. Use `CHASSIS_CONFIG.tourbus_chassis[flavor][tier]` as ownership/config source.

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

Canonical mapping for **all six supported Tourbus combinations**:

```text
legit tier 1 -> compact
legit tier 2 -> coach
legit tier 3 -> coach

diy tier 1   -> diy
diy tier 2   -> diy
diy tier 3   -> armored_hauler
```

No G6 profile repeats or overrides this table; it imports `getExpeditionChassisArchetype(asset)`.

Initial profiles:

```text
compact
  fuel x0.85 | road wear x1.10 | cargo +0 | field repair +0.00
  Crew Stress x1.05 | Authority x0.95 | hidden Contraband 0

diy
  fuel x1.00 | road wear x1.15 | cargo +1 | field repair +0.20
  Crew Stress x1.00 | Authority x1.00 | hidden Contraband 1

coach
  fuel x1.20 | road wear x0.85 | cargo +3 | field repair +0.05
  Crew Stress x0.85 | Authority x1.05 | hidden Contraband 0

armored_hauler
  fuel x1.35 | road wear x0.75 | cargo +4 | field repair +0.10
  Crew Stress x0.95 | Authority x1.20 | hidden Contraband 2
```

- [ ] Test every flavor/tier mapping.
- [ ] Compare two otherwise-identical routes and prove Fuel/wear/capacity plus at least one risk/recovery choice differs before modules.

---

## Task 2: Extend only real existing modules with Expedition consumers

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

Map only existing `MODULE_REGISTRY` ids with a real consumer. Initial expected examples:

```text
tb_gps_jammer      -> Authority Intel +1 and bounded Authority weighting reduction
tb_roof_rack       -> cargo capacity
tb_trailer_hitch   -> cargo capacity
tb_sleeping_bunks  -> rest Stress recovery
a protection/repair module -> road wear or inspectionLevel
```

If a module has no production consumer, leave it neutral instead of inventing simulator-only behavior.

---

## Task 3: Create the single effective-rules entrypoint

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

G2 composes Base -> Chassis -> installed modules. G3/G4/G5 extend the same function with Crew/Run Draft/Region/Tour/Pressure/Nemesis/Legendary inputs. Every public field must have one production consumer and one parity test before G6 may measure it.

---

## Task 4: Materialize a real cargo manifest from owned selections

```ts
export interface ExpeditionCargoState {
  spareParts: number
  supplies: number
  merch: ExpeditionMerchSelection[]
  contraband: ExpeditionContrabandSelection[]
}
```

`materializeExpeditionCargo(loadout, state)` validates exact ownership and quantities from canonical inventory/stash, derives slot use from actual selected items and the selected vehicle capacity, and stores only the committed manifest.

All active Expedition consumers must use `getExpeditionCargoView(state)`:

```text
Merch revenue
Contraband use/UI
Roadie/minigame selection
Expedition crafting/use
Authority confiscation/event effects
```

Omitted merch earns zero Expedition merch revenue. Omitted Contraband cannot be selected/used/confiscated by Expedition paths even if it still exists in persistent stash.

---

## Task 5: Add technical Condition with active-gameplay consequences

```ts
export type ConditionGroup = 'pa' | 'instruments' | 'stageGear'

export interface ExpeditionTechnicalCondition {
  pa: number
  instruments: number
  stageGear: number
  defects: HiddenDefectState[]
}
```

Clamp groups `0..100`.

Canonical performance profile:

```text
PA 70..100            baseline
PA 40..69             audioHazardLevel 1
PA 1..39              audioHazardLevel 2; timing x0.96
PA 0                  disabledGroups includes pa

Instruments 40..69    timing x0.98
Instruments 1..39     timing x0.93; miss stamina x1.15
Instruments 0         disabledGroups includes instruments

Stage Gear 40..69     combo recovery x0.95
Stage Gear 1..39      combo recovery x0.85; audioHazardLevel >=1
Stage Gear 0          disabledGroups includes stageGear
```

PreGig surfaces every modifier. Existing rhythm/gig owners consume the profile; no second score engine.

Post-Gig wear derives from canonical Gig result and `getEffectiveExpeditionRules(state).numeric.technicalWearMultiplier` exactly once.

---

## Task 6: Define one complete repair-mode registry/resolver

Every UI-exposed repair option must be executable through the same reducer-authoritative contract.

```ts
export type ExpeditionRepairMode =
  | 'field'
  | 'professional'
  | 'improvise'
  | 'cannibalize'

export interface ExpeditionRepairIntent {
  mode: ExpeditionRepairMode
  targetGroup: ConditionGroup
  sourceGroup?: ConditionGroup
  quality?: number
  expectedRouteStep: number
}

export interface ExpeditionRepairResult {
  targetRestore: number
  sourceDamage: number
  moneyCost: number
  sparePartsCost: number
  createsHiddenDefect: boolean
  resolvesTargetDefects: boolean
}
```

Reducer/shared resolver computes results from current state; callers never submit costs/next Condition/defect flags.

### Field

Requires one spare part and a completed mapped minigame result.

```ts
rawRestore = 20 + boundedQuality * 35 + rules.numeric.fieldRepairEfficiency * 20
restore = Math.max(rules.flags.fieldRepairMinimumCondition, Math.min(60, Math.round(rawRestore)))
createDefect = !rules.flags.fieldRepairNoHiddenDefect && boundedQuality < 0.45
```

### Professional

Requires current location to expose service and enough Expedition spendable Cash.

```text
base price = ceil((100 - targetCondition) * €10)
price *= effective repairCostMultiplier
restore target to 100
resolve all revealed/triggered defects on target group
```

### Improvise

Always available when target <50 and no professional/field resource is required.

```text
money 0
spare parts 0
restore +20, capped at 45
always create a deterministic severity-1/2 hidden defect for the target group
may not resolve an existing defect
```

### Cannibalize

Requires a different technical group with current Condition >=55.

```text
source group -15
target group +25, capped at 60
money 0
spare parts 0
resolve one deterministic revealed/triggered target-group defect
cannot reduce source below 40
```

- [ ] Add direct forged-action tests for every mode.
- [ ] Add Condition-0 golden paths using professional/field/cannibalize and an explicit fail choice.

---

## Task 7: Implement complete hidden-defect lifecycle

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

Creation is deterministic from root `state.runSeed`, group/source/route step. Duplicate source+group+step cannot create twice.

```ts
REVEAL_EXPEDITION_DEFECT { defectId; source; expectedRouteStep }
TRIGGER_EXPEDITION_DEFECT { defectId; trigger; expectedRouteStep }
RESOLVE_EXPEDITION_DEFECT { defectId; repairResolutionId; expectedRouteStep }
```

Trigger consequence:

```text
severity 1 -> group -8
severity 2 -> group -15
severity 3 -> group -25 and expose immediate recovery/failure warning when group reaches 0
```

Hidden defects never leak id/severity/group-specific warning/trigger timing into visual or ARIA output before reveal.

---

## Task 8: Make inspection a real source-owned decision

```text
quick_check
  free; shows condition bands; reveals no defect

crew_inspection
  requires selected available Technician/Roadie; reveals one deterministic eligible defect

module_inspection
  requires effective inspectionLevel >=1; reveals one deterministic eligible defect

full_service
  requires service location + Expedition spendable Cash
  flat diagnostic fee €150 * repairCostMultiplier
  reveals all hidden defects
  then may invoke one canonical professional repair intent chosen by player
```

Full service does not invent a separate repair result; it reveals, then reuses Task 6.

---

## Task 9: Add optional insurance as a pre-tour risk sink

```ts
export interface ExpeditionInsurancePolicy {
  id: 'roadside' | 'equipment' | 'touring'
  premium: number
  coverage: 'vehicle' | 'technical' | 'either'
}
```

```text
roadside  €300 -> one vehicle rescue
equipment €350 -> one technical zero-Condition rescue to 25
touring   €550 -> one rescue of either class
```

Exclude Contraband/intentional sabotage Authority outcomes. Premium is charged once at START via G1 protected-Cash boundary. Claim source is derived from canonical zero-condition path; run state stores only policy id + `claimConsumed`.

---

## Task 10: Guarantee zero-Condition recovery without softlock

At a mandatory PreGig with a disabled group, Start is blocked **only while** at least one recovery/termination control is enabled.

Possible controls:

```text
field repair
professional repair
cannibalize
insurance claim
G5 Salvage Rights when later available
accept technical failure
```

`getTechnicalFailureSignal(state)` becomes true only after explicit `accept_failure` or when the current canonical crisis has no legal recovery and the player confirms termination.

Golden path:

```text
post-gig wear -> group reaches 0
-> mandatory Gig
-> PreGig offers legal recovery or explicit fail
-> successful repair enables Start
OR failure creates G1 technical_shutdown PendingFailure
```

---

## Task 11: Settle travel Fuel/vehicle wear exactly once

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

Use base route distance/risk multiplied by effective Fuel and road-wear rules. Commit vehicle wear only to canonical `state.player.van.condition`; never copy vehicle Condition into technical Condition.

The actual travel completion owner is the existing travel/minigame reducer path; integrate there rather than inventing a second hook-only settlement.

---

## Task 12: Define the active-Expedition `ADVANCE_DAY` policy

This task closes the collision with existing `dailyTickLogic`.

While `state.expedition.status === 'active'`:

```text
1. flat legacy daily van.condition -= 2 is SUSPENDED
2. vehicle wear comes only from Task 11 route settlement
3. guaranteed daily obligations are still computed by the existing daily-cost helper
4. positive newsletter revenue may still reduce/flip the obligation result
5. mandatory net daily cost may spend only G1 Expedition spendable Cash
6. if mandatory cost exceeds spendable Cash:
     player.money is reduced only down to protectedCareerCash
     create source-derived bankruptcy PendingFailure for the unpaid amount
     never cross protectedCareerCash
7. wealth-scaled surplus drain is SUSPENDED during active Expedition
8. Rest-in-Van ADVANCE_DAY applies no travel wear, but still applies the same protected mandatory-obligation rule
```

Outside active Expedition, legacy `dailyTickLogic` behavior remains unchanged.

Required tests:

```text
travel settlement -> ADVANCE_DAY does not apply second flat vehicle wear
Rest-in-Van -> ADVANCE_DAY does not wear vehicle
mandatory obligations within run budget deduct normally
mandatory obligations exceeding run budget stop at protectedCareerCash + bankruptcy signal
wealth drain never touches protected reserve during active Expedition
non-Expedition day tick unchanged
```

---

## Task 13: Route Expedition event deltas through the real event engine

Register `type:'expedition'` in `src/utils/eventEngine/eventEffectHandlers.ts` and extend `EventDelta` with a sanitized Expedition intent envelope. `src/domain/eventResolver.ts` forwards it to typed `APPLY_EXPEDITION_EVENT_DELTA`; the reducer derives actual Heat/Condition/cargo effects from known result ids.

Unknown effect types or caller-supplied numeric state changes must not silently mutate Expedition state.

---

## Task 14: Verification

Run:

```bash
pnpm exec vitest run tests/ui/useRoadieLogic.test.jsx tests/ui/useKabelsalatGameEnd.test.jsx tests/logic/ampCalibrationReducer.test.js
pnpm run test:node
pnpm run test:ui
pnpm run typecheck:core
pnpm run deadcode:check
```

Expected: PASS.

---

## G2 exit criteria

- Every real Tourbus `{flavor,tier}` maps deterministically to one chassis archetype and G6 imports that function.
- Every chassis/module rule has a production consumer through the single effective-rules path.
- Cargo is a manifest of real selected ownership and omitted content cannot leak into Expedition consumers.
- Technical Condition changes real gameplay and has no softlock at zero.
- Field/professional/improvise/cannibalize all have exact reducer-derived contracts.
- Hidden defects have create/reveal/trigger/resolve semantics with no pre-reveal UI/ARIA leak.
- Insurance is optional and source-derived.
- Route Fuel/vehicle wear occurs once.
- Active Expedition `ADVANCE_DAY` cannot double-wear the van or cross protected Career Cash.
