# Expedition Core and Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the authoritative Expedition lifecycle, complete Tour Prep commitment, deterministic route/Fog/Intel, source-proven reward ledger, hybrid extraction and multi-axis failure shell.

**Architecture:** Existing `player`, `band`, assets, social and map owners remain canonical. `GameState.expedition` stores only run orchestration, immutable build commitment, Intel/reward/failure evidence and finalized outcome. Reducers/shared resolvers prove every lifecycle transition; scene navigation remains in committed-state callbacks.

**Tech Stack:** TypeScript 6, React 19, existing `ActionTypes`/`GameAction`/reducers, `MapGenerator`, deterministic RNG, i18next, Node/Vitest/Playwright.

---

## Authority and dependencies

This file is executable only under:

```text
approved design spec > master plan > this child plan
```

The `00-*` review files are NON-NORMATIVE historical records and must not be used as implementation overrides.

Gate split:

```text
G1A Tasks 1–9  -> may run before G2–G4
G1B Tasks 10–12 -> run only after G2, G3 and G4 are green
```

---

## File structure

**Create:**

- `src/types/expedition.d.ts`
- `src/domain/expedition/defaults.ts`
- `src/domain/expedition/loadout.ts`
- `src/domain/expedition/buildCommitment.ts`
- `src/domain/expedition/map.ts`
- `src/domain/expedition/nodeIntel.ts`
- `src/domain/expedition/rewardLedger.ts`
- `src/domain/expedition/extraction.ts`
- `src/domain/expedition/failure.ts`
- `src/ui/expedition/TourPrepLoadout.tsx`
- `src/ui/expedition/BuildCommitmentPanel.tsx`
- `src/ui/expedition/ExpeditionStatusStrip.tsx`
- `src/ui/expedition/ExtractionDialog.tsx`
- `src/ui/expedition/FailureCrisisDialog.tsx`
- `tests/node/expeditionPlanAuthority.test.js`
- `tests/node/expeditionReducer.test.js`
- `tests/node/expeditionLoadout.test.js`
- `tests/node/expeditionNodeIntel.test.js`
- `tests/node/expeditionRewardLedger.test.js`
- `tests/node/expeditionExtraction.test.js`
- `tests/node/expeditionFailure.test.js`
- `tests/ui/TourPrep.test.tsx`
- `tests/ui/ExtractionDialog.test.tsx`
- `tests/ui/FailureCrisisDialog.test.tsx`

**Modify:**

- `src/types/index.ts`
- `src/types/game.d.ts`
- `src/types/map.d.ts`
- `src/types/actions.d.ts`
- `src/context/actionTypes.ts`
- `src/context/initialState.ts`
- `src/context/GameState.tsx`
- `src/context/useGameDispatchActions.ts`
- `src/context/expeditionActionCreators.ts`
- `src/context/useExpeditionDispatchActions.ts`
- `src/context/reducers/expeditionReducer.ts`
- `src/context/reducers/expeditionSanitizers.ts`
- `src/context/reducers/systemReducer.ts`
- `src/context/reducers/gigReducer.ts`
- `src/context/reducers/assetReducer.ts`
- `src/context/reducers/bandReducer.ts`
- `src/context/gameReducer.ts`
- `src/hooks/usePersistence.ts`
- `src/hooks/useMapGeneration.ts`
- `src/hooks/useArrivalLogic.ts`
- `src/utils/eventEngine/eventEffectHandlers.ts`
- `src/scenes/TourPrep.tsx`
- `src/components/MapNodeView.tsx`
- `.claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js`
- `tests/node/playwright-screenshot-fixture-validation.test.js`
- `tests/node/saveSliceRoundTrip.test.js`
- `public/locales/en/ui.json`
- `public/locales/de/ui.json`

---

# G1A — Foundation

## Task 1: Create prepared-run state and wire it through every real GameState boundary

- [ ] **Step 1: Add exact state types**

