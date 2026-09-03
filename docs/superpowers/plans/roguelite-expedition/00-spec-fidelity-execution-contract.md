# Roguelite Expedition Spec Fidelity + Execution Contract

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to apply this contract task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the approved Roguelite Expedition design as an executable implementation contract, close the remaining review gaps, and prevent the implementation from becoming only an Expedition state layer over the legacy touring flow.

**Architecture:** Preserve the repository's existing canonical owners (`player`, `band`, `assets`, `social`, `unlocks`, event/quest pipelines), but make Tour Prep commit a real build, make route/Condition/Crew/Pressure systems change player decisions and active gameplay, and move permanent progression toward new options/rule changes instead of percentage power. This contract amends G1–G6; when it conflicts with an older child-plan snippet or `00-review-hardening-contract.md`, this file wins while all compatible hardening requirements remain mandatory.

**Tech Stack:** React 19, TypeScript 6, typed `GameAction`/`ActionTypes`, reducers/action creators, existing BandHQ/setlist/assets/stash/event/quest owners, deterministic `MapGenerator`, Node/Vitest/Playwright, balance simulator v15.

---

## Source-of-truth order

1. `docs/superpowers/specs/2026-09-03-roguelite-expedition-tour-design.md`
2. **this file**
3. `roguelite-expedition/00-review-hardening-contract.md`
4. `2026-09-03-roguelite-expedition-master-plan.md`
5. `01-...md` through `06-...md`

Apply before each gate closes:

```text
G1-F1 full pre-tour build commitment
G1-F2 route-visible Rival/Underground nodes
G1-F3 authoritative lifecycle + Intel + settlement + reward ledger
G1-F4 multi-axis failure/rescue framework
G2-F1 owned-content cargo manifest
G2-F2 travel wear + Condition gameplay + hidden-defect lifecycle + insurance
G3-F1 production Crew effects + persistent crew consequences
G3-F2 production-valid Expedition event data
G4-F1 intent-based obligations + quest-credit settlement
G4-F2 typed Rival outcome persistence + Nemesis rule escalation
G4-F3 executable contextual-finale profiles
G5-F1 one production Region/Tour/Crew/Pressure composition path
G5-F2 authoritative Ascension/Tour-Pressure validation
G5-F3 1–3 consequential between-tour decisions
G5-F4 HQ transition away from universal run-1 permanent power buying
G5-F5 rule-changing Legendary rewards
G6-F1 simulator/release gates proving shipped behavior
```

**Global rule:** a simulator metric is not evidence until the measured behavior has a production consumer and an app-side test.

---

# G1-F1 — Full pre-tour build commitment

**Amends:** G1 Tasks 1, 4, 5, 6; later Tour Prep tasks.

**Files:**
- Modify: `src/types/expedition.d.ts`
- Create: `src/domain/expedition/buildCommitment.ts`
- Modify: `src/domain/expedition/loadout.ts`
- Modify: `src/context/expeditionActionCreators.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Modify: `src/context/reducers/expeditionSanitizers.ts`
- Modify: `src/context/reducers/gigReducer.ts`
- Modify: `src/context/reducers/assetReducer.ts`
- Modify: `src/scenes/TourPrep.tsx`
- Modify: `src/ui/expedition/TourPrepLoadout.tsx`
- Create: `src/ui/expedition/BuildCommitmentPanel.tsx`
- Test: `tests/node/expeditionLoadout.test.js`
- Test: `tests/node/expeditionReducer.test.js`
- Test: `tests/node/gameReducer.test.js`
- Test: `tests/node/assetReducer.test.js`
- Test: `tests/ui/TourPrep.test.tsx`

- [ ] **Step 1: Extend the canonical loadout**

```ts
export interface ExpeditionEquipmentCommitment {
  memberId: string
  slots: Array<{ slot: string; itemId: string | null }>
}

export interface ExpeditionContrabandSelection {
  stashKey: string
  instanceId: string | null
  stacks: number
}

export interface ExpeditionMerchSelection {
  inventoryKey: string
  quantity: number
}

export interface ExpeditionBuildCommitment {
  setlistSongIds: string[]
  equipment: ExpeditionEquipmentCommitment[]
  selectedTourbusModuleIds: string[]
  contraband: ExpeditionContrabandSelection[]
  merch: ExpeditionMerchSelection[]
  sponsorDealId: string | null
  startingFuelTarget: number
  cashReserveFloor: number
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
  build: ExpeditionBuildCommitment
}
```

`setlistSongIds` is the normalized current `state.setlist`. `equipment` snapshots each stable band-member id; sort own equipment slot keys lexically, use a non-empty string value or record `.id` as `itemId`, otherwise `null`. `selectedTourbusModuleIds` is re-derived from the selected owned `tourbus_chassis.slots[].installedModuleId` and is never trusted from the caller.

- [ ] **Step 2: Add exact snapshot/validation helpers**

```ts
export const buildCurrentExpeditionCommitment = (
  state: GameState,
  input: {
    activeTourbusAssetId: string | null
    contraband: ExpeditionContrabandSelection[]
    merch: ExpeditionMerchSelection[]
    sponsorDealId: string | null
    startingFuelTarget: number
    cashReserveFloor: number
  }
): ExpeditionBuildCommitment

export const validateExpeditionBuildCommitment = (
  state: GameState,
  commitment: ExpeditionBuildCommitment,
  activeTourbusAssetId: string | null
):
  | { valid: true; commitment: ExpeditionBuildCommitment }
  | { valid: false; reason: string }
```

Validation proves:

```text
setlist ids: non-empty, unique, exactly match current normalized setlist ids
equipment: exact current normalized member-equipment snapshot
modules: exact installed module ids of selected owned chassis
contraband: own stash key; positive integer stacks <= owned stacks; instanceId matches when present
merch: own inventory key; positive integer quantity <= canonical numeric inventory quantity
sponsorDealId: null or a currently active/eligible deal id from the existing Social/Brand Deal owner
startingFuelTarget: integer in [current fuel, 100]
cashReserveFloor: integer in [0, current money]
```

Reject prototype keys, duplicate merch/stash selections, missing member ids, stale modules and stale setlist/equipment.

- [ ] **Step 3: Revalidate and settle start-time fuel in the reducer**

`validateExpeditionLoadout(state, payload.loadout)` calls the build validator again inside the hardened `START_EXPEDITION` reducer. Fuel top-up cost is derived from the source-of-truth fuel price:

```ts
const liters = Math.max(0, payload.loadout.build.startingFuelTarget - currentFuel)
const fuelCost = Math.ceil(liters * EXPENSE_CONSTANTS.TRANSPORT.FUEL_PRICE)
```

Reject start if fuel + insurance + other start-time spend would cross `cashReserveFloor`. On success, update canonical `player.money` and `player.van.fuel` once before materializing Expedition state.

- [ ] **Step 4: Freeze build identity during the run**

`handleSetSetlist` returns the original state when an active Expedition receives a setlist whose ids differ from the committed ids. `handleInstallModule` and `handleRemoveModule` in `src/context/reducers/assetReducer.ts` return the original state when `payload.assetId === expedition.loadout.activeTourbusAssetId` during an active run. Repairs/consumables remain mutable.

- [ ] **Step 5: Tour Prep exposes every committed axis**

`BuildCommitmentPanel` renders:

```text
Setlist
Band Equipment
Vehicle + Installed Modules
Crew
Cargo / Merch / Contraband
Sponsor + Contracts
Starter Perk / Tour Pressure
Fuel Target + Cash Reserve
```

Setlist/equipment/modules reuse their existing owner UIs; Tour Prep stores only the normalized commitment. Start uses only `validateExpeditionLoadout(state, candidate)`.

- [ ] **Step 6: Test and commit**

Required hostile cases: stale setlist, stale modules, unowned Contraband, merch over ownership, invalid fuel target, reserve-floor violation, active-run setlist change, active selected-chassis module install/remove.

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/expeditionLoadout.test.js \
  tests/node/expeditionReducer.test.js \
  tests/node/gameReducer.test.js \
  tests/node/assetReducer.test.js
pnpm exec vitest run tests/ui/TourPrep.test.tsx
pnpm run typecheck:core
git add src/types/expedition.d.ts src/domain/expedition/buildCommitment.ts src/domain/expedition/loadout.ts src/context src/scenes/TourPrep.tsx src/ui/expedition tests
git commit -m "feat(expedition): commit complete pre-tour build"
```

