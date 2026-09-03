# Roguelite Expedition Spec Fidelity + Execution Contract

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to apply this contract task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the approved Roguelite Expedition design as an executable implementation contract, close the remaining review gaps, and prevent the implementation from collapsing into a thin Expedition state layer over the legacy touring loop.

**Architecture:** This file is a binding amendment to `01-expedition-core-extraction.md` through `06-balance-simulator-recalibration.md`. It preserves the existing canonical state owners (`player`, `band`, `assets`, `social`, `unlocks`) while making Tour Prep commit a real run build, making route/Condition/Crew/Pressure systems change gameplay rather than telemetry only, and making meta rewards primarily unlock rules/options rather than permanent percentage power. Where this file conflicts with `00-review-hardening-contract.md` or an older child-plan snippet, this file is authoritative because it is the later design-fidelity correction; all trust-boundary protections in `00-review-hardening-contract.md` still apply unless this file tightens them.

**Tech Stack:** React 19, TypeScript 6, typed `GameAction`/`ActionTypes`, reducer/action-creator architecture, existing BandHQ/setlist/asset/stash/event/quest owners, deterministic `MapGenerator`, Vitest/Node/Playwright, balance simulator v15.

---

## Authority and mandatory execution order

The source-of-truth order is:

1. `docs/superpowers/specs/2026-09-03-roguelite-expedition-tour-design.md`
2. **this file**
3. `roguelite-expedition/00-review-hardening-contract.md`
4. `2026-09-03-roguelite-expedition-master-plan.md`
5. the numbered child plans

Apply the amendments at these gates before the gate may be marked green:

```text
G1-F1  Full pre-tour build commitment
G1-F2  Route-visible Rival/Underground node classes
G1-F3  Authoritative lifecycle, node-intel reveal, settlement and reward ledger
G1-F4  Multi-axis failure framework
G2-F1  Canonical cargo manifest tied to owned content
G2-F2  Travel wear + insurance + Condition gameplay + hidden-defect lifecycle
G3-F1  Crew effects and persistent crew consequences
G3-F2  Production-valid Expedition event families
G4-F1  Intent-based obligations + quest-credit settlement
G4-F2  Typed persistent rival outcomes + Nemesis rule escalation
G4-F3  Executable contextual-finale profiles
G5-F1  One production rule-profile composition path for Region/Tour/Crew/Pressure
G5-F2  Authoritative Ascension/Pressure validation
G5-F3  1–3 consequential between-tour decisions
G5-F4  Transition old HQ power purchasing into the Expedition meta economy
G5-F5  Legendary finale rewards become rule-changing capabilities
G6-F1  Simulator/release gates prove the shipped rules, not simulator-only state
```

No simulator metric may be accepted for behavior that lacks a production consumer and an app-side integration test.

---

# G1-F1 — Restore the full pre-tour build commitment

**Amends:** G1 Tasks 1, 4, 5, 6 and later Tour Prep extensions.

The approved loop is **Prepare a build → Commit → Survive → Extract**. The loadout must therefore bind the current setlist, band equipment, chassis/modules, real cargo/Contraband, crew, sponsor/contract, perk and starting budget/fuel choices instead of only storing Expedition-specific ids.

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

- [ ] **Step 1: Replace the narrow loadout with an explicit build commitment**

Add these exact types:

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

`setlistSongIds` contains the normalized ids from canonical `state.setlist`. `equipment` is a normalized snapshot of `band.members[].equipment`: iterate own slot keys in lexical order and accept a slot value as an item id when it is a non-empty string or a record with a non-empty string `id`; otherwise store `null`. `selectedTourbusModuleIds` is derived from the chosen `tourbus_chassis.slots[].installedModuleId`; callers may not invent module ids.

- [ ] **Step 2: Add pure snapshot and equality helpers**

`src/domain/expedition/buildCommitment.ts`:

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
): { valid: true; commitment: ExpeditionBuildCommitment } | { valid: false; reason: string }

export const expeditionBuildStillMatchesCanonicalOwners = (
  state: GameState
): boolean
```

Validation must prove:

```text
setlist: 1..current maximum, unique ids, every id is in current normalized state.setlist
member equipment: exact canonical snapshot for every current member with a stable id
modules: exact installed module ids of selected owned tourbus asset
contraband: stashKey exists; selected stacks are positive integers <= owned stacks;
            instanceId, when present, matches the selected stash record
merch: inventoryKey exists and quantity is positive integer <= canonical numeric quantity
sponsorDealId: null or currently active/eligible deal id from the existing Social/Brand Deal owner
startingFuelTarget: integer 0..100 and >= current player.van.fuel
cashReserveFloor: integer >= 0 and <= current player.money
```

The validator must reject `__proto__`, `constructor`, duplicate stash/merch references and any commitment that no longer matches the canonical owners.

- [ ] **Step 3: Make `START_EXPEDITION` revalidate the complete build**

The G1-A reducer-side validation from `00-review-hardening-contract.md` remains mandatory. `validateExpeditionLoadout(state, payload.loadout)` must call `validateExpeditionBuildCommitment`. The reducer derives the selected module ids/equipment/setlist again and rejects a stale action with the **identical state reference**.

Pre-tour fuel purchase is applied once at start using the repository's canonical refuel cost helper; the reducer derives the delta from current fuel and `startingFuelTarget`. The start is rejected if paying the fuel delta, insurance premium and any other start-time purchase would reduce money below `cashReserveFloor`.

- [ ] **Step 4: Lock build-owned surfaces while a run is active**

`handleSetSetlist` in `src/context/reducers/gigReducer.ts` must reject a setlist that differs from `expedition.loadout.build.setlistSongIds` while `expedition.status === 'active'`. The selected chassis/module configuration is likewise immutable during the run: the existing module install/remove reducer handlers return the original state when they target `expedition.loadout.activeTourbusAssetId` during an active Expedition.

This does **not** freeze repairs, consumables, Condition or inventory quantities; it only prevents changing the committed build identity mid-run.

- [ ] **Step 5: Make Tour Prep visibly commit every build axis**

`BuildCommitmentPanel` renders sections in this order:

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

Setlist/equipment/module sections reuse existing owners and are read-only summaries with deep-links/buttons to the existing BandHQ/assets surfaces while preparing. Cargo, sponsor, contract, perk, fuel and reserve are selectable in Tour Prep. The Start button uses only `validateExpeditionLoadout(state, candidate)`.

- [ ] **Step 6: Add full-build regressions**

Required assertions:

```text
valid full build starts
stale setlist -> START_EXPEDITION identical state
stale module set -> identical state
unowned contraband stack -> identical state
merch quantity above owned inventory -> identical state
fuel target below current fuel -> invalid
cash reserve violated by pre-tour spend -> identical state
active run -> SET_SETLIST with different ids is rejected
active run -> selected chassis module mutation is rejected
```

Run:

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/expeditionLoadout.test.js \
  tests/node/expeditionReducer.test.js \
  tests/node/gameReducer.test.js \
  tests/node/assetReducer.test.js
pnpm exec vitest run tests/ui/TourPrep.test.tsx
pnpm run typecheck:core
```