```ts
export type ExpeditionStatus =
  | 'idle'
  | 'prepared'
  | 'active'
  | 'extracted'
  | 'completed'
  | 'failed'

export interface ExpeditionPrepState {
  prepId: string
  runSeed: number
}

export interface ExpeditionOutcome {
  runId: string
  kind: 'extracted' | 'completed' | 'failed'
  reason: ExpeditionFailureReason | null
  finalizedAtRouteStep: number
  settlement: ExpeditionSettlement
  finaleResultId: string | null
}

export interface ExpeditionState {
  status: ExpeditionStatus
  prep: ExpeditionPrepState | null
  runId: string | null
  runSeed: number | null
  routeStep: number
  visitedNodeIds: string[]
  intelByNodeId: Record<string, 0 | 1 | 2>
  intelGrants: ExpeditionIntelGrant[]
  scoutReconUsedRouteSteps: number[]
  loadout: ExpeditionLoadout | null
  startingMoney: number
  startingFame: number
  protectedCareerCash: number
  rewardLedger: ExpeditionRewardLedgerEntry[]
  extractionWindowsSeen: number[]
  pendingFailure: PendingExpeditionFailure | null
  outcome: ExpeditionOutcome | null
}
```

- [ ] **Step 2: Define `PREPARE_EXPEDITION_RUN` as a real state transition**

Creator generates only `prepId` and `runSeed`:

```ts
PREPARE_EXPEDITION_RUN {
  prepId: string
  runSeed: number
}
```

Reducer accepts only when `status === 'idle'`, both values validate, then atomically sets:

```ts
{
  ...state.expedition,
  status: 'prepared',
  prep: { prepId, runSeed }
}
```

While `status === 'prepared'`, reopening Tour Prep is edit-only and does not reroll the seed. Replaying the same PREPARE or sending another PREPARE while prepared/active/finalized is an identical-state no-op.

- [ ] **Step 3: Wire `expedition` through initial/persisted/provider/test fixtures**

Required ownership work:

```text
initialState.expedition              -> fresh default object
createInitialState()                 -> fresh object/arrays/maps per call
PERSISTED_FIELDS                     -> expedition predicate/snapshot
systemReducer LOAD_GAME              -> expedition sanitizer
GameDispatchActions                  -> named Expedition methods
GameStateProvider                    -> implementations using stateRef.current where validation needs current state
dispatchValue                        -> memoized named methods
useGameActions()                     -> exposes those methods
Playwright screenshot BASE_STATE     -> expedition default field
fixture validation test              -> proves BASE_STATE keys mirror initialState
```

Every creator returns `Extract<GameAction, { type: typeof ActionTypes.X }>`.

- [ ] **Step 4: Add red/green tests**

```text
idle -> PREPARE -> prepared
prepared replay -> same state reference
prepared second seed -> same state reference
prepared -> START -> active
required top-level expedition key exists in screenshot BASE_STATE
useGameActions exposes prepare/start/extract/complete/failure methods
save/reload prepared state preserves prepId/runSeed/status
```

Run:

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionReducer.test.js tests/node/saveSliceRoundTrip.test.js tests/node/playwright-screenshot-fixture-validation.test.js
pnpm run typecheck:core
```

Expected: PASS.

---

## Task 2: Commit the full Tour Prep build, including route-Contract target identity

- [ ] **Step 1: Define immutable build contracts**

```ts
export interface ExpeditionEquipmentCommitment {
  memberId: string
  slots: Array<{ slot: string; itemId: string | null }>
}

export interface ExpeditionMerchSelection {
  inventoryKey: string
  quantity: number
}

export interface ExpeditionContrabandSelection {
  stashKey: string
  instanceId: string | null
  stacks: number
}

export interface ExpeditionNativeContractCommitment {
  templateId: string
  targetNodeId: string | null
}

export interface ExpeditionBuildCommitment {
  setlistSongIds: string[]
  equipment: ExpeditionEquipmentCommitment[]
  selectedTourbusModuleIds: string[]
  merch: ExpeditionMerchSelection[]
  contraband: ExpeditionContrabandSelection[]
  sponsorDealId: string | null
  startingFuelTarget: number
  protectedCareerCash: number
}