---

# G1-F2 — Route-visible Rival and Underground nodes

**Amends:** G1 Tasks 7–8; G5 Task 6.

**Files:**
- Modify: `src/types/expedition.d.ts`
- Modify: `src/utils/mapGenerator/types.ts`
- Modify: `src/utils/mapGenerator.ts`
- Modify: `src/context/useMapGeneration.ts`
- Modify: `src/domain/expedition/nodeIntel.ts`
- Modify: `src/components/MapNodeView.tsx`
- Modify: `src/components/overworld/OverworldMap.tsx`
- Modify: `src/hooks/useArrivalLogic.ts`
- Create: `src/ui/expedition/UndergroundMarketModal.tsx`
- Test: `tests/node/mapGenerator.test.js`
- Test: `tests/node/expeditionNodeIntel.test.js`
- Test: `tests/ui/MapNode.test.jsx`
- Test: `tests/ui/useArrivalLogic.test.jsx`

- [ ] **Step 1: Use typed Expedition subtypes on structural `SPECIAL` nodes**

```ts
export type ExpeditionRouteNodeSubtype =
  | 'rival_encounter'
  | 'underground_market'

export interface ExpeditionMapNodeMeta {
  subtype: ExpeditionRouteNodeSubtype | null
}
```

Map nodes may carry `expedition?: ExpeditionMapNodeMeta`. Do not widen the repository-wide `MapNodeType` union just for Expedition.

- [ ] **Step 2: Extend deterministic generation options**

```ts
nodeTypeWeights?: {
  rest: number
  supply: number
  special: number
  rival: number
  underground: number
}
```

Require non-negative values, `rival + underground <= special`, `rest + supply + special < 0.8`. A SPECIAL roll uses one additional **seeded generator** roll to choose Rival, Underground or ordinary Special. No `Math.random()`.

Eligibility:

```text
Rival: active/persistent rival exists OR tour is rival_hunt
Underground: region is underground OR build carries Contraband OR Black Market capability is unlocked
```

Ineligible subtype probability falls back to ordinary Special.

- [ ] **Step 3: Give each subtype an arrival owner**

`rival_encounter` queues the typed G4-F2 Rival encounter. `underground_market` opens `UndergroundMarketModal`, which reuses the same canonical stash/cargo/purchase actions as Supply Stop; it never writes stash/inventory directly.

- [ ] **Step 4: Fog shows the actual route class**

Level 0 already labels the node `Rival` or `Underground` plus rough danger/reward. Level 1/2 add range/exact intel. Do not show it as generic `Special` after structural visibility.

- [ ] **Step 5: Test and commit**

Pin one deterministic seed for each subtype, repeat generation and assert equality; test subtype display and arrival routing.

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/mapGenerator.test.js tests/node/expeditionNodeIntel.test.js
pnpm exec vitest run tests/ui/MapNode.test.jsx tests/ui/useArrivalLogic.test.jsx
git add src/types/expedition.d.ts src/utils/mapGenerator src/context/useMapGeneration.ts src/domain/expedition/nodeIntel.ts src/components src/hooks/useArrivalLogic.ts src/ui/expedition/UndergroundMarketModal.tsx tests
git commit -m "feat(expedition): add rival and underground route nodes"
```

---

# G1-F3 — Authoritative lifecycle, Intel and settlement

**Amends:** G1 Tasks 4, 8–11; G1-A.

**Files:**
- Modify: `src/types/expedition.d.ts`
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/context/expeditionActionCreators.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Modify: `src/context/useExpeditionDispatchActions.ts`
- Modify: `src/domain/expedition/extraction.ts`
- Modify: `src/domain/expedition/nodeIntel.ts`
- Modify: `src/components/MapNodeView.tsx`
- Test: `tests/node/expeditionReducer.test.js`
- Test: `tests/node/expeditionExtraction.test.js`
- Test: `tests/node/expeditionNodeIntel.test.js`
- Test: `tests/ui/MapNode.test.jsx`

- [ ] **Step 1: Finalization carries intent, not outcome**

```ts
export type ExpeditionFinalizeIntent =
  | 'voluntary_extract'
  | 'finale_success'
  | 'system_failure'

export interface FinalizeExpeditionPayload {
  intent: ExpeditionFinalizeIntent
  reason: ExpeditionFailureReason | 'voluntary' | 'finale'
  expectedRouteStep: number
}
```

Reducer derives:

```text
voluntary_extract -> extracted only at a canonical extraction window
finale_success -> completed only when current node is FINALE, finaleType is resolved,
                  lastGigStats exists and failed !== true
system_failure -> failed only when the canonical pending failure matches reason
```

No action chooses `completed|extracted|failed` directly.

- [ ] **Step 2: Revalidate every arrival**

```ts
export interface RecordExpeditionArrivalPayload {
  nodeId: string
  expectedRouteStep: number
}
```

Reducer requires active run, `nodeId === state.player.currentNodeId`, real map node, not visited, expected current step, and for non-first arrival a connection from the previous visited node. Fake/disconnected/stale/duplicate arrivals are identical-state no-ops.

- [ ] **Step 3: Define the missing Intel lifecycle**

```ts
export interface RevealNodeIntelPayload {
  nodeId: string
  expectedLevel: NodeIntelLevel
  nextLevel: NodeIntelLevel
  source: 'scout_passive' | 'scout_recon' | 'social' | 'contact' | 'perk'
}
```

Reducer validates real node, exact current level, `nextLevel === expectedLevel + 1`, max 2. Add `scoutReconUsedRouteSteps: number[]`.

Concrete v1 producers:

```text
Scout selected -> when committed map becomes available, every structurally visible future node receives 0->1 once
Scout Recon -> once per routeStep, player chooses one visible future node for 1->2
later Social/contact/perk features call the same action; never mutate intelByNodeId directly
```

- [ ] **Step 4: Replace loose reward-id arrays with a ledger**

```ts
export interface ExpeditionRewardLedgerEntry {
  id: string
  kind: 'module' | 'crew_contact' | 'contract' | 'legendary' | 'other'
  sourceId: string
  secured: boolean
}