- [ ] **Step 7: Commit**

```bash
git add src/types/expedition.d.ts src/domain/expedition/buildCommitment.ts src/domain/expedition/loadout.ts src/context src/scenes/TourPrep.tsx src/ui/expedition tests
git commit -m "feat(expedition): commit the complete pre-tour build"
```

---

# G1-F2 — Preserve route-visible Rival and Underground node classes

**Amends:** G1 Task 7/8 and G5 Task 6.

Do not expand the repository-wide `MapNodeType` union merely to express Expedition-only variants. Keep `SPECIAL` as the structural type and add an Expedition subtype that is visible as a distinct route class.

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

- [ ] **Step 1: Define the subtype contract**

```ts
export type ExpeditionRouteNodeSubtype =
  | 'rival_encounter'
  | 'underground_market'

export interface ExpeditionMapNodeMeta {
  subtype: ExpeditionRouteNodeSubtype | null
}
```

Generated map nodes gain optional `expedition?: ExpeditionMapNodeMeta`. Legacy maps and normal `SPECIAL` nodes omit it.

- [ ] **Step 2: Extend Expedition generation weights**

The G5 generation options become:

```ts
export interface MapGenerationOptions {
  nodeTypeWeights?: {
    rest: number
    supply: number
    special: number
    rival: number
    underground: number
  }
}
```

`rival` and `underground` are portions of the `SPECIAL` budget, not additional probability on top of it. Enforce:

```ts
rival >= 0
underground >= 0
rival + underground <= special
rest + supply + special < 0.8
```

When a SPECIAL roll occurs, a second deterministic generator roll selects `rival_encounter`, `underground_market`, or ordinary Special according to the profile. No additional `Math.random()` is allowed.

Eligibility:

```text
rival_encounter: active/persistent rival exists OR selected tour type is rival_hunt
underground_market: region is underground OR build carries selected Contraband OR Black Market capability is unlocked
```

If a subtype is ineligible, its weight falls back to ordinary Special; do not reroll the whole node.

- [ ] **Step 3: Route arrivals through canonical owners**

`rival_encounter` queues the typed rival encounter path from G4-F2. `underground_market` opens `UndergroundMarketModal`, which reads canonical `band.stash`/inventory and uses the same typed cargo/purchase boundaries as Supply Stop; it may not mutate stash directly.

- [ ] **Step 4: Make Fog of War expose the route class**

At intel Level 0, the player sees `Rival` or `Underground` as the node class plus rough danger/reward. Level 1/2 add the same range/exact details defined by the existing intel contract. The subtype must never be hidden behind a generic `Special` label once the node itself is structurally visible.

- [ ] **Step 5: Test deterministic generation and display**

Pin one seed/profile yielding each subtype, rerun the same seed twice, and assert identical maps. Add UI assertions that both nodes render distinct labels/icons and that arrival triggers the correct route owner.

Run:

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/mapGenerator.test.js \
  tests/node/expeditionNodeIntel.test.js
pnpm exec vitest run tests/ui/MapNode.test.jsx tests/ui/useArrivalLogic.test.jsx
```

- [ ] **Step 6: Commit**

```bash
git add src/types/expedition.d.ts src/utils/mapGenerator src/context/useMapGeneration.ts src/domain/expedition/nodeIntel.ts src/components src/hooks/useArrivalLogic.ts src/ui/expedition/UndergroundMarketModal.tsx tests
git commit -m "feat(expedition): add rival and underground route nodes"
```

---

# G1-F3 — Make lifecycle, intel, settlement and reward ledger authoritative

**Amends:** G1 Tasks 4, 8, 9, 10, 11 and G1-A.

**Files:**
- Modify: `src/types/expedition.d.ts`
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/context/expeditionActionCreators.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Modify: `src/domain/expedition/extraction.ts`
- Modify: `src/domain/expedition/nodeIntel.ts`
- Modify: `src/context/useExpeditionDispatchActions.ts`
- Modify: `src/components/MapNodeView.tsx`
- Test: `tests/node/expeditionReducer.test.js`
- Test: `tests/node/expeditionExtraction.test.js`
- Test: `tests/node/expeditionNodeIntel.test.js`
- Test: `tests/ui/MapNode.test.jsx`

- [ ] **Step 1: Replace caller-selected terminal state with lifecycle intent**

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

Reducer/shared resolver derives the outcome kind:

```text
voluntary_extract -> extracted only if current routeStep is an extraction window
finale_success    -> completed only if current committed node is FINALE,
                     finaleType is resolved, and lastGigStats exists and failed !== true
system_failure    -> failed only when pendingFailure/reason is canonical for current state
```

A direct action may never choose `completed`, `extracted` or `failed` as an outcome value.

- [ ] **Step 2: Revalidate route arrival**

`RECORD_EXPEDITION_ARRIVAL` payload becomes:

```ts
export interface RecordExpeditionArrivalPayload {
  nodeId: string
  expectedRouteStep: number
}
```

Reducer requires all of:

```text
active Expedition
nodeId === state.player.currentNodeId
gameMap contains nodeId
nodeId not already visited
expectedRouteStep === expedition.routeStep
if routeStep > 0, previous visited node has a connection to nodeId
```

Only then append the id and increment `routeStep` by one. Fake ids, disconnected ids, stale steps and duplicate arrivals return the identical state.

- [ ] **Step 3: Define the executable intel reveal action**

```ts
REVEAL_NODE_INTEL: 'REVEAL_NODE_INTEL'