export interface ExpeditionLoadout {
  tourTypeId: string
  regionId: string
  activeTourbusAssetId: string | null
  crewIds: string[]
  cargo: { spareParts: number; supplies: number }
  starterPerkId: string | null
  nativeContracts: ExpeditionNativeContractCommitment[]
  insurancePolicyId: string | null
  pressureModifierIds: string[]
  build: ExpeditionBuildCommitment
}
```

`nativeContracts` replaces the lossy `contractIds: string[]` shape. G4 owns template semantics; G1 owns preserving the exact accepted commitment through preview→START.

- [ ] **Step 2: Validate exact current-owner identity**

`validateExpeditionBuildCommitment(state, candidate, preparedMap)` proves:

```text
setlistSongIds               exact normalized current setlist; non-empty; unique
equipment                    exact normalized band-member equipment snapshot
selectedTourbusModuleIds     exact installed module ids on selected owned chassis
merch                        selected owned quantities only
contraband                   selected owned stash instances/stacks only
sponsorDealId                null or exact id in state.social.activeDeals
startingFuelTarget           integer currentFuel..100
protectedCareerCash          integer 0..player.money
nativeContracts              unique template ids; each targetNodeId matches the prepared-map commitment returned by G4 validator
```

Before G4 exists, G1A permits only `nativeContracts: []`. G4 extends the same validator in place; it does not create a second loadout validator.

- [ ] **Step 3: Enforce protected Career Cash at every active Expedition spend**

```ts
export const getExpeditionSpendableCash = (state: GameState): number =>
  state.expedition.status === 'active'
    ? Math.max(0, state.player.money - state.expedition.protectedCareerCash)
    : Math.max(0, state.player.money)

export const canSpendExpeditionCash = (state: GameState, amount: number): boolean =>
  Number.isFinite(amount) && amount >= 0 && getExpeditionSpendableCash(state) >= amount
```

All Expedition repair/refuel/bribe/insurance/rescue/purchase paths and active-Expedition negative event Money effects honor this boundary. Positive earnings remain spendable.

- [ ] **Step 4: Prove preview→commit identity**

Tests must assert:

```text
prepared route Contract target node displayed in Tour Prep
same {templateId,targetNodeId} stored in validated loadout
START materializes exactly that commitment after G4 integration
changing prepared seed/target invalidates stale loadout
no route target is recomputed silently at START
```

---

## Task 3: Start transactionally and freeze committed identity

- [ ] **Step 1: Add START action**

```ts
START_EXPEDITION {
  prepId: string
  expectedRunSeed: number
  loadout: ExpeditionLoadout
}
```

Reducer requires `status === 'prepared'`, matching stored prep, re-runs the canonical loadout validator, derives Fuel top-up cost from production constants, verifies protected Cash, applies Money/Fuel once, sets `runId = prepId`, stores the normalized loadout and transitions to `active`.

- [ ] **Step 2: Freeze identity during active run**

```text
setlist mutation               reject if normalized ids differ from committed setlist
selected-chassis module change reject if ids differ from commitment
band equipment patch           reject only equipment identity drift
```

Mood, stamina, relationships, injuries, Condition and consumables remain mutable. Compare normalized structures, never object identity/JSON serialization.

- [ ] **Step 3: Materialize later subsystem commitments once**

At G1B after G2–G4 exist, the same START resolver also performs, in one deterministic transaction:

```text
G2 cargo manifest materialization
G2 insurance premium/claim state initialization
G4 selected Sponsor obligation materialization
G4 native Contract obligation materialization using committed {templateId,targetNodeId}
G5 starting rules such as startingHeat/startingSpareParts when G5 is present
```

Each materializer is idempotent by `runId + sourceId` and does not regenerate offers/targets.

---

## Task 4: Build the deterministic Expedition map and required route-visible classes

Use the existing map engine; do not build a second navigation system.

```ts
export type ExpeditionSpecialNodeSubtype =
  | 'RIVAL_ENCOUNTER'
  | 'UNDERGROUND_MARKET'
  | 'BLACK_MARKET'
```

`buildExpeditionMap(prep.runSeed, tourType, region)` is the single pure route builder used by Tour Prep preview and Overworld. Same seed/loadout yields identical node ids, subtypes, edges and Finale node. Fallback generation preserves requested depth and reachability.

Always visible:

```text
node class/subtype category
rough danger tier
rough reward tier
reachable route edges
```

Intel-gated:

```text
exact payout/wear
exact event/rival identity
Authority probability
hidden opportunity identity
```

Tests cover Standard 7–9 meaningful-node shape, Rival/Underground classes and preview/active parity.

---

## Task 5: Implement monotonic hybrid Fog/Intel

```ts
export type NodeIntelLevel = 0 | 1 | 2