export interface ExpeditionSettlement {
  kind: 'extracted' | 'completed' | 'failed'
  retentionRate: number
  finalMoney: number
  finalFame: number
  keptRewardIds: string[]
  lostRewardIds: string[]
}

export const calculateExpeditionSettlement = (
  state: GameState,
  kind: ExpeditionSettlement['kind']
): ExpeditionSettlement
```

Typed ledger actions: `ADD_EXPEDITION_REWARD {id, kind, sourceId}` and `SECURE_EXPEDITION_REWARD {id, expectedSecured:false}`. Completion keeps all; extraction/failure keep only secured entries. Completion multiplier applies only to positive run-earned Cash/Fame deltas, never starting principal or losses.

- [ ] **Step 5: Guard Next Tour**

`PREPARE_NEXT_EXPEDITION` requires a non-null finalized outcome. G5-F3 later additionally requires between-tour decisions resolved.

- [ ] **Step 6: Test and commit**

Required: fake arrival, early extraction, fake completion, system failure without pending failure, early Next Tour, Intel 0→1→2/replay/save, rare reward loss and secured retention, completion multiplier not refunding losses.

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/expeditionReducer.test.js \
  tests/node/expeditionExtraction.test.js \
  tests/node/expeditionNodeIntel.test.js
pnpm exec vitest run tests/ui/MapNode.test.jsx
git add src/types/expedition.d.ts src/context src/domain/expedition src/components/MapNodeView.tsx tests
git commit -m "feat(expedition): harden lifecycle intel and rewards"
```

---

# G1-F4 — Multi-axis failure and rescue

**Amends:** G1 Task 11; mandatory integration point for G2–G4.

**Files:**
- Modify: `src/types/expedition.d.ts`
- Create: `src/domain/expedition/failure.ts`
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/context/expeditionActionCreators.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Create: `src/ui/expedition/FailureCrisisDialog.tsx`
- Test: `tests/node/expeditionFailure.test.js`
- Test: `tests/node/expeditionReducer.test.js`
- Test: `tests/ui/FailureCrisisDialog.test.tsx`

- [ ] **Step 1: Define failure state**

```ts
export type ExpeditionFailureReason =
  | 'bankruptcy'
  | 'mobility_disabled'
  | 'band_incapacitated'
  | 'crew_collapse'
  | 'harmony_collapse'
  | 'authority_crisis'
  | 'critical_contract_breach'

export type ExpeditionRescueOption =
  | 'extract_now'
  | 'field_repair'
  | 'cannibalize'
  | 'rest'
  | 'pay_escape'
  | 'sacrifice_reward'
  | 'accept_failure'

export interface PendingExpeditionFailure {
  reason: ExpeditionFailureReason
  openedAtRouteStep: number
  optionIds: ExpeditionRescueOption[]
}
```

State gets `pendingFailure` and `endingCause`.

- [ ] **Step 2: Add one evaluator**

```ts
export const evaluateExpeditionFailure = (
  state: GameState
): PendingExpeditionFailure | null
```

Rules:

```text
bankruptcy: existing canonical insolvency check
mobility_disabled: van condition <=0 and no canonical repair/cannibalize rescue remains
band_incapacitated: every member is critical-injured OR every member stamina <=0
crew_collapse: every selected crew actor is breaking and no recovery option remains
harmony_collapse: harmony <=1 AND a crisis/event explicitly marks the collapse unresolved
                   (harmony is canonically clamped to minimum 1; low Harmony alone is not auto-failure)
authority_crisis: Heat ==100 after an authority encounter and no safe escape remains
critical_contract_breach: template has tourEndingOnFailure:true
```

- [ ] **Step 3: Use intent-only crisis actions**

```ts
OPEN_EXPEDITION_FAILURE_CRISIS { expectedRouteStep }
RESOLVE_EXPEDITION_FAILURE_CRISIS { reason, optionId, expectedRouteStep }
```

Reducer re-runs the evaluator and derives costs/effects from current state. `accept_failure` uses G1-F3 `system_failure`. Later gates register `field_repair/cannibalize` (G2), `rest` (G3), `pay_escape/sacrifice_reward` (G4). `extract_now` is present only when extraction is currently valid.

- [ ] **Step 4: Golden-path five causes and commit**

Cover bankruptcy, mobility, injury/crew, authority and critical contract. Where a rescue exists, crisis opens before terminal settlement; replay cannot settle twice.

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionFailure.test.js tests/node/expeditionReducer.test.js
pnpm exec vitest run tests/ui/FailureCrisisDialog.test.tsx
git add src/types/expedition.d.ts src/domain/expedition/failure.ts src/context src/ui/expedition/FailureCrisisDialog.tsx tests
git commit -m "feat(expedition): add multi-axis failure crises"
```

---

# G2-F1 — Owned-content cargo manifest

**Amends:** G2 Tasks 1, 3, 4, 11; G2-A Amendment 4.

**Files:**
- Modify: `src/types/expedition.d.ts`
- Modify: `src/domain/expedition/cargo.ts`
- Modify: `src/domain/expedition/loadout.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Modify: `src/context/reducers/expeditionSanitizers.ts`
- Modify: `src/ui/expedition/TourPrepLoadout.tsx`
- Modify: `src/ui/SupplyStopModal.tsx`
- Test: `tests/node/expeditionCargo.test.js`
- Test: `tests/node/expeditionLoadout.test.js`
- Test: `tests/node/expeditionReducer.test.js`
- Test: `tests/ui/TourPrep.test.tsx`

- [ ] **Step 1: Materialize actual selected content**

```ts
export interface ExpeditionCargoManifest {
  spareParts: number
  supplies: number
  merch: ExpeditionMerchSelection[]
  contraband: ExpeditionContrabandSelection[]
  technicalGearSlots: number
}

export const materializeExpeditionCargo = (
  state: GameState,
  loadout: ExpeditionLoadout
): ExpeditionCargoManifest | null
```

V1 slot costs:

```text
sparePart/supply: 1 each
merch: ceil(quantity / 25) per inventory key
contraband: 1 per selected stack; hiddenContrabandSlots only offsets eligible Contraband slots
technicalGearSlots: 1 per member whose canonical equipment object has at least one non-null/non-false own entry
```

Remove caller-entered `merchSlots`/`contrabandSlots` as authority. Start reducer re-derives ownership/capacity from canonical `band.inventory`, `band.stash`, member equipment and selected chassis modules.

- [ ] **Step 2: Keep Expedition use inside the manifest**

Expedition Contraband choices can consume/use only selected manifest entries. Supply purchases mutate the manifest through the hardened reducer-derived price/capacity action. Confiscation updates canonical stash through the existing event owner and then removes the corresponding manifest selection in the same resolved action sequence.

- [ ] **Step 3: Test and commit**