export interface RevealNodeIntelPayload {
  nodeId: string
  expectedLevel: NodeIntelLevel
  nextLevel: NodeIntelLevel
  source: 'scout_passive' | 'scout_recon' | 'social' | 'contact' | 'perk'
}
```

Reducer requires a real node, current stored level equal to `expectedLevel`, `nextLevel === expectedLevel + 1`, and `nextLevel <= 2`. It never decreases intel and stale replays are no-ops.

Concrete producers:

```text
Scout selected: when a map is committed, every structurally visible future node gets 0->1 once.
Scout Recon: once per route step, player chooses one visible future node and gets 1->2.
Social/contact/perk producers may call the same typed action later; they never mutate intelByNodeId directly.
```

Add `scoutReconUsedRouteSteps: number[]` to Expedition state and persist/sanitize it.

- [ ] **Step 4: Define the exact settlement and reward ledger**

```ts
export interface ExpeditionRewardLedgerEntry {
  id: string
  kind: 'module' | 'crew_contact' | 'contract' | 'legendary' | 'other'
  secured: boolean
  sourceId: string
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

Replace the two id arrays with `rewardLedger: ExpeditionRewardLedgerEntry[]`. Add typed actions:

```ts
ADD_EXPEDITION_REWARD { id, kind, sourceId }
SECURE_EXPEDITION_REWARD { id, expectedSecured: false }
```

The reducer validates unique ids and canonical known reward references when a registry exists. `completed` keeps all ledger entries; `extracted`/`failed` keep only entries already marked `secured`. Money/Fame retention remains the canonical Tour Type rate; completion applies the Tour Type completion multiplier only to **positive run-earned deltas**, never to the starting principal or losses.

- [ ] **Step 5: Guard `PREPARE_NEXT_EXPEDITION`**

The reducer accepts Next Tour only when `expedition.outcome !== null` and status is `extracted|completed|failed`. G5-F3 tightens this again to require the between-tour decision set to be resolved before resetting the run.

- [ ] **Step 6: Add hostile/replay tests**

Required cases:

```text
fake/disconnected arrival -> identical state
early extract outside extraction window -> identical state
early finale completion -> identical state
system_failure without canonical pending failure -> identical state
early PREPARE_NEXT_EXPEDITION -> identical state
Scout passive 0->1, Scout Recon 1->2, stale/replay no-op, save/reload preserved
rare reward lost on extraction/failure but kept on completed
secured reward retained on all terminal outcomes
completion multiplier never refunds losses or multiplies starting money/fame
```

Run:

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/expeditionReducer.test.js \
  tests/node/expeditionExtraction.test.js \
  tests/node/expeditionNodeIntel.test.js
pnpm exec vitest run tests/ui/MapNode.test.jsx
```

- [ ] **Step 7: Commit**

```bash
git add src/types/expedition.d.ts src/context src/domain/expedition src/components/MapNodeView.tsx tests
git commit -m "feat(expedition): harden lifecycle intel and rewards"
```

---

# G1-F4 — Implement the approved multi-axis failure framework

**Amends:** G1 Task 11 and adds a required integration contract for G2–G4.

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

- [ ] **Step 1: Define failure reasons and rescue state**

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

`ExpeditionState` gets `pendingFailure: PendingExpeditionFailure | null` and `endingCause: ExpeditionFailureReason | null`.

- [ ] **Step 2: Add one canonical evaluator**

```ts
export const evaluateExpeditionFailure = (
  state: GameState
): PendingExpeditionFailure | null
```

Initial thresholds/owners:

```text
bankruptcy: existing canonical bankruptcy check says insolvent
mobility_disabled: player.van.condition <= 0 and no canonical repair/cannibalize option remains
band_incapacitated: every band member injury is critical OR every member stamina <= 0
crew_collapse: every selected crew actor is breaking and no recovery option is available
harmony_collapse: band.harmony <= 0 after a crisis-producing action
                         (ordinary low Harmony alone does not auto-fail)
authority_crisis: Heat == 100 after an authority encounter and no safe escape is available
critical_contract_breach: a contract template explicitly has `tourEndingOnFailure: true`
```

A condition becoming risky opens the crisis first; only `accept_failure` or a failed/invalidated last rescue transitions to terminal failure.

- [ ] **Step 3: Add intent-only crisis actions**

```ts
OPEN_EXPEDITION_FAILURE_CRISIS { expectedRouteStep: number }
RESOLVE_EXPEDITION_FAILURE_CRISIS {
  reason: ExpeditionFailureReason
  optionId: ExpeditionRescueOption
  expectedRouteStep: number
}
```

The reducer re-runs `evaluateExpeditionFailure(state)`, requires the same reason/step and derives every cost/effect itself. `accept_failure` delegates to the G1-F3 system-failure finalizer. Cross-domain costs use existing canonical owners; no payload carries money, Condition or reward deltas.

- [ ] **Step 4: Register required later-gate rescues**

G2 must provide `field_repair`/`cannibalize` for mobility/Condition. G3 must provide `rest` or crew-specific recovery for crew/band crises. G4 must provide `pay_escape`/`sacrifice_reward` for authority or critical contracts. `extract_now` is offered only when the current state satisfies the canonical extraction rule.

- [ ] **Step 5: Test at least five terminal families**

Golden paths must cover bankruptcy, vehicle/mobility, injury/crew, authority Heat and tour-ending contract breach. Each test proves crisis opens first where a rescue exists, the rescue changes state without terminal failure, and `accept_failure` produces exactly one `failed` settlement with the correct `endingCause`.

Run:

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/expeditionFailure.test.js \
  tests/node/expeditionReducer.test.js
pnpm exec vitest run tests/ui/FailureCrisisDialog.test.tsx
```

- [ ] **Step 6: Commit**

```bash
git add src/types/expedition.d.ts src/domain/expedition/failure.ts src/context src/ui/expedition/FailureCrisisDialog.tsx tests
git commit -m "feat(expedition): add multi-axis failure crises"
```

---

# G2-F1 — Replace abstract cargo counters with a canonical owned-content manifest

**Amends:** G2 Tasks 1, 3, 4, 11 and G2-A Amendment 4.

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

- [ ] **Step 1: Define the run manifest**

```ts
export interface ExpeditionCargoManifest {
  spareParts: number
  supplies: number
  merch: ExpeditionMerchSelection[]
  contraband: ExpeditionContrabandSelection[]
  technicalGearSlots: number
}
```

Slot cost is deterministic for v1:

```text
spare part: 1 slot each
supply: 1 slot each
merch: ceil(quantity / 25) slots per inventory key
contraband: selected stacks, 1 slot per stack unless hidden compartment capacity covers it
technicalGearSlots: one slot for each band member whose canonical `equipment` object has at least one non-null/non-false own entry
```

`hiddenContrabandSlots` reduces visible cargo usage for Contraband only; it never creates items.

- [ ] **Step 2: Derive usage from canonical owners**

```ts
export const materializeExpeditionCargo = (
  state: GameState,
  loadout: ExpeditionLoadout
): ExpeditionCargoManifest | null

export const getExpeditionCargoUsed = (
  cargo: ExpeditionCargoManifest,
  hiddenContrabandSlots: number
): number
```

`materializeExpeditionCargo` returns `null` when selected merch/Contraband is not actually owned. The hardened Start reducer calls it again; caller-supplied slot counters are removed from the loadout.

- [ ] **Step 3: Keep active-run content inside the budget**

All Expedition-only Contraband use checks that the stash item is selected in `expedition.cargo.contraband`. Supply Stop purchases update the manifest through the hardened `ADD_EXPEDITION_CARGO` intent path and capacity is re-derived in the reducer. If an event confiscates selected Contraband, update both canonical stash state through the existing event owner and the manifest reference in the same resolved action sequence.

- [ ] **Step 4: Add ownership/capacity tests**

Required cases:

```text
real stash item omitted from manifest cannot be used by Expedition encounter
selected stack count above stash ownership -> start rejected
selected merch above inventory quantity -> rejected
technical equipment consumes capacity automatically
hidden compartment hides only eligible Contraband slots
Supply Stop cannot overflow capacity
stale purchase cannot reuse old slot count
```

Run:

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/expeditionCargo.test.js \
  tests/node/expeditionLoadout.test.js \
  tests/node/expeditionReducer.test.js
pnpm exec vitest run tests/ui/TourPrep.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/types/expedition.d.ts src/domain/expedition/cargo.ts src/domain/expedition/loadout.ts src/context src/ui tests
git commit -m "feat(expedition): bind cargo to owned tour content"
```

---

# G2-F2 — Make travel wear, Condition, hidden defects and insurance affect real gameplay

**Amends:** G2 Tasks 2, 5–9 and fixes the wrong travel-settlement owner.

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
- Modify: rhythm-game timing/crowd calculation owner selected by repository search at implementation time, after reading its nested `AGENTS.md`
- Test: `tests/node/expeditionCondition.test.js`
- Test: `tests/node/expeditionInsurance.test.js`
- Test: `tests/node/expeditionDefects.test.js`
- Test: `tests/logic/ampCalibrationReducer.test.js`
- Test: existing travel-minigame reducer test covering `handleCompleteTravelMinigame`
- Test: `tests/ui/PreGig.test.jsx`

- [ ] **Step 1: Put road wear at the real travel settlement owner**

Production `handleCompleteTravelMinigame` lives in `src/context/reducers/minigameReducer.ts` and remains the owner that commits `player.van.condition`.

Add:

```ts
export interface ExpeditionTravelWearInput {
  baseConditionLoss: number
  vehicleMultiplier: number
  crewMultiplier: number
  regionMultiplier: number
  pressureMultiplier: number
}

export const resolveExpeditionTravelWear = (
  input: ExpeditionTravelWearInput
): number =>
  Math.max(0, Math.round(
    input.baseConditionLoss *
    input.vehicleMultiplier *
    input.crewMultiplier *
    input.regionMultiplier *
    input.pressureMultiplier
  ))
```

The minigame reducer computes its existing canonical damage first, then replaces only the Expedition portion with the composed loss exactly once before committing `player.van.condition`. G5-F1 supplies the final composed profile; before then absent modifiers are `1`.

Insurance is applied immediately after the canonical post-wear value is known. Every other canonical Condition mutation that can move a covered group from `>0` to `0` must call the same `resolveInsuranceProtection` helper before commit.

- [ ] **Step 2: Define Condition → gameplay rules**

```ts
export interface ExpeditionConditionGameplayProfile {
  timingWindowMultiplier: number
  scoreMultiplier: number
  crowdDecayMultiplier: number
  disabledGroups: ConditionGroup[]
}

export const getExpeditionConditionGameplayProfile = (
  condition: ExpeditionConditionState
): ExpeditionConditionGameplayProfile
```

Initial deterministic mapping:

```text
PA band        Good 1.00 | Worn 0.97 | Critical 0.90 | Breaking 0.82
Instruments    Good 1.00 | Worn 0.98 | Critical 0.92 | Breaking 0.85
Stage Gear     Good 1.00 | Worn 1.05 | Critical 1.15 | Breaking 1.30 crowd-decay multiplier
```

`timingWindowMultiplier = PA * Instruments` and clamps to `0.65..1`. `scoreMultiplier` uses the Instruments value and clamps to `0.8..1`. At condition `0`, that group is in `disabledGroups`; PreGig disables Start Gig until the player repairs, cannibalizes, or uses an explicitly available rescue. Condition 1–19 remains playable as approved.

The rhythm-game path consumes these multipliers in addition to existing band/equipment modifiers; do not overwrite existing `band.performance` effects.

- [ ] **Step 3: Define a complete hidden-defect lifecycle**

```ts
REVEAL_EXPEDITION_DEFECT: 'REVEAL_EXPEDITION_DEFECT'
TRIGGER_EXPEDITION_DEFECT: 'TRIGGER_EXPEDITION_DEFECT'

export interface RevealExpeditionDefectPayload {
  defectId: string
  expectedDiscovered: false
  source: 'technician' | 'inspection' | 'full_service'
}

export interface TriggerExpeditionDefectPayload {
  defectId: string
  expectedSeverity: 'minor' | 'major'
  roll: number
}
```

Pure helpers:

```ts
export const getRevealableDefectIds = (state: GameState): string[]
export const getDefectTriggerRisk = (defect: HiddenDefectState): number =>
  defect.severity === 'major' ? 0.35 : 0.15
```

Reveal rules:

```text
selected Technician: reveal the first deterministic undiscovered defect after each inspection action
vehicle/module inspectionLevel >= 1: Quick Check reveals one
Full Service: reveals all current defects
```

Trigger checks occur only at the next canonical travel/gig wear settlement after a defect exists. Action creator stamps one finite roll; reducer revalidates current defect/severity and recomputes risk. Minor trigger adds +5 wear to its group; major adds +10. A triggered defect is removed after applying the consequence. Undiscovered defects remain absent from text/ARIA.

- [ ] **Step 4: Add production integration tests**

Required cases:

```text
roadWearMultiplier changes committed player.van.condition
insurance rescues a covered zero exactly once
worn/critical technical condition changes timing/score/crowd profile
condition 0 blocks gig until a valid repair/rescue
improvised repair creates hidden defect
Technician/inspection reveals it without leaking before reveal
fixed roll triggers it once and removes it
```

Run the focused Node/UI tests plus `pnpm run typecheck:core`.

- [ ] **Step 5: Commit**

```bash
git add src/domain/expedition src/context src/hooks/usePreGigLogic.ts src/scenes/PreGig.tsx tests
git commit -m "feat(expedition): make condition and defects gameplay-relevant"
```

---

# G3-F1 — Wire Crew roles into production and persist real consequences

**Amends:** G3 Tasks 4–8, 11, 12.

**Files:**
- Modify: `src/domain/expedition/crew.ts`
- Modify: `src/domain/expedition/crewStress.ts`
- Modify: `src/domain/expedition/injuries.ts`
- Modify: `src/domain/expedition/relationships.ts`
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

- [ ] **Step 1: Consume every `getCrewAggregateEffects` field in the app**

Canonical composition points:

```text
fieldRepairEfficiency      -> repairs.ts
technicalWearMultiplier    -> condition.tsoadWearMultiplier         -> vehicle/travel wear resolver
contractRewardMultiplier   -> contracts.ts settlement
heatGainMultiplier         -> pressure.ts positive Heat deltas
scoutIntelBonus            -> nodeIntel / Scout passive reveal
```

The simulator may import the same helpers only after these production consumers have integration coverage.

- [ ] **Step 2: Define run→career crew settlement**

```ts
export interface CrewCareerSettlement {
  crewId: string
  loyaltyDelta: number
  storyStepDelta: number
  persistentInjury: InjuryStage | null
}

export const buildCrewCareerSettlement = (
  state: GameState,
  crewId: string
): CrewCareerSettlement
```

Initial rules:

```text
completed run: +5 loyalty
voluntary extraction: +2 loyalty
failed run: 0 loyalty
ending stress >= 90: -3 loyalty
ending stress <= 39 and completed: additional +2 loyalty
band-member injury serious/critical: persist same stage; strain/light clear between tours
```

Crew loyalty and story updates use the existing typed Career actions. Persistent band-member injuries are written through a new typed Career action whose reducer revalidates the member id and derives the persisted stage from finalized Expedition state; the caller may not choose the stage.

- [ ] **Step 3: Ensure Run Summary settles crew consequences once**

The same finalized `runId`/`settledRunIds` barrier used for career rewards owns crew consequence settlement. Reload/StrictMode must not apply loyalty or injury twice.

- [ ] **Step 4: Test each role and persistence path**

At minimum prove Technician changes a repair, Driver changes real vehicle wear, Manager changes a contract reward, Security changes Heat gain, Scout changes node intel, and serious injury survives `PREPARE_NEXT_EXPEDITION` while run stress resets.

- [ ] **Step 5: Commit**

```bash
git add src/domain/expedition src/context/careerActionCreators.ts src/context/reducers/careerReducer.ts src/scenes/RunSummary.tsx tests
git commit -m "feat(expedition): wire crew roles and career consequences"
```

---

# G3-F2 — Make every new Expedition event valid production data

**Amends:** G3 Task 10 and G4 Tasks 9/11.

The repository validator requires `title`, `description`, option `label`, option `outcomeText`, supported triggers/effects, and explicit typed condition callbacks. `resource: 'fame'` is not a supported Fame path; use the existing `stat`/event-delta route that emits Fame quest credit.

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

- [ ] **Step 1: Use one mandatory event shape**

Every new event follows:

```ts
{
  id: 'expedition_...',
  category: 'band',
  trigger: 'random',
  chance: 0.08,
  title: 'events:expedition_....title',
  description: 'events:expedition_....description',
  condition: (state: GameState) => /* strict boolean */,
  options: [{
    id: '...',
    label: 'events:expedition_....option',
    outcomeText: 'events:expedition_....outcome',
    effect: { /* validated existing or expedition effect */ }
  }]
}
```

All nested `condition` callbacks explicitly type `state: GameState`.

- [ ] **Step 2: Correct unsupported effects**

Money remains `resource: 'money'` only where current event engine supports it. Fame uses the engine's supported Fame stat/delta path; do not author `resource: 'fame'`. Vehicle condition uses `stat: 'van_condition'`. Expedition state uses the single typed `type: 'expedition'` adapter from G2 Task 10/G3 Task 9.

- [ ] **Step 3: Add one end-to-end test per event family**

For Crew, Pressure/Authority and Rival data, execute:

```text
validateGameEvent(event)
-> resolveEventChoice(option, state)
-> resolveEvent(option, state, fixedClock)
-> gameReducer for every returned action
```

Assert at least one canonical legacy effect and one Expedition effect are both committed.

- [ ] **Step 4: Commit**

```bash
git add src/data/events public/locales/en/events.json public/locales/de/events.json tests
git commit -m "fix(events): make expedition events production-valid"
```

---

# G4-F1 — Make obligation progress intent-based and preserve quest credit

**Amends:** G4 Tasks 3–5 and G4-A Amendment 6.

**Files:**
- Modify: `src/types/contracts.d.ts`
- Modify: `src/domain/expedition/contracts.ts`
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/context/expeditionActionCreators.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Modify: `src/quests/producers/economyQuestEvents.ts` only for import/use, not API changes
- Test: `tests/node/expeditionContracts.test.js`
- Test: `tests/node/expeditionReducer.test.js`
- Test: existing quest-progress reducer test covering money/fame events

- [ ] **Step 1: Delete caller-materialized `next` obligation updates**

Replace `UPDATE_EXPEDITION_OBLIGATION` with:

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

The reducer validates the signal against current canonical state where applicable and recomputes every obligation through `recordObligationGig`, `recordObligationArrival` and `evaluateObligationAtFinale`. A caller cannot supply progress/status.

- [ ] **Step 2: Keep settlement canonical and emit quest events**

The hardened resolve action still carries only obligation id + expected status. The reducer derives the canonical reward/penalty. When money/fame is positive, the owning dispatch/resolution path must also emit:

```ts
createMoneyEarnedQuestEvent({ amount: moneyDelta, source: 'expedition_contract' })
createFameGainedQuestEvent({ amount: fameDelta, source: 'expedition_contract' })
```

Use the exact current producer signatures from `src/quests/producers/economyQuestEvents.ts`; do not bypass quest progression by directly adding income without the companion event.

- [ ] **Step 3: Add forged-completion and quest-credit tests**

A direct action cannot set a contract complete without the qualifying signal. Replay settlement pays nothing. A valid completed contract increases money/fame once and advances the corresponding quest-progress event once.

- [ ] **Step 4: Commit**

```bash
git add src/types/contracts.d.ts src/domain/expedition/contracts.ts src/context tests/node/expeditionContracts.test.js tests/node/expeditionReducer.test.js
git commit -m "feat(expedition): derive obligation progress from canonical signals"
```

---

# G4-F2 — Persist Rival outcomes through a typed boundary and make Nemesis levels change rules

**Amends:** G4 Tasks 10/11.

**Files:**
- Modify: `src/types/career.d.ts`
- Create: `src/domain/expedition/nemesis.ts`
- Modify: `src/domain/expedition/rivals.ts`
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/context/careerActionCreators.ts`
- Modify: `src/context/reducers/careerReducer.ts`
- Modify: `src/context/useCareerDispatchActions.ts`
- Modify: `src/domain/expedition/pressureDirector.ts`
- Modify: sponsor/Brand Deal eligibility selector used by the existing post-gig deal flow
- Modify: `src/context/useMapGeneration.ts`
- Modify: `src/domain/expedition/finale.ts`
- Test: `tests/node/expeditionRivals.test.js`
- Test: `tests/node/pressureDirector.test.js`
- Test: relevant Brand Deal eligibility test
- Test: `tests/node/mapGenerator.test.js`

- [ ] **Step 1: Add a replay-safe Rival outcome action**

```ts
export interface RecordExpeditionRivalOutcomePayload {
  rivalId: string
  encounterId: string
  outcome: 'hostile_win' | 'hostile_loss' | 'respect' | 'alliance'
  expectedEncounterCount: number
}
```

`encounterId` is derived by the creator as `${runId}:${nodeId}:${rivalId}` and is stored in a bounded `career.settledRivalEncounterIds` array (newest 64). Reducer requires the current run/rival/node to match, validates the id with the same deterministic builder, verifies `expectedEncounterCount`, and then calls `applyRivalOutcome`. Replays and unknown rivals are identical-state no-ops.

- [ ] **Step 2: Define exact Nemesis profiles**

```ts
export interface NemesisRuleProfile {
  rivalEventWeightMultiplier: number
  rivalRouteWeight: number
  sponsorOffersBlocked: number
  forceRivalHuntTarget: boolean
  forceRivalFinale: boolean
}

export const getNemesisRuleProfile = (level: number): NemesisRuleProfile
```

Initial profile:

```text
0: 1.00, 0.00, 0, false, false
1: 1.25, 0.08, 0, false, false
2: 1.50, 0.12, 1, false, false
3: 1.75, 0.18, 1, true,  false
4: 2.00, 0.25, 2, true,  true
```

- [ ] **Step 3: Consume the Nemesis profile in production**

```text
pressureDirector: multiply only rival-tag event weighting
map generation: add rival_encounter subtype weight up to profile.rivalRouteWeight
Brand Deal offer selection: deterministically remove the lowest-ranked eligible N offers after normal eligibility, never active deals
Rival Hunt: level >=3 reuses that rival as the target
finale resolver: level 4 wins priority and resolves rival_battle unless the run is already terminal
```

The same rival at a higher level must change at least two player opportunities/constraints.

- [ ] **Step 4: Add cross-run tests**

Run 1 escalates a rival; prepare next tour; Run 2 with level 2+ must show increased Rival route/event availability and sponsor interference. Replay of the old encounter id changes nothing.

- [ ] **Step 5: Commit**

```bash
git add src/types/career.d.ts src/domain/expedition src/context src/hooks tests
git commit -m "feat(expedition): make nemesis escalation change tour rules"
```

---

# G4-F3 — Give every contextual finale an executable gameplay profile

**Amends:** G4 Task 12 and G4-A Amendment 7.

**Files:**
- Modify: `src/domain/expedition/finale.ts`
- Create: `src/data/expedition/finaleProfiles.ts`
- Modify: `src/context/reducers/gigReducer.ts`
- Modify: `src/hooks/usePreGigLogic.ts`
- Modify: `src/hooks/postGig/handlers/useContinueHandler.ts`
- Test: `tests/node/expeditionFinale.test.js`
- Test: `tests/hooks/preGig/usePreGigHandlers.test.tsx`
- Test: `tests/ui/postGigHandlerLogic.test.jsx`

- [ ] **Step 1: Define the missing context builder**

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
```

- [ ] **Step 2: Define exact finale profiles**

```ts
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

Registry:

```text
regional_headliner  min 55, payout 1.00, fame 1.00, wear 1.00, heat +0, rival false, rare 1.00
corporate_showcase  min 70, payout 1.15, fame 1.05, wear 1.00, heat +2, rival false, rare 1.05
rival_battle        min 65, payout 1.05, fame 1.15, wear 1.05, heat +5, rival true,  rare 1.15
illegal_show        min 60, payout 1.10, fame 1.20, wear 1.10, heat +10,rival false, rare 1.20
disaster_gig        min 50, payout 1.00, fame 1.10, wear 1.35, heat +3, rival false, rare 1.30
```

- [ ] **Step 3: Compose at existing gig owners**

`START_GIG`/PreGig reads the persisted `finaleType` only for the Finale node and exposes the profile to the existing scoring/setup path. PostGig applies payout/Fame/Heat/wear/rare-reward effects once. Existing gig reset semantics clear transient finale modifiers when the next gig begins; no second gig-state machine is introduced.

- [ ] **Step 4: Add five end-to-end tests**

Every finale type must alter at least one PreGig/scoring constraint and one PostGig consequence versus `regional_headliner`. `rival_battle` must activate rival scoring; `disaster_gig` must produce the largest technical-wear multiplier.

- [ ] **Step 5: Commit**

```bash
git add src/data/expedition/finaleProfiles.ts src/domain/expedition/finale.ts src/context/reducers/gigReducer.ts src/hooks tests
git commit -m "feat(expedition): make contextual finales mechanically distinct"
```

---

# G5-F1 — Compose Region/Tour/Crew/Pressure through one production rule profile

**Amends:** G5 Tasks 5–8 and all G6 assumptions about profile behavior.

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
- Test: `tests/node/expeditionRegionProfile.test.js`
- Test: `tests/node/expeditionCareer.test.js`
- Create: `tests/node/expeditionRuleProfile.test.js`

- [ ] **Step 1: Define one composed profile**

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

Composition order is deterministic and multiplicative only where the child registries already define multipliers:

```text
base 1/0/false
-> Region profile
-> Tour Type profile
-> selected Crew aggregate
-> Starter Perk profile
-> Tour Pressure profile
-> Nemesis profile where applicable
```

Clamp every multiplier to `0.25..3`, starting Heat to `0..100`.

- [ ] **Step 2: Name one canonical production consumer for every field**

```text
roadWearMultiplier       -> G2-F2 travel settlement
technicalWearMultiplier  -> G2 wear calculation
repairCostMultiplier     -> professional/field repair price resolver
gigRewardMultiplier      -> canonical post-gig Expedition reward resolver
contractRewardMultiplier -> contract settlement
heatGainMultiplier       -> positive Heat deltas
rareRewardMultiplier     -> reward-ledger rare roll weight
completionMultiplier     -> G1-F3 completed settlement
rivalEventWeightMultiplier -> pressure Director
startingHeat             -> START_EXPEDITION reducer once
forcedRival              -> rival generation/selection at START_EXPEDITION
node weights/map depth/extraction windows remain direct Region/Tour generation inputs
```

The simulator is forbidden to apply these fields itself outside the imported production helpers.

- [ ] **Step 3: Add app-side profile-difference tests**

Use two production-valid states and prove Industrial changes real road wear/repair cost, Festival changes real technical wear/gig reward, Corporate changes contract/Heat behavior, Underground changes Heat/rare reward, and `rival_hunt` actually selects/reuses a rival.

- [ ] **Step 4: Commit**

```bash
git add src/domain/expedition/ruleProfile.ts src/data/expedition src/domain/expedition src/context tests/node/expeditionRuleProfile.test.js tests/node/expeditionRegionProfile.test.js
git commit -m "feat(expedition): compose tour rules through production helpers"
```

---

# G5-F2 — Enforce Ascension and Tour Pressure in the canonical loadout boundary

**Amends:** G5 Task 8/11.

**Files:**
- Modify: `src/domain/expedition/loadout.ts`
- Modify: `src/context/reducers/expeditionSanitizers.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Test: `tests/node/expeditionLoadout.test.js`
- Test: `tests/node/expeditionSanitizers.test.js`
- Test: `tests/node/expeditionReducer.test.js`

- [ ] **Step 1: Enforce exact rules**

`validateExpeditionLoadout` rejects pressure modifiers unless:

```text
every id exists in TOUR_PRESSURE_MODIFIERS
ids are unique
count <= 3
count == 0 OR state.career.ascensionUnlocked === true
each modifier's own unlock requirement is satisfied through isExpeditionCapabilityUnlocked
```

The reducer-side `START_EXPEDITION` reuses the same validator. Persisted malformed/duplicate/unknown ids sanitize to an empty array; saves may not grant Ascension access.

- [ ] **Step 2: Seed simulator late-career profiles honestly**

G6 profiles using pressure modifiers must explicitly set `career.ascensionUnlocked: true` and required unlock markers before calling production validation. The simulator may never bypass this gate.

- [ ] **Step 3: Add direct and save-load tests**

Pre-Ascension modifier, fourth modifier, duplicate, unknown id and forged direct START all return invalid/identical state. A properly seeded late-career profile starts.

- [ ] **Step 4: Commit**

```bash
git add src/domain/expedition/loadout.ts src/context/reducers/expeditionSanitizers.ts src/context/reducers/expeditionReducer.ts tests/node
git commit -m "fix(expedition): enforce ascension pressure at start"
```

---

# G5-F3 — Add the approved 1–3 consequential between-tour decisions

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

- [ ] **Step 1: Add persistent decision state keyed by finalized run**

```ts
export interface BetweenTourDecisionSet {
  runId: string
  decisionIds: string[]
  resolvedDecisionIds: string[]
}

// CareerState
betweenTour: BetweenTourDecisionSet | null
```

- [ ] **Step 2: Deterministically choose 1–3 eligible decisions**

```ts
export const buildBetweenTourDecisionSet = (
  state: GameState
): BetweenTourDecisionSet | null
```

Eligibility families:

```text
crew_recovery       -> serious/critical persistent injury or selected crew ended critical/breaking
rival_response      -> rival encounter occurred or Nemesis level changed
sponsor_followup    -> completed/failed sponsor obligation exists
starting_condition  -> failed/extracted run ended with vehicle or technical Condition < 40
```

Sort eligible ids by a stable hash of `${runId}:${decisionId}` and take `min(3, max(1, eligible.length))`. If none are eligible, return a single `tour_debrief` decision with choices `rest_band` / `network` that create only next-run option state, not free money.

- [ ] **Step 3: Resolve through intent-only typed actions**

```ts
RESOLVE_BETWEEN_TOUR_DECISION {
  runId: string
  decisionId: string
  optionId: string
}
```

Reducer looks up the canonical definition, re-evaluates eligibility from finalized state/career, derives effects and records the decision id exactly once. No payload carries money, loyalty, injury stage, unlock or next-run values.

Initial choices must include at least:

```text
crew_recovery: pay rehab / give recovery time
rival_response: challenge / show respect / avoid territory
sponsor_followup: renew / renegotiate / walk away
starting_condition: repair before next tour / accept damaged start for one extra Tour Token opportunity modifier
```

- [ ] **Step 4: Gate Next Tour**

`PREPARE_NEXT_EXPEDITION` is rejected until `career.betweenTour` is null or all decision ids are resolved. Once the last decision settles, Run Summary enables `Next Tour`. Save/reload and StrictMode cannot regenerate or replay the set.

- [ ] **Step 5: Run golden path**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/expeditionBetweenTour.test.js \
  tests/golden-path/expeditionMetaLoop.test.js
pnpm exec vitest run tests/ui/RunSummary.test.tsx
```

- [ ] **Step 6: Commit**

```bash
git add src/types/career.d.ts src/data/expedition/betweenTourDecisions.ts src/domain/expedition/betweenTour.ts src/context src/scenes/RunSummary.tsx src/ui/expedition/BetweenTourDecisions.tsx tests
git commit -m "feat(expedition): add between-tour decisions"
```

---

# G5-F4 — Move HQ away from the automatic Day-1 numeric purchase loop

**Amends:** G5 Task 9 and the balance objectives inherited from the pre-Expedition report.

**Files:**
- Modify: `src/data/upgradeCatalog.ts`
- Modify: `src/data/hqItems.ts`
- Modify: `src/ui/bandhq/UpgradesTab.tsx` or its current catalog consumer
- Modify: `src/ui/bandhq/ShopTab.tsx`
- Modify: `src/ui/bandhq/ExpeditionMetaTab.tsx`
- Test: `tests/node/upgradeCatalog.test.js`
- Test: `tests/ui/BandHQ.test.jsx`
- Test: `tests/ui/ShopTab.test.jsx`
- Modify: `scripts/game-balance-simulation.mjs`

- [ ] **Step 1: Classify old HQ purchases explicitly**

Add a pure classification layer in `upgradeCatalog.ts`:

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
canonical chassis/module choices                           -> meta_capability ownership, then selected in Tour Prep
shop-only consumable gear/instruments/merch               -> run_gear
legacy aliases kept only for save compatibility            -> legacy_compatibility and hidden from active catalog
```

The numeric effects do not disappear from old saves; already-owned legacy/canonical items remain honored. New purchases of the three listed van/HQ progression items are no longer available as ordinary Day-1 Fame purchases once Expedition career is active; their capability is unlocked through Garage/Workshop meta facilities/unlock sets.

- [ ] **Step 2: Keep run-facing purchases tactical**

Shop/Upgrades tabs during an active Expedition may sell current-run consumables/gear through existing purchase owners, but permanent capability progression is shown in the Expedition Meta tab and costs Tour Tokens through the hardened facility/unlock-set journal.

- [ ] **Step 3: Add a new balance corridor**

G6 reports `firstMetaFacilityRun` and `firstPermanentExpeditionCapabilityRun`. Initial hypothesis bands:

```text
median first meta facility: run 2..4
median first permanent Expedition capability: run 2..5
Day-1/run-1 permanent capability purchase rate: < 25%
```

These remain tuning hypotheses until playtests, but the old ~universal Day-1 HQ acquisition must not silently remain.

- [ ] **Step 4: Test legacy ownership and new purchase visibility**

Existing saves with old owned upgrades preserve effects. Fresh Expedition career cannot buy the migrated permanent items from the old Fame catalog on run 1; the corresponding capability appears after the required facility/unlock-set path.

- [ ] **Step 5: Commit**

```bash
git add src/data/upgradeCatalog.ts src/data/hqItems.ts src/ui/bandhq scripts/game-balance-simulation.mjs tests
git commit -m "feat(expedition): move permanent HQ power into meta progression"
```

---

# G5-F5 — Replace percentage Legendary rewards with rule-changing capabilities

**Amends:** G5 Task 4. Modest numeric **starter** perks remain allowed; the five finale-earned Legendary rewards below replace the old Legendary multiplier mapping.

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
- Modify: `src/domain/expedition/finale.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Test: `tests/node/expeditionLegendaryRules.test.js`
- Test: `tests/node/expeditionExtraction.test.js`
- Test: `tests/node/expeditionContracts.test.js`

- [ ] **Step 1: Define five finale-earned capabilities**

```text
regional_headliner -> expedition.legendary.safe_harbor
corporate_showcase -> expedition.legendary.the_fixer
rival_battle       -> expedition.legendary.nemesis_key
illegal_show       -> expedition.legendary.ghost_route
disaster_gig       -> expedition.legendary.salvage_rights
```

They remain persisted through the hardened `unlockManager` + `ADD_UNLOCK` Run Summary barrier.

- [ ] **Step 2: Define exact rule transforms**

`ExpeditionState` gets:

```ts
legendaryUses: {
  safeHarbor: boolean
  fixer: boolean
  nemesisKey: boolean
  ghostRoute: boolean
  salvageRights: boolean
}
```

Rules:

```text
safe_harbor:
  once/run, after the first successful major Gig at routeStep >=2,
  add the immediately following route step as an additional valid extraction window.

the_fixer:
  once/run, when an obligation would first settle failed,
  change status to `excused`; pay no reward and apply no failure penalty.

nemesis_key:
  Rival route nodes have minimum Intel Level 2;
  once/run, when a Rival node is visible, expose one deterministic shortcut edge
  from the current node to the nearest reachable Rival node.

ghost_route:
  once/run, the first authority roadblock includes a `go_underground` choice
  that resolves into an Underground Market encounter instead of the roadblock result;
  it adds +5 Heat but no money bribe.

salvage_rights:
  once/run, the first technical Condition group that would move from >0 to 0
  stops at 20 and creates a discovered major defect in that group.
```

Every once/run use is committed by the owning reducer at the same state transition that applies the transformed rule; no React effect owns consumption.

- [ ] **Step 3: Remove Legendary multiplier aliases**

The old finale mapping to `headliner_pass`, `the_fixer`, `nemesis_dossier`, `ghost_route`, `disaster_artist` as multiplier profiles must not be used as the finale reward path. Existing starter perks may keep their modest trade-off multipliers and remain separately selectable in Tour Prep.

- [ ] **Step 4: Add rule-level tests**

Tests must assert transformed decisions/state, not numbers only: extra extraction window, failed contract becomes excused exactly once, Rival intel/shortcut appears, roadblock converts to Underground once, zero-condition salvage happens once and creates a discovered defect.

- [ ] **Step 5: Commit**

```bash
git add src/data/expedition src/domain/expedition src/types/expedition.d.ts src/context/reducers/expeditionReducer.ts tests/node
git commit -m "feat(expedition): make legendary rewards change rules"
```

---

# G6-F1 — Prove the shipped Expedition, not simulator-only approximations

**Amends:** G6 Tasks 2–14. The existing G6-A/G6-B hardening rules for v15 horizon, Calibration/Holdout and paired extraction cohorts remain mandatory.

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

- [ ] **Step 1: Import production composition only**

The simulator constructs production-valid `GameState`, calls `validateExpeditionLoadout`, and uses:

```ts
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

It must not duplicate formulas for Region/Tour/Crew/Pressure/Condition/Legendary behavior.

- [ ] **Step 2: Extend the strategy profiles to full build commitments**

Each of the six profiles supplies a valid setlist snapshot, equipment snapshot, selected chassis/modules, real manifest-backed cargo/Contraband selection, Crew, sponsor/contracts, perk, Fuel target and Cash reserve. Profiles using Tour Pressure seed `career.ascensionUnlocked:true` plus the required capability markers before validation.

- [ ] **Step 3: Add release-evidence metrics for the restored design**

Required report fields:

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
```

`meaningful node choice` means at least two currently reachable connected nodes with different effective node class/subtype or materially different revealed danger/reward tier. Counting two equivalent Gig nodes does not inflate it.

- [ ] **Step 4: Add structural hard gates**

Blocking failures:

```text
any strategy profile bypasses production loadout validation
any simulated modifier has no production consumer/integration test
Rival Hunt cannot produce a Rival node/finale
Underground build cannot produce an Underground route option
Condition reaches critical/breaking but never changes gameplay profile
Crew role effect measured in simulator but zero app-side effect in its owner
failureCauseDistribution contains only bankruptcy across the full matrix
between-tour decision state can be skipped/replayed
Legendary capability changes only a multiplier and no rule/decision
paired extraction dominance reproduces in calibration + holdout (existing G6-B rule)
strategy safety+reward dominance reproduces in calibration + holdout
```

- [ ] **Step 5: Keep pacing targets as hypotheses, but report them**

Initial design hypotheses:

```text
Standard run median real duration: 20..30 min
meaningful visited nodes: 7..9
travel spend: 3..6% of run spend/reward scale
permanent capability run-1 purchase rate: <25%
no one Crew role selected by >80% of successful builds unless profile-specific
voluntary extraction is chosen in a non-trivial band of paired states rather than 0%/100%
```

Do not turn duration into a fake day count; use route actions plus measured/playtest duration telemetry when available.

- [ ] **Step 6: Run final gate**

```bash
pnpm run test:node
pnpm run test:ui
pnpm run test:additional
pnpm run typecheck:core
pnpm run typecheck
pnpm run deadcode:check
pnpm run simulate:balance
node scripts/game-balance-expedition-probe.mjs
```

Expected: all structural gates PASS; calibration/holdout and paired probe use disjoint seeds; report v15 provenance includes every production file imported above.

- [ ] **Step 7: Commit**

```bash
git add scripts reports tests
 git commit -m "test(balance): gate the shipped expedition design"
```

---

## Final spec-coverage gate

Before declaring G6 complete, perform this checklist against `docs/superpowers/specs/2026-09-03-roguelite-expedition-tour-design.md`:

```text
[ ] Tour Prep commits setlist/equipment/modules/crew/real cargo/Contraband/sponsor/contracts/perk/budget/fuel
[ ] 7–9 meaningful-node Standard route remains the target and Rival/Underground classes are route-visible
[ ] Fog supports 0->1->2 through real Scout/contact/perk producers
[ ] Extraction retains Cash/Fame by canonical rates and unsecured rare rewards are genuinely at risk
[ ] Failure can originate from economy, mobility, band/crew, authority and high-risk contract systems
[ ] Cargo capacity is tied to owned content, not user-entered counters
[ ] Condition changes active gameplay and zero Condition disables until recovered
[ ] Hidden defects can be created, revealed, triggered and resolved
[ ] Every Crew role has a production effect and run consequences persist appropriately
[ ] Heat/Exposure/Obligations use canonical intent/reducer paths
[ ] Nemesis levels change opportunities/constraints across runs
[ ] Contextual finales are mechanically distinct before and after the Gig
[ ] Region/Tour/Pressure data is consumed by production helpers before simulation
[ ] Between tours contain 1–3 persistent, idempotent consequential decisions
[ ] HQ permanent power is primarily meta progression, not universal run-1 Fame shopping
[ ] Legendary finale rewards transform rules/choices rather than forming a percentage ladder
[ ] Simulator imports those shipped rules and uses disjoint calibration/holdout evidence
```

A checked item requires a named production owner **and** a test. A report row or state field without a production decision/gameplay effect does not satisfy the design.