export interface ExpeditionIntelGrant {
  id: string
  source: 'social' | 'contact'
  sourceProofId: string
  nodeId: string
  targetLevel: 1 | 2
  consumed: boolean
}
```

Action:

```ts
REVEAL_EXPEDITION_NODE_INTEL {
  nodeId: string
  source: 'scout_passive' | 'scout_recon' | 'perk_floor' | 'social_grant' | 'contact_grant'
  expectedLevel: 0 | 1
  expectedRouteStep: number
  grantId?: string
}
```

Reducer proves node belongs to committed map, current level matches, source entitlement exists and requested transition is monotonic exactly one level. Social/contact grants are consumed atomically. Forged source labels do not grant Intel.

G1A producers:

```text
Scout passive: visible future node 0 -> 1
Scout recon: one 1 -> 2 per route step
starter/effective-rule floor: bounded 0..2 selector entitlement
```

G3/G4 own Contact/Social grant creation. G2/G5 own passive vehicle/Region/reputation detail flags. None makes Scout globally redundant.

---

## Task 6: Define the concrete rare-reward registry and source-proven ledger

- [ ] **Step 1: Add definitions and ledger entries**

```ts
export type ExpeditionRewardSourceType =
  | 'route_rare'
  | 'event_rare'
  | 'contract'
  | 'crew_contact'
  | 'finale_nonlegendary'

export interface ExpeditionRewardDefinition {
  id: string
  kind: 'module' | 'crew_contact' | 'contract_token' | 'salvage' | 'other'
  materialization: {
    owner: 'unlock' | 'career' | 'inventory'
    valueId: string
  }
}