Test omitted real stash item cannot be used by Expedition, over-selected stacks/merch reject start, technical gear consumes slots, hidden slots do not create content, Supply Stop cannot overflow, stale purchase is no-op.

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionCargo.test.js tests/node/expeditionLoadout.test.js tests/node/expeditionReducer.test.js
pnpm exec vitest run tests/ui/TourPrep.test.tsx
git add src/types/expedition.d.ts src/domain/expedition/cargo.ts src/domain/expedition/loadout.ts src/context src/ui tests
git commit -m "feat(expedition): bind cargo to owned tour content"
```

---

# G2-F2 — Travel wear, active Condition, defects and insurance

**Amends:** G2 Tasks 2, 5–9; fixes the travel-owner/file drift.

**Files:**
- Modify: `src/domain/expedition/vehicle.ts`
- Modify: `src/domain/expedition/condition.ts`
- Modify: `src/domain/expedition/insurance.ts`
- Modify: `src/domain/expedition/repairs.ts`
- Create: `src/domain/expedition/defects.ts`
- Modify: `src/context/reducers/minigameReducer.ts`
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/context/expeditionActionCreators.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Modify: `src/hooks/usePreGigLogic.ts`
- Modify: `src/scenes/PreGig.tsx`
- Modify: `src/hooks/rhythmGame/useRhythmGameScoring.ts`
- Modify: `src/hooks/rhythmGame/scoring/useHandleHit.ts`
- Modify: `src/hooks/rhythmGame/scoring/useHandleMiss.ts`
- Test: `tests/node/expeditionCondition.test.js`
- Test: `tests/node/expeditionInsurance.test.js`
- Test: `tests/node/expeditionDefects.test.js`
- Test: `tests/node/minigameReducer.test.js`
- Test: `tests/node/minigameReducer_regression.test.js`
- Test: `tests/ui/PreGig.test.jsx`
- Test: `tests/ui/useRhythmGameScoring.test.jsx`

- [ ] **Step 1: Compose road wear in the actual travel settlement**

`handleCompleteTravelMinigame` in `src/context/reducers/minigameReducer.ts` remains the single owner of committed `player.van.condition`.

```ts
export interface ExpeditionTravelWearInput {
  baseConditionLoss: number
  vehicleMultiplier: number
  crewMultiplier: number
  regionMultiplier: number
  pressureMultiplier: number
}

export const resolveExpeditionTravelWear = (input: ExpeditionTravelWearInput): number =>
  Math.max(0, Math.round(
    input.baseConditionLoss * input.vehicleMultiplier * input.crewMultiplier *
    input.regionMultiplier * input.pressureMultiplier
  ))
```

Use the existing travel result as `baseConditionLoss`; apply the composed Expedition loss exactly once before committing van condition. G5-F1 supplies final profile values; earlier gates use identity `1`.

Insurance is evaluated immediately after a covered canonical mutation computes a transition from `>0` to `0`, including vehicle travel and technical-wear/event damage; it rescues at most once.

- [ ] **Step 2: Condition changes rhythm gameplay**

```ts
export interface ExpeditionConditionGameplayProfile {
  timingWindowMultiplier: number
  scoreMultiplier: number
  crowdDecayMultiplier: number
  disabledGroups: ConditionGroup[]
}
```

Band mapping:

```text
PA:          Good 1.00 | Worn 0.97 | Critical 0.90 | Breaking 0.82
Instruments: Good 1.00 | Worn 0.98 | Critical 0.92 | Breaking 0.85
Stage Gear:  Good 1.00 | Worn 1.05 | Critical 1.15 | Breaking 1.30 crowd-decay
```

`timingWindowMultiplier = clamp(PA * Instruments, 0.65, 1)`. `scoreMultiplier = clamp(Instruments, 0.8, 1)`. In `useHandleHit`, multiply the calculated hit window by timing multiplier and final score by score multiplier. In `useHandleMiss`, multiply active crowd decay by the Condition crowd-decay multiplier. `useRhythmGameScoring` passes the profile down.

At exactly condition `0`, add the group to `disabledGroups`; `PreGig` disables Start until repair/cannibalize/rescue. Values 1–19 remain playable.

- [ ] **Step 3: Complete the hidden-defect lifecycle**

```ts
REVEAL_EXPEDITION_DEFECT
TRIGGER_EXPEDITION_DEFECT

interface RevealExpeditionDefectPayload {
  defectId: string
  expectedDiscovered: false
  source: 'technician' | 'inspection' | 'full_service'
}

interface TriggerExpeditionDefectPayload {
  defectId: string
  expectedSeverity: 'minor' | 'major'
  roll: number
}
```

```ts
export const getDefectTriggerRisk = (defect: HiddenDefectState): number =>
  defect.severity === 'major' ? 0.35 : 0.15
```

Technician or `inspectionLevel >=1` Quick Check reveals one deterministic undiscovered defect; Full Service reveals all. At the next gig/travel wear seam, creator stamps one finite roll per eligible defect; reducer revalidates id/severity/risk. Minor trigger adds 5 wear to its group, major 10, then removes the defect. Undiscovered defects never appear in text/ARIA.

- [ ] **Step 4: Test and commit**

Prove vehicle modifier changes real van condition; insurance rescues once; worn/critical Condition changes actual hit/scoring/crowd behavior; 0 blocks gig; defect create→hidden→reveal→trigger/remove works.

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/expeditionCondition.test.js tests/node/expeditionInsurance.test.js tests/node/expeditionDefects.test.js \
  tests/node/minigameReducer.test.js tests/node/minigameReducer_regression.test.js
pnpm exec vitest run tests/ui/PreGig.test.jsx tests/ui/useRhythmGameScoring.test.jsx
pnpm run typecheck:core
git add src/domain/expedition src/context src/hooks src/scenes/PreGig.tsx tests
git commit -m "feat(expedition): make condition and defects gameplay relevant"
```

---

# G3-F1 — Production Crew effects and persistent consequences

**Amends:** G3 Tasks 4–8, 11–12.

**Files:**
- Modify: `src/domain/expedition/crew.ts`
- Modify: `src/domain/expedition/crewStress.ts`
- Modify: `src/domain/expedition/injuries.ts`
- Create: `src/domain/expedition/crewCareerSettlement.ts`
- Modify: `src/domain/expedition/repairs.ts`
- Modify: `src/domain/expedition/condition.ts`
- Modify: `src/domain/expedition/vehicle.ts`
- Modify: `src/domain/expedition/contracts.ts`
- Modify: `src/domain/expedition/pressure.ts`
- Modify: `src/domain/expedition/nodeIntel.ts`
- Modify: `src/context/careerActionCreators.ts`
- Modify: `src/context/reducers/careerReducer.ts`
- Modify: `src/scenes/RunSummary.tsx`
- Test: `tests/node/expeditionCrewStress.test.js`
- Test: `tests/node/expeditionRelationships.test.js`
- Test: `tests/node/expeditionInjuries.test.js`
- Test: `tests/node/expeditionCareer.test.js`

- [ ] **Step 1: Consume every aggregate role field**

```text
fieldRepairEfficiency -> repairs.ts
technicalWearMultiplier -> condition.ts
roadWearMultiplier -> G2-F2 vehicle/travel wear
contractRewardMultiplier -> contracts.ts
heatGainMultiplier -> pressure.ts positive Heat deltas
scoutIntelBonus -> G1-F3 node-Intel reveal
```

Each gets an app integration assertion before simulator use.

- [ ] **Step 2: Persist run consequences once**