export interface ExpeditionRewardLedgerEntry {
  id: string
  rewardDefinitionId: string
  sourceType: ExpeditionRewardSourceType
  sourceId: string
  secured: boolean
  earnedAtRouteStep: number
  materialized: boolean
}
```

Create `EXPEDITION_REWARD_REGISTRY` with at least one real reward for each v1 source family that G1/G3/G4 claim to emit. Registry ids are deterministic and point to real materialization owners.

- [ ] **Step 2: Add source-derived intent**

```ts
ADD_EXPEDITION_REWARD {
  expectedRewardId: string
  sourceType: ExpeditionRewardSourceType
  sourceId: string
  expectedRouteStep: number
}
```

`proveExpeditionRewardSource` derives the canonical registry id, security bit and source identity. Caller cannot set `secured`, `kind`, value or materialization owner.

Security defaults:

```text
route_rare/event_rare          unsecured
contract/crew_contact          secured
finale_nonlegendary            secured only when its finale definition says so; otherwise unsecured
```

- [ ] **Step 3: Route rare producer**

A deterministic rare route source uses `runSeed + nodeId` and the Region/Tour rare-reward table. G5 `rareRewardMultiplier` changes eligibility/weight only at this canonical producer.

---

## Task 7: Implement hybrid extraction with explicit rare-item carry decisions

- [ ] **Step 1: Define base retention**

```ts
export const EXPEDITION_BASE_RETENTION = {
  extracted: 0.60,
  failed: 0.25,
  completed: 1.00
} as const
```

G5 `extractionRetentionMultiplier` multiplies extracted/failed Cash/Fame retention and clamps final retention to `0..1`. Completion uses its completion rule separately and never applies extraction retention twice.

Retention applies only to positive run-earned Money/Fame deltas, never starting principal or losses.

- [ ] **Step 2: Define explicit rare carry capacity**

Base voluntary extraction may explicitly carry **one** currently-unsecured ledger entry. G5 may change `explicitExtractionRareCarrySlots` only through `getEffectiveExpeditionRules`.

```ts
export interface ExpeditionExtractionChoice {
  explicitlyExtractRewardIds: string[]
}
```

Validation requires ids to be unique, currently earned, unsecured, not materialized and count `<= explicitExtractionRareCarrySlots`.

Settlement rules:

```text
completed  -> keep all valid ledger entries
extracted  -> keep secured + explicitly selected unsecured entries; abandon other unsecured entries
failed     -> keep secured only; no explicit voluntary carry selection
```

This is the approved `secured OR explicitly extracted` behavior; failure cannot masquerade as an extraction decision.

- [ ] **Step 3: Define settlement result**

```ts
export interface ExpeditionSettlement {
  kind: 'extracted' | 'completed' | 'failed'
  retentionRate: number
  moneyDeltaKept: number
  fameDeltaKept: number
  keptRewardIds: string[]
  lostRewardIds: string[]
}
```

`calculateExpeditionSettlement(state, kind, extractionChoice?)` is pure and is the only settlement calculator.

- [ ] **Step 4: Materialize kept rewards once**

`materializeExpeditionSettlementRewards(state, settlement, runId)` maps each kept registry definition into its real owner exactly once. Lost entries are never materialized. Track `entry.materialized` and finalized `runId` to prevent reload/replay duplication.

- [ ] **Step 5: Extraction UI**

Before confirm, show:

```text
Cash/Fame kept now
secured rewards kept automatically
explicit carry slots and selectable unsecured rewards
unselected rewards that will be lost
persistent consequences that remain
next known route danger/reward summary
```

---

## Task 8: Restore exact authoritative terminal lifecycle actions

No generic `FINALIZE_EXPEDITION { kind }` action is allowed.

### Voluntary extraction

```ts
EXTRACT_EXPEDITION {
  expectedRouteStep: number
  explicitlyExtractRewardIds: string[]
}
```

Reducer proves:

```text
status === active
current route step/node exposes a valid extraction window
window not already consumed/finalized
selection passes Task 7 carry rules
no pending mandatory terminal settlement already exists
```

Then it derives settlement, writes `status:'extracted'`, `outcome`, ledger materialization state and no scene change.

### Completion

```ts
COMPLETE_EXPEDITION {
  finaleResultId: string
  expectedRouteStep: number
}
```

Reducer proves the current committed Finale node has a canonical just-resolved successful Finale result matching `finaleResultId`, no prior outcome exists, derives completion settlement and writes `status:'completed'`.

### Failure acceptance

```ts
ACCEPT_EXPEDITION_FAILURE {
  pendingFailureId: string
  expectedRouteStep: number
}
```

Reducer proves `pendingFailure` exists, id/step match and the failure signal is still canonical. It derives failure settlement and writes `status:'failed'`.

### Next Tour reset

```ts
PREPARE_NEXT_EXPEDITION { runId: string }
```

Reducer requires finalized matching outcome, all G3/G5 required Career/Between-Tour settlements complete, then resets to a fresh `idle` Expedition state. It never creates the next seed; a later PREPARE does that.

### Navigation contract

Reducers never call `changeScene`. The owning committed-state observer/callback detects active→finalized, calls `saveGameAfterStateCommit()`, then routes to `RUN_SUMMARY`. Cover every terminal owner including day-tick/rest paths.

Direct-action tests:

```text
early extraction outside window -> same state
early completion before successful Finale -> same state
forged failure id -> same state
duplicate extraction/completion/failure -> no second settlement/reward
finalized state -> save -> RUN_SUMMARY callback
```

---

## Task 9: Implement core Economy/Fuel failure and rescue shell

```ts
export type ExpeditionFailureReason =
  | 'bankruptcy'
  | 'mobility_failure'
  | 'technical_shutdown'
  | 'band_incapacitated'
  | 'harmony_collapse'
  | 'authority_crisis'
  | 'critical_contract_breach'
```

G1A owns only:

```text
bankruptcy      -> no spendable Expedition Cash and canonical mandatory expense cannot be met
mobility_failure -> no viable travel because Fuel/vehicle state cannot reach any legal next node after available rescue checks
```

Create `PendingExpeditionFailure`:

```ts
export interface PendingExpeditionFailure {
  id: string
  reason: ExpeditionFailureReason
  sourceId: string
  createdAtRouteStep: number
  rescueOptionIds: string[]
}
```

Economy/Mobility rescue options are pure selectors and typed intents:

```text
refuel             when legal source + spendable Cash/cargo exists
tow/roadside       when G2 insurance/module/Cash permits
reroute            when an effective legal alternate edge exists
extract            only when a real extraction window exists
accept_failure     always available after rescue evaluation
```

No terminal failure occurs merely because a numeric threshold is low; the canonical source condition must remain unresolved after offered rescue choices.

---

# G1B — Integration closure after G2/G3/G4

## Task 10: Compose all failure producers without inventing evidence

`evaluateExpeditionFailure(state)` reads only owning-domain signals:

```text
G1 bankruptcy/mobility
G2 getTechnicalFailureSignal(state)
G3 getBandIncapacitationSignal(state)
G3 getUnresolvedHarmonyCrisisSignal(state)
G4 getAuthorityCrisisSignal(state)
G4 getCriticalContractBreachSignal(state)
```

Required semantics:

```text
technical_shutdown       only after G2 recovery/insurance/Legendary checks
band_incapacitated       only when current required performance cannot be legally staffed/recovered
harmony_collapse         only from explicit unresolved G3 crisis evidence, never raw low Harmony alone
authority_crisis         only after a canonical Authority encounter ends with no legal safe resolution
critical_contract_breach only for a failed Contract whose registry says tourEndingOnFailure:true
```

Every signal carries stable source proof and creates one `PendingExpeditionFailure`; the ACCEPT action from Task 8 remains the only terminal failure transition.

---

## Task 11: Integrate later Intel/reward/Contract producers into the existing G1 owners

After G3/G4:

```text
G3 CREATE_CONTACT_INTEL_GRANT -> G1 stored grant -> REVEAL intent -> consumed grant
G4 CREATE_SOCIAL_INTEL_GRANT  -> same G1 grant consumer
G3 crew_contact reward proof  -> G1 reward ledger
G4 event_rare/contract/finale reward proofs -> G1 reward ledger
G4 native Contract commitment -> G1 loadout/start materialization
```

Tests must exercise full producer→stored proof→consumer transition, forged proof and replay; direct mutation of Intel/ledger arrays is forbidden.

---

## Task 12: Full Core E2E and authority regression

### E2E golden path

```text
idle
-> PREPARE sets prepared + immutable seed
-> Tour Prep commits complete build including exact route-Contract target
-> START validates and enters active
-> prepared map equals Overworld map
-> resolve route nodes with Fog/Intel
-> earn secured + unsecured rare rewards
-> encounter G2/G3/G4 management consequences
-> choose extraction OR continue
-> if extracting, explicitly choose up to carry-slot unsecured rewards
-> if continuing, resolve contextual Finale
-> reducer finalizes exactly once
-> committed-state callback saves then routes Run Summary
-> G3/G5 settlements/decisions complete
-> PREPARE_NEXT_EXPEDITION resets to idle
```

### Persistent HUD test

The always-present Expedition strip contains only:

```text
Cash | Fuel | Stamina | Harmony | Equipment Condition | Heat
```

Exposure, Crowd Hype, Crew Stress, obligations, injuries and defects appear contextually, not as permanent extra bars.

### Plan authority test

`expeditionPlanAuthority.test.js` reads canonical index/master/G1–G6 and all three `00-*` files. It requires historical files to contain `NON-NORMATIVE`, rejects any historical claim such as `binding amendment`/`this file wins`, and rejects superseded public payload fragments listed in the canonical index.

Run:

```bash
pnpm run test:node
pnpm run test:ui
pnpm run typecheck:core
pnpm run deadcode:check
```

Expected: PASS.

---

## G1 Exit criteria

- `PREPARE_EXPEDITION_RUN` actually performs `idle -> prepared`; START requires and consumes prepared state.
- `GameState.expedition` is wired through initial state, persistence, provider/dispatch and screenshot `BASE_STATE`.
- Tour Prep commits every approved build axis and preserves exact route-Contract targets.
- Active setlist/equipment/module identity cannot drift.
- Preview and Overworld use the exact prepared seed/map.
- Fog has real 0→1→2 source-proven transitions.
- Rare rewards have a concrete registry/owner and hybrid extraction distinguishes secured, explicitly extracted and abandoned rewards.
- Base voluntary/failure/completion retention is explicit before G5 multipliers.
- Extraction/completion/failure each have their own reducer-proven typed terminal action; navigation stays outside reducers.
- Economy/Fuel plus G2–G4 failure sources converge on one pending-failure/acceptance path.
- Full route→consequence→extract/finale→summary loop is app-tested.