```ts
export interface CrewCareerSettlement {
  crewId: string
  loyaltyDelta: number
  storyStepDelta: number
}

export const buildCrewCareerSettlement = (
  state: GameState,
  crewId: string
): CrewCareerSettlement
```

Rules: completed +5 loyalty; extracted +2; failed +0; ending crew stress >=90 subtracts 3; completed with stress <=39 adds another +2. Serious/critical **band-member** injuries persist at the same stage through a typed Career action derived from finalized Expedition state; strain/light clear between tours. Caller never supplies the next persistent stage.

Use the same `runId`/career-settlement idempotency barrier as Tour Tokens. `PREPARE_NEXT_EXPEDITION` clears run stress/traits but not Career loyalty/relationships/persistent serious injury.

- [ ] **Step 3: Test and commit**

Prove Technician repair effect, Driver road-wear effect, Manager contract effect, Security Heat effect, Scout Intel effect, loyalty once, serious injury persists after next-tour reset.

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/expeditionCrewStress.test.js tests/node/expeditionRelationships.test.js \
  tests/node/expeditionInjuries.test.js tests/node/expeditionCareer.test.js
pnpm run typecheck:core
git add src/domain/expedition src/context/careerActionCreators.ts src/context/reducers/careerReducer.ts src/scenes/RunSummary.tsx tests
git commit -m "feat(expedition): wire crew roles and career consequences"
```

---

# G3-F2 — Production-valid Expedition events

**Amends:** G3 Task 10; G4 Tasks 9, 11.

**Files:**
- Modify: `src/data/events/crew.ts`
- Modify: `src/data/events/pressure.ts`
- Modify: `src/data/events/rival.ts`
- Modify: `public/locales/en/events.json`
- Modify: `public/locales/de/events.json`
- Test: `tests/data/events/validation.test.js`
- Test: `tests/node/eventValidator.test.js`
- Test: `tests/node/eventEngine_resolver.test.js`
- Test: `tests/node/domain/eventResolver.test.js`

- [ ] **Step 1: Use the repository event contract exactly**

Every event has `id`, valid category/trigger/chance, `title`, `description`, and each option has `label`, `outcomeText`, plus validated effect/skillCheck. Every event `condition` is explicitly `(state: GameState) => boolean`.

Canonical skeleton:

```ts
{
  id: 'expedition_example',
  category: 'band',
  trigger: 'random',
  chance: 0.08,
  title: 'events:expedition_example.title',
  description: 'events:expedition_example.description',
  condition: (state: GameState) => state.expedition.status === 'active',
  options: [{
    id: 'accept',
    label: 'events:expedition_example.accept',
    outcomeText: 'events:expedition_example.acceptOutcome',
    effect: { type: 'expedition', delta: { heat: 3 } }
  }]
}
```

Do not author `resource:'fame'`. Use the existing supported Fame stat/event-delta path. Vehicle damage uses `stat:'van_condition'`; Expedition fields use the single G2/G3 typed Expedition event adapter.

- [ ] **Step 2: End-to-end validate each family**

For Crew, Authority/Pressure and Rival:

```text
validateGameEvent -> resolveEventChoice -> resolveEvent -> gameReducer(actions)
```

Assert both a legacy canonical effect and an Expedition effect commit.

- [ ] **Step 3: Run and commit**

```bash
pnpm run test:node
pnpm run test:additional
git add src/data/events public/locales/en/events.json public/locales/de/events.json tests
git commit -m "fix(events): make expedition events production valid"
```

---

# G4-F1 — Intent-based obligations and quest-credit settlement

**Amends:** G4 Tasks 3–5; G4-A Amendment 6.

**Files:**
- Modify: `src/types/contracts.d.ts`
- Modify: `src/domain/expedition/contracts.ts`
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/context/expeditionActionCreators.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Test: `tests/node/expeditionContracts.test.js`
- Test: `tests/node/expeditionReducer.test.js`
- Test: existing quest-progress test covering economy quest events

- [ ] **Step 1: Replace full `next` obligation payloads with signals**

```ts
export type ExpeditionObligationSignal =
  | { type: 'gig'; accuracy: number }
  | { type: 'arrival'; nodeId: string }
  | { type: 'rest' }
  | { type: 'heat'; heat: number }
  | { type: 'finale'; completed: boolean }

export interface RecordExpeditionObligationSignalPayload {
  signal: ExpeditionObligationSignal
  expectedRouteStep: number
}
```

Reducer validates the signal against current state and recomputes obligation progress/status with the canonical pure helpers. Caller cannot submit progress/status.

- [ ] **Step 2: Preserve canonical income quest events**

Hardened settlement still derives reward from the obligation template. Positive settlement emits the existing producers from `src/quests/producers/economyQuestEvents.ts`:

```ts
createMoneyEarnedQuestEvent({ amount: moneyDelta, source: 'expedition_contract' })
createFameGainedQuestEvent({ amount: fameDelta, source: 'expedition_contract' })
```

Use the current producer signatures when implementing; no direct reward write may omit the companion Quest event.

- [ ] **Step 3: Test and commit**

Forged completion stays active; valid signals complete; reward and quest credit occur once; replay does nothing.

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionContracts.test.js tests/node/expeditionReducer.test.js
pnpm run typecheck:core
git add src/types/contracts.d.ts src/domain/expedition/contracts.ts src/context tests
git commit -m "feat(expedition): derive obligations from canonical signals"
```

---

# G4-F2 — Typed Rival outcomes and Nemesis rule escalation

**Amends:** G4 Tasks 10–11.

**Files:**
- Modify: `src/types/career.d.ts`
- Modify: `src/domain/expedition/rivals.ts`
- Create: `src/domain/expedition/nemesis.ts`
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/context/careerActionCreators.ts`
- Modify: `src/context/reducers/careerReducer.ts`
- Modify: `src/context/useCareerDispatchActions.ts`
- Modify: `src/domain/expedition/pressureDirector.ts`
- Modify: `src/context/useMapGeneration.ts`
- Modify: `src/domain/expedition/finale.ts`
- Modify: the existing Brand Deal offer selector used by `src/hooks/postGig/handlers/useDealHandlers.ts`
- Test: `tests/node/expeditionRivals.test.js`
- Test: `tests/node/pressureDirector.test.js`
- Test: relevant existing Brand Deal eligibility test
- Test: `tests/node/mapGenerator.test.js`

- [ ] **Step 1: Add replay-safe persistent outcome action**

```ts
export interface RecordExpeditionRivalOutcomePayload {
  rivalId: string
  encounterId: string
  outcome: 'hostile_win' | 'hostile_loss' | 'respect' | 'alliance'
  expectedEncounterCount: number
}
```

Creator builds `encounterId = ${runId}:${nodeId}:${rivalId}`. Career stores newest 64 `settledRivalEncounterIds`. Reducer re-derives encounter id from current run/current node/current rival, validates expected count, then calls `applyRivalOutcome`. Unknown/stale/replayed action is identical-state no-op.

- [ ] **Step 2: Define Nemesis rule profile**

```ts
export interface NemesisRuleProfile {
  rivalEventWeightMultiplier: number
  rivalRouteWeight: number
  sponsorOffersBlocked: number
  forceRivalHuntTarget: boolean
  forceRivalFinale: boolean
}
```

```text
Level 0: 1.00 / 0.00 / 0 / false / false
Level 1: 1.25 / 0.08 / 0 / false / false
Level 2: 1.50 / 0.12 / 1 / false / false
Level 3: 1.75 / 0.18 / 1 / true  / false
Level 4: 2.00 / 0.25 / 2 / true  / true
```

Consumers: Rival event weighting; G1-F2 Rival route subtype weight; Brand Deal offer selector deterministically removes lowest-ranked eligible N **new offers** (never active deals); Rival Hunt reuses level>=3 rival; level 4 wins Finale priority as `rival_battle` unless run is already terminal.

- [ ] **Step 3: Cross-run test and commit**

Escalate same rival, next tour proves higher Rival route/event opportunity plus sponsor interference; old encounter replay no-op.

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionRivals.test.js tests/node/pressureDirector.test.js tests/node/mapGenerator.test.js
pnpm run typecheck:core
git add src/types/career.d.ts src/domain/expedition src/context src/hooks tests
git commit -m "feat(expedition): make nemesis escalation change tour rules"
```

---

# G4-F3 — Executable contextual finales

**Amends:** G4 Task 12; G4-A Amendment 7.

**Files:**
- Modify: `src/domain/expedition/finale.ts`
- Create: `src/data/expedition/finaleProfiles.ts`
- Modify: `src/context/reducers/gigReducer.ts`
- Modify: `src/hooks/usePreGigLogic.ts`
- Modify: `src/hooks/postGig/handlers/useContinueHandler.ts`
- Test: `tests/node/expeditionFinale.test.js`
- Test: `tests/hooks/preGig/usePreGigHandlers.test.tsx`
- Test: `tests/ui/postGigHandlerLogic.test.jsx`

- [ ] **Step 1: Define exact context and profiles**

```ts
export const buildFinaleContext = (state: GameState) => ({
  heat: finiteNumberOr(state.expedition.pressure.heat, 0),
  exposure: finiteNumberOr(state.expedition.pressure.exposure, 0),
  activeRivalRelationship: getCurrentRivalRelationship(state),
  activeRivalNemesisLevel: getCurrentRivalNemesisLevel(state),
  activeSponsorObligations: state.expedition.activeObligations.filter(
    item => item.sourceType === 'brandDeal' && item.status === 'active'
  ).length,
  aggregateCondition: getAggregateTechnicalCondition(state.expedition.condition)
})

export interface ExpeditionFinaleProfile {
  minimumAccuracy: number
  payoutMultiplier: number
  fameMultiplier: number
  technicalWearMultiplier: number
  heatOnSuccess: number
  rivalScoring: boolean
  rareRewardWeightMultiplier: number
}
```

```text
regional_headliner  55 /1.00/1.00/1.00/+0 /false/1.00
corporate_showcase  70 /1.15/1.05/1.00/+2 /false/1.05
rival_battle        65 /1.05/1.15/1.05/+5 /true /1.15
illegal_show        60 /1.10/1.20/1.10/+10/false/1.20
disaster_gig        50 /1.00/1.10/1.35/+3 /false/1.30
```

- [ ] **Step 2: Consume at existing Gig owners**

PreGig exposes minimum expectation/scoring context; PostGig applies payout/Fame/Heat/wear/rare-reward weights once. `rival_battle` enables Rival scoring. Existing `START_GIG` reset semantics clear transient Finale modifiers; `finaleType` stays in Expedition state for settlement/Legendary mapping.

- [ ] **Step 3: Five end-to-end tests and commit**

Every type differs from Regional Headliner in a player-facing pre/post mechanic; Disaster has highest technical wear; Rival enables Rival scoring.

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionFinale.test.js
pnpm exec vitest run tests/hooks/preGig/usePreGigHandlers.test.tsx tests/ui/postGigHandlerLogic.test.jsx
git add src/data/expedition/finaleProfiles.ts src/domain/expedition/finale.ts src/context/reducers/gigReducer.ts src/hooks tests
git commit -m "feat(expedition): make contextual finales mechanically distinct"
```

---

# G5-F1 — One production Region/Tour/Crew/Pressure composition path

**Amends:** G5 Tasks 5–8; all G6 strategy assumptions.

**Files:**
- Create: `src/domain/expedition/ruleProfile.ts`
- Modify: `src/data/expedition/regions.ts`
- Modify: `src/data/expedition/tourTypes.ts`
- Modify: `src/domain/expedition/vehicle.ts`
- Modify: `src/domain/expedition/condition.ts`
- Modify: `src/domain/expedition/repairs.ts`
- Modify: `src/domain/expedition/contracts.ts`
- Modify: `src/domain/expedition/pressure.ts`
- Modify: `src/domain/expedition/pressureDirector.ts`
- Modify: `src/domain/expedition/extraction.ts`
- Modify: `src/domain/expedition/rivals.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Modify: `src/context/useMapGeneration.ts`
- Create: `tests/node/expeditionRuleProfile.test.js`
- Test: `tests/node/expeditionRegionProfile.test.js`

- [ ] **Step 1: Define composed profile**

```ts
export interface ExpeditionRuleProfile {
  roadWearMultiplier: number
  technicalWearMultiplier: number
  repairCostMultiplier: number
  gigRewardMultiplier: number
  contractRewardMultiplier: number
  heatGainMultiplier: number
  rareRewardMultiplier: number
  completionMultiplier: number
  rivalEventWeightMultiplier: number
  startingHeat: number
  forcedRival: boolean
}

export const getExpeditionRuleProfile = (state: GameState): ExpeditionRuleProfile
```

Compose: Base → Region → Tour Type → selected Crew aggregate → Starter Perk → Tour Pressure → Nemesis. Clamp multipliers `0.25..3`, Heat `0..100`.

- [ ] **Step 2: One production consumer per field**

```text
roadWear -> G2-F2 travel settlement
technicalWear -> technical wear resolver
repairCost -> repair resolver
gigReward -> post-gig Expedition reward resolver
contractReward -> contract settlement
heatGain -> positive Heat deltas
rareReward -> reward-ledger rare roll
completion -> G1-F3 completed settlement
rivalEventWeight -> Pressure Director
startingHeat -> START_EXPEDITION once
forcedRival -> rival generation/selection at start
node weights/mapDepth/extraction windows -> Map generation/Tour Type directly
```

- [ ] **Step 3: App-side profile differences and commit**

Prove Industrial changes real road wear/repair; Festival technical wear/gig reward; Corporate contract/Heat; Underground Heat/rare rewards; Rival Hunt actually reuses/selects a Rival.

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionRuleProfile.test.js tests/node/expeditionRegionProfile.test.js
pnpm run typecheck:core
git add src/domain/expedition/ruleProfile.ts src/data/expedition src/domain/expedition src/context tests
git commit -m "feat(expedition): compose tour rules through production helpers"
```

---

# G5-F2 — Authoritative Ascension/Tour Pressure

**Amends:** G5 Tasks 8, 11.

**Files:**
- Modify: `src/domain/expedition/loadout.ts`
- Modify: `src/context/reducers/expeditionSanitizers.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Test: `tests/node/expeditionLoadout.test.js`
- Test: `tests/node/expeditionSanitizers.test.js`
- Test: `tests/node/expeditionReducer.test.js`

- [ ] **Step 1: Enforce in canonical validator**

Every `pressureModifierId` must exist, be unique, count <=3, satisfy its unlock requirement, and the list must be empty unless `career.ascensionUnlocked === true`. Reducer start reuses this validator. Sanitizer drops unknown/duplicate ids; malformed saved state never grants Ascension.

- [ ] **Step 2: Simulator profiles seed progression honestly**

Any G6 profile using Pressure sets `career.ascensionUnlocked:true` and required unlock markers **before** production loadout validation. No simulator bypass.

- [ ] **Step 3: Test and commit**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionLoadout.test.js tests/node/expeditionSanitizers.test.js tests/node/expeditionReducer.test.js
git add src/domain/expedition/loadout.ts src/context/reducers tests/node
git commit -m "fix(expedition): enforce ascension pressure at start"
```

---

# G5-F3 — 1–3 consequential between-tour decisions

**Amends:** G5 Task 12.

**Files:**
- Modify: `src/types/career.d.ts`
- Create: `src/data/expedition/betweenTourDecisions.ts`
- Create: `src/domain/expedition/betweenTour.ts`
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/context/careerActionCreators.ts`
- Modify: `src/context/reducers/careerReducer.ts`
- Modify: `src/context/useCareerDispatchActions.ts`
- Modify: `src/scenes/RunSummary.tsx`
- Create: `src/ui/expedition/BetweenTourDecisions.tsx`
- Test: `tests/node/expeditionBetweenTour.test.js`
- Test: `tests/ui/RunSummary.test.tsx`
- Test: `tests/golden-path/expeditionMetaLoop.test.js`

- [ ] **Step 1: Persist decision set by finalized run id**

```ts
export interface BetweenTourDecisionSet {
  runId: string
  decisionIds: string[]
  resolvedDecisionIds: string[]
}
```

`CareerState.betweenTour: BetweenTourDecisionSet | null`.

- [ ] **Step 2: Deterministically choose 1–3**

```ts
export const buildBetweenTourDecisionSet = (state: GameState): BetweenTourDecisionSet
```

Eligible families:

```text
crew_recovery -> serious/critical injury or selected Crew ended critical/breaking
rival_response -> Rival encounter or Nemesis-level change
sponsor_followup -> completed/failed sponsor obligation
starting_condition -> extracted/failed with vehicle or aggregate technical Condition <40
```

Sort by stable hash `${runId}:${decisionId}`, take `min(3, max(1, eligible.length))`. If none, use `tour_debrief` with `rest_band` / `network`; it only writes a next-run start-condition option, never free Cash/Fame.

- [ ] **Step 3: Intent-only resolution**

```ts
RESOLVE_BETWEEN_TOUR_DECISION { runId, decisionId, optionId }
```

Reducer re-evaluates definition/eligibility and derives effects. Initial choices:

```text
crew_recovery: pay rehab / give recovery time
rival_response: challenge / show respect / avoid territory
sponsor_followup: renew / renegotiate / walk away
starting_condition: repair before next tour / accept damaged start for a next-run risk-reward modifier
```

No payload carries money, loyalty, injury stage, unlock or next-state values.

- [ ] **Step 4: Gate Next Tour and test replay**

`PREPARE_NEXT_EXPEDITION` rejects until all decision ids resolved. Set generation and resolution survive save/reload/StrictMode without duplication.

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionBetweenTour.test.js tests/golden-path/expeditionMetaLoop.test.js
pnpm exec vitest run tests/ui/RunSummary.test.tsx
git add src/types/career.d.ts src/data/expedition/betweenTourDecisions.ts src/domain/expedition/betweenTour.ts src/context src/scenes/RunSummary.tsx src/ui/expedition/BetweenTourDecisions.tsx tests
git commit -m "feat(expedition): add between-tour decisions"
```

---

# G5-F4 — HQ becomes the meta hub instead of a parallel run-1 power shop

**Amends:** G5 Task 9 and the pre-Expedition balance objectives.

**Files:**
- Modify: `src/data/upgradeCatalog.ts`
- Modify: `src/data/hqItems.ts`
- Modify: `src/ui/bandhq/ExpeditionMetaTab.tsx`
- Modify: the existing BandHQ Upgrades/Shop catalog consumers
- Test: `tests/ui/BandHQ.test.jsx`
- Test: `tests/ui/ShopTab.test.jsx`
- Modify: `scripts/game-balance-simulation.mjs`

- [ ] **Step 1: Classify permanent vs tactical catalog roles**

```ts
export type ExpeditionCatalogRole =
  | 'run_gear'
  | 'meta_capability'
  | 'legacy_compatibility'

export const getExpeditionCatalogRole = (itemId: string): ExpeditionCatalogRole
```

Initial migration:

```text
hq_van_suspension / hq_van_sound_system / hq_van_storage -> meta_capability
canonical chassis/module capability access -> meta progression, selected in Tour Prep
shop consumables/instruments/merch -> run_gear
legacy aliases -> legacy_compatibility, hidden from active purchase catalog
```

Existing saves keep already-owned effects. Fresh Expedition careers cannot buy the migrated permanent items as ordinary run-1 Fame purchases; Garage/Workshop facility + unlock-set progression owns new access.

- [ ] **Step 2: Keep tactical purchases tactical**

Run-facing Shop/Upgrades can still sell consumable/current-run gear through existing owners. Permanent capability purchase appears in `ExpeditionMetaTab` and uses Tour Tokens/hardened journaled unlock-set purchase.

- [ ] **Step 3: Add balance corridor**

Report:

```text
firstMetaFacilityRun
firstPermanentExpeditionCapabilityRun
run1PermanentCapabilityPurchaseRate
```

Initial hypotheses: median facility run 2–4; permanent capability run 2–5; run-1 permanent rate <25%.

- [ ] **Step 4: Test and commit**

Fresh career cannot purchase migrated permanent power from old Fame catalog; legacy save retains owned effect; facility/unlock-set path exposes capability.

```bash
pnpm exec vitest run tests/ui/BandHQ.test.jsx tests/ui/ShopTab.test.jsx
pnpm run typecheck:core
git add src/data/upgradeCatalog.ts src/data/hqItems.ts src/ui/bandhq scripts/game-balance-simulation.mjs tests
git commit -m "feat(expedition): move permanent HQ power into meta progression"
```

---

# G5-F5 — Legendary rewards change rules

**Amends:** G5 Task 4. Numeric starter perks remain allowed; finale-earned Legendary rewards below replace the old multiplier-based Legendary mapping.

**Files:**
- Modify: `src/data/expedition/starterPerks.ts`
- Create: `src/data/expedition/legendaryRules.ts`
- Create: `src/domain/expedition/legendaryRules.ts`
- Modify: `src/types/expedition.d.ts`
- Modify: `src/domain/expedition/extraction.ts`
- Modify: `src/domain/expedition/contracts.ts`
- Modify: `src/domain/expedition/pressureDirector.ts`
- Modify: `src/domain/expedition/nodeIntel.ts`
- Modify: `src/domain/expedition/condition.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Test: `tests/node/expeditionLegendaryRules.test.js`
- Test: `tests/node/expeditionExtraction.test.js`
- Test: `tests/node/expeditionContracts.test.js`

- [ ] **Step 1: Map Finale → capability**

```text
regional_headliner -> expedition.legendary.safe_harbor
corporate_showcase -> expedition.legendary.the_fixer
rival_battle -> expedition.legendary.nemesis_key
illegal_show -> expedition.legendary.ghost_route
disaster_gig -> expedition.legendary.salvage_rights
```

Persist with the already hardened unlockManager + `ADD_UNLOCK` Run Summary barrier.

- [ ] **Step 2: Exact rule transforms**

Run state tracks once-per-run usage booleans.

```text
safe_harbor:
  after first successful major Gig at routeStep>=2, once/run add the immediately following step
  as an extra valid extraction window.

the_fixer:
  first obligation that would fail becomes `excused`; no reward, no failure penalty.

nemesis_key:
  Rival route nodes have Intel floor 2; once/run expose a deterministic shortcut edge from
  current node to nearest reachable Rival node.

ghost_route:
  first authority roadblock offers `go_underground`, replacing that roadblock resolution with
  an Underground Market encounter; +5 Heat, no bribe.

salvage_rights:
  first technical group that would move from >0 to 0 stops at 20 and receives a discovered
  major defect instead.
```

Owning reducer consumes the once-run use atomically with the transformed rule.

- [ ] **Step 3: Remove Legendary multiplier reward path and test rules**

Old finale reward mapping to multiplier-style starter profiles is not used for Legendary settlement. Tests assert actual extra extraction, excused contract, Rival Intel/shortcut, roadblock conversion and salvage transform exactly once.

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionLegendaryRules.test.js tests/node/expeditionExtraction.test.js tests/node/expeditionContracts.test.js
pnpm run typecheck:core
git add src/data/expedition src/domain/expedition src/types/expedition.d.ts src/context/reducers/expeditionReducer.ts tests
git commit -m "feat(expedition): make legendary rewards change rules"
```

---

# G6-F1 — Simulator proves shipped behavior

**Amends:** G6 Tasks 2–14. G6-A/G6-B v15 horizon, disjoint calibration/holdout and paired extraction cohorts remain mandatory.

**Files:**
- Modify: `scripts/game-balance-simulation.mjs`
- Modify: `scripts/utils/expedition-balance-profiles.mjs`
- Modify: `scripts/utils/expedition-balance-metrics.mjs`
- Modify: `scripts/game-balance-expedition-probe.mjs`
- Modify: `scripts/utils/balance-report-metadata.mjs`
- Modify: `tests/node/game-balance-simulation.test.js`
- Modify: `tests/node/expedition-balance-metrics.test.js`
- Modify: `tests/node/game-balance-expedition-probe.test.js`
- Modify: `tests/node/balanceSourceFiles.test.js`

- [ ] **Step 1: Import production helpers**

The simulator builds a production-valid state and uses:

```text
validateExpeditionLoadout
getExpeditionRuleProfile
calculateExpeditionSettlement
evaluateExpeditionFailure
getExpeditionConditionGameplayProfile
resolveExpeditionTravelWear
buildCrewCareerSettlement
getNemesisRuleProfile
resolveExpeditionFinaleType
getExpeditionFinaleProfile
```

No duplicate Region/Tour/Crew/Pressure/Condition/Legendary formulas.

- [ ] **Step 2: Full-build strategy profiles**

Each of six strategy profiles supplies valid setlist/equipment/module commitment, real manifest-backed cargo/Contraband, Crew, sponsor/contracts, perk, Fuel target and Cash reserve. Pressure profiles explicitly seed `career.ascensionUnlocked:true` and required unlocks before calling production validation.

- [ ] **Step 3: Add restored-design metrics**

```text
avgMeaningfulNodeChoices
rivalNodeReachRate
undergroundNodeReachRate
voluntaryExtractionRate
failureCauseDistribution
conditionGameplayPenaltyRunsPct
hiddenDefectRevealRate
crewRoleOutcomeDeltaByRole
cargoUtilizationPct
contrabandManifestUseRate
nemesisRuleActivationRate
betweenTourDecisionMean
legendaryRuleActivationRate
firstMetaFacilityRun
firstPermanentExpeditionCapabilityRun
run1PermanentCapabilityPurchaseRate
```

Meaningful node choice = at least two reachable connections with different effective route class/subtype or materially different revealed danger/reward tier.

- [ ] **Step 4: Structural blocking gates**

Block release evidence if:

```text
any strategy bypasses production loadout validation
simulator uses a modifier with no production consumer/app test
Rival Hunt cannot produce Rival route/finale behavior
Underground build cannot produce Underground route option
critical/breaking Condition never changes gameplay
Crew role is measured but has no production effect
failure causes collapse to bankruptcy only across the matrix
between-tour decisions can be skipped/replayed
Legendary reward changes only a numeric multiplier
paired Extract/Continue dominance reproduces in both cohorts
one strategy dominates safety+reward in calibration and holdout
```

- [ ] **Step 5: Report pacing hypotheses**

```text
Standard real run: 20–30 min
meaningful visited nodes: 7–9
travel economic share: 3–6%
run-1 permanent capability rate: <25%
no one Crew role in >80% successful builds unless explicitly profile-specific
Extraction chosen in a non-trivial band of paired states rather than 0% or 100%
```

Do not translate duration back into a fake day horizon.

- [ ] **Step 6: Final verification and commit**

```bash
pnpm run test:node
pnpm run test:ui
pnpm run test:additional
pnpm run typecheck:core
pnpm run typecheck
pnpm run deadcode:check
pnpm run simulate:balance
node scripts/game-balance-expedition-probe.mjs
git add scripts reports tests
git commit -m "test(balance): gate shipped expedition design"
```

---

## Final spec-coverage gate

Before G6 is green, every item requires both a named production owner and a test:

```text
[ ] Tour Prep commits setlist/equipment/modules/crew/real cargo/Contraband/sponsor/contracts/perk/budget/fuel
[ ] Standard target remains 7–9 meaningful nodes and Rival/Underground are route-visible classes
[ ] Fog has real 0→1→2 Scout/contact/perk producers
[ ] Extraction puts unsecured rare rewards genuinely at risk
[ ] Failure can originate from economy, mobility, band/crew, authority and high-risk contracts
[ ] Cargo capacity is derived from owned selected content
[ ] Condition changes active gameplay; zero disables until recovery
[ ] Hidden defects create→hide→reveal→trigger/resolve
[ ] Every Crew role changes a production system and persistent consequences survive appropriately
[ ] Obligations and Rival outcomes use authoritative typed transitions
[ ] Nemesis levels change opportunities/constraints across tours
[ ] Contextual Finales are mechanically distinct before and after the Gig
[ ] Region/Tour/Pressure values have production consumers before simulator use
[ ] Between tours contain 1–3 idempotent consequential decisions
[ ] HQ permanent progression is primarily Meta, not universal run-1 Fame power
[ ] Legendary finale rewards transform rules/choices rather than forming a percentage ladder
[ ] Simulator imports shipped rules and uses disjoint calibration/holdout evidence
```

A state field, registry value or report row without a player-facing/production consequence does **not** satisfy the approved design.
