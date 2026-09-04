# Expedition Core and Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the authoritative Expedition lifecycle, deterministic Tour Prep preview/commit flow, hybrid Fog/Intel, source-proven rewards, hybrid extraction and the multi-axis failure shell without duplicating existing game-state owners.

**Architecture:** Existing `player`, `band`, assets, Social, map and root `GameState.runSeed` remain canonical. `GameState.expedition` stores orchestration, immutable run commitments, Intel/reward/failure evidence and finalized outcome only. Every transition is reducer-authoritative; scene navigation occurs after committed state.

**Tech Stack:** TypeScript 6, React 19, existing `ActionTypes`/`GameAction`/reducers, `MapGenerator`, deterministic RNG, i18next, Node/Vitest/Playwright.

---

## Authority and gate split

```text
approved design spec > master plan > this child plan
```

All `00-*` files are NON-NORMATIVE historical review records.

```text
G1A Tasks 1-9   -> independent of G2-G5
G1B Tasks 10-12 -> after G2, G3 and G4 are green
G5 integration  -> may further restrict Next Tour, but is not required for G1B to pass
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
- `src/domain/expedition/equipment.ts`
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
- `tests/node/expeditionEquipment.test.js`
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
- `src/context/gameReducer.ts`
- `src/context/usePersistence.ts`
- `src/context/useMapGeneration.ts`
- `src/hooks/useArrivalLogic.ts`
- `src/utils/purchaseLogicUtils.ts`
- `src/ui/bandhq/hooks/usePurchaseLogic.ts`
- `src/scenes/TourPrep.tsx`
- `src/components/MapNodeView.tsx`
- `.claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js`
- `tests/node/playwright-screenshot-fixture-validation.test.js`
- `tests/node/saveSliceRoundTrip.test.js`
- `public/locales/en/ui.json`
- `public/locales/de/ui.json`

---

# G1A — Foundation

## Task 1: Add Expedition state without creating a second run-seed owner

The existing required root field `GameState.runSeed` remains the **single canonical map/run seed**. Do not add `expedition.runSeed`.

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

- [ ] **Step 1: Write seed-ownership tests**

Tests must start from deliberately mismatched legacy fixture data and prove no Expedition-local seed can influence map generation.

```text
PREPARE sets root GameState.runSeed atomically
Tour Prep preview reads root runSeed
useMapGeneration reads the same root runSeed
START checks expectedRunSeed === state.runSeed
save/reload preserves one seed only
no expedition.runSeed field exists in default/sanitized state
```

- [ ] **Step 2: Implement PREPARE**

```ts
PREPARE_EXPEDITION_RUN {
  prepId: string
  runSeed: number
}
```

Creator generates `prepId` and the next deterministic/persistable run seed. Reducer accepts only from `idle`, validates both, then atomically writes:

```ts
{
  ...state,
  runSeed: action.payload.runSeed,
  expedition: {
    ...state.expedition,
    status: 'prepared',
    prep: { prepId: action.payload.prepId }
  }
}
```

Reopening Tour Prep while `prepared` is edit-only and never rerolls. A second PREPARE while prepared/active/finalized returns the identical state reference.

- [ ] **Step 3: Wire every required GameState boundary**

```text
initialState.expedition
createInitialState() fresh Expedition object
PERSISTED_FIELDS expedition predicate/snapshot
systemReducer LOAD_GAME sanitizer
GameDispatchActions named methods
GameStateProvider implementations
dispatchValue memoized methods
useGameActions exposure
Playwright screenshot BASE_STATE
fixture validation mirror test
```

All creators return `Extract<GameAction, { type: typeof ActionTypes.X }>`. The existing root `runSeed` persistence remains unchanged.

- [ ] **Step 4: Verify**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionReducer.test.js tests/node/saveSliceRoundTrip.test.js tests/node/playwright-screenshot-fixture-validation.test.js
pnpm run typecheck:core
```

Expected: PASS.

---

## Task 2: Commit the real full-build dimensions, including existing purchasable gear

The Expedition Equipment axis must use the repository's real HQ purchase ownership model. Do **not** invent a per-member equip action.

Use `GEAR_LOOKUP`, `getPrimaryEffect`, `isItemOwned`, `band.inventory`, `player.hqUpgrades` and the canonical HQ gear/instrument catalog to derive owned performance gear.

```ts
export const MAX_EXPEDITION_PERFORMANCE_GEAR_ITEMS = 3 as const

export interface ExpeditionEquipmentCommitment {
  selectedGearItemIds: string[]
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
  equipment: ExpeditionEquipmentCommitment
  selectedTourbusModuleIds: string[]
  merch: ExpeditionMerchSelection[]
  contraband: ExpeditionContrabandSelection[]
  sponsorOfferId: string | null
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

`selectedGearItemIds` is a **run-only activation selection** over already-owned real catalog items. It does not mutate persistent ownership. Outside Expedition, existing purchase semantics stay unchanged.

Selection rules:

```text
0..3 unique owned ids
unknown/unowned ids rejected
one selected item consumes one technical-gear cargo slot in G2
```

`getExpeditionOwnedPerformanceGear(state)` derives legal owned ids from canonical purchase state. `getExpeditionCommittedGearProfile(state)` resolves only selected committed items into Expedition gig modifiers, using the same catalog effect definitions. No selected id may be unknown or unowned.

- [ ] **Step 1: Add ownership/selection tests**

```text
owned HQ instrument may be selected
unowned id rejected
unknown id rejected
same owned item selected twice rejected
fourth selected item rejected
purchased but unselected gear does not affect active Expedition modifier
selected gear changes the real active gig modifier path
non-Expedition gameplay keeps existing global purchase behavior
```

- [ ] **Step 2: Validate the complete build**

`validateExpeditionBuildCommitment(state, candidate, preparedMap)` proves:

```text
setlistSongIds             legal current songs, non-empty, unique
equipment                  0..3 unique selectedGearItemIds, all canonical owned gear/instruments
selectedTourbusModuleIds   exact installed ids on selected owned chassis
merch                      selected owned quantities only
contraband                 selected owned stash instances/stacks only
sponsorOfferId             null or exact deterministic G4 prepared Sponsor-offer id
startingFuelTarget         integer currentFuel..100
protectedCareerCash        integer 0..player.money
nativeContracts            unique and valid against G4 prepared-map commitments
```

Before G4 exists, G1A permits `sponsorOfferId:null` and `nativeContracts:[]`.

- [ ] **Step 3: Freeze committed identity while active**

```text
setlist mutation                   reject drift from committed setlist
selected chassis module mutation   reject drift from commitment
Expedition selectedGearItemIds     immutable for active run
persistent HQ ownership            may not retroactively change committed Expedition gear profile
```

Mood, stamina, relationships, injuries, technical Condition and consumables remain mutable.

---

## Task 3: Protect Career Cash at every Expedition spend

```ts
export const getExpeditionSpendableCash = (state: GameState): number =>
  state.expedition.status === 'active'
    ? Math.max(0, state.player.money - state.expedition.protectedCareerCash)
    : Math.max(0, state.player.money)

export const canSpendExpeditionCash = (state: GameState, amount: number): boolean =>
  Number.isFinite(amount) && amount >= 0 && getExpeditionSpendableCash(state) >= amount
```

Every active Expedition repair/refuel/bribe/insurance/rescue/purchase and negative event Money effect must use this boundary. G2 owns the active-Expedition `ADVANCE_DAY` policy for mandatory daily obligations and legacy wear.

Tests must include a wealthy Career proving unallocated money cannot trivialize run safety.

---

## Task 4: Start transactionally from the prepared seed/build

```ts
START_EXPEDITION {
  prepId: string
  expectedRunSeed: number
  loadout: ExpeditionLoadout
}
```

Reducer requires:

```text
status === prepared
prepId matches expedition.prep.prepId
expectedRunSeed === state.runSeed
canonical loadout validation succeeds
Fuel top-up is affordable without crossing protectedCareerCash
prepared map hash/identity matches the map generated from state.runSeed + selected Tour/Region
```

On success it applies Fuel/Money once, sets `runId = prepId`, stores normalized loadout and transitions to `active`.

G1B extends the same START transaction after G2-G4 exist with cargo/insurance/Sponsor/native-Contract materialization. It never regenerates seed, Sponsor offers or Contract targets.

---

## Task 5: Build one deterministic map used by preview and play

```ts
export type ExpeditionSpecialNodeSubtype =
  | 'RIVAL_ENCOUNTER'
  | 'UNDERGROUND_MARKET'
  | 'BLACK_MARKET'
```

`buildExpeditionMap(state.runSeed, tourType, region, routeProfile)` is the only Expedition route builder. G5 supplies the typed Region/Tour route profile later; G1 baseline uses neutral weights.

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

Tests prove Standard 7-9 meaningful nodes, reachable Finale, Rival/Underground classes and preview/active parity.

---

## Task 6: Implement monotonic Hybrid Fog/Intel

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

```ts
REVEAL_EXPEDITION_NODE_INTEL {
  nodeId: string
  source: 'scout_passive' | 'scout_recon' | 'perk_floor' | 'social_grant' | 'contact_grant'
  expectedLevel: 0 | 1
  expectedRouteStep: number
  grantId?: string
}
```

Reducer proves map membership, monotonic one-level transition and source entitlement. Social/contact grants are consumed atomically. Scout recon is bounded and replay-safe. G3/G4 create Contact/Social grants; G5 owns Region/reputation passive detail without making Scout redundant.

---

## Task 7: Define source-proven rare rewards and Hybrid Extraction

```ts
export type ExpeditionRewardSourceType =
  | 'route_rare'
  | 'event_rare'
  | 'contract'
  | 'crew_contact'
  | 'finale_nonlegendary'

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

`EXPEDITION_REWARD_REGISTRY` maps each real v1 reward id to exactly one real materialization owner (`unlock`, `career`, `inventory`).

```ts
ADD_EXPEDITION_REWARD {
  expectedRewardId: string
  sourceType: ExpeditionRewardSourceType
  sourceId: string
  expectedRouteStep: number
}
```

Reducer derives reward/security from canonical source evidence:

```text
route_rare/event_rare   unsecured
contract/crew_contact   secured
finale_nonlegendary     definition-owned security rule
```

Base settlement retention before G5 multipliers:

```text
extracted  Money/Fame 0.60
failed     Money/Fame 0.25
completed  Money/Fame 1.00
```

Voluntary extraction may explicitly carry one eligible unsecured rare reward by default. `getEffectiveExpeditionRules(state).numeric.explicitExtractionRareCarrySlots` may raise the cap to at most 3. Failure keeps secured rare rewards only. Completion keeps all.

Materialization is once-only and happens only after terminal settlement succeeds.

---

## Task 8: Implement exact terminal lifecycle actions

```ts
EXTRACT_EXPEDITION {
  expectedRouteStep: number
  explicitRareRewardIds: string[]
}

COMPLETE_EXPEDITION {
  finaleResultId: string
  expectedRouteStep: number
}

ACCEPT_EXPEDITION_FAILURE {
  pendingFailureId: string
  expectedRouteStep: number
}

PREPARE_NEXT_EXPEDITION {
  runId: string
}
```

Reducer/shared resolver proves:

```text
active -> extracted   only at a current legal extraction window
active -> completed   only after canonical successful Finale evidence
active -> failed      only from current source-derived PendingFailure
finalized -> idle     only for matching finalized run and once core settlement is complete
```

G1B does **not** require G5 Between-Tour decisions to pass. G5 later extends the UI/selector that enables `PREPARE_NEXT_EXPEDITION` with its persisted decision-completion guard and owns those integration tests.

Scene navigation stays outside reducers:

```text
terminal reducer commit
-> saveGameAfterStateCommit()
-> RUN_SUMMARY
```

Direct early/forged/replayed terminal actions must return identical state.

---

## Task 9: Add G1A Economy/Mobility failure shell

```ts
export type ExpeditionFailureReason =
  | 'bankruptcy'
  | 'fuel_stranded'
  | 'technical_shutdown'
  | 'crew_collapse'
  | 'authority_crisis'
  | 'critical_contract_breach'
```

G1A owns only:

```text
bankruptcy
fuel_stranded
```

Fuel-stranded crisis exposes canonical legal choices such as refuel/tow/extract/fail depending on current route/resources. G2/G3/G4 later export technical/Crew/Authority/Contract signals; G1B composes them into the same `PendingExpeditionFailure` state. No later domain creates a second terminal system.

---

# G1B — Integration after G2, G3 and G4

## Task 10: Compose later subsystem commitments and failure signals

At START, materialize once:

```text
G2 cargo manifest
G2 insurance state/premium
G4 staged Sponsor acceptance + linked obligation
G4 native Contract obligations with committed target ids
```

During play, compose:

```text
G2 getTechnicalFailureSignal
G3 getCrewFailureSignal
G4 getAuthorityCrisisSignal
G4 getCriticalContractFailureSignal
```

into the same source-proven `pendingFailure` owner.

---

## Task 11: Wire Contact/Social reward and Intel producers

G3/G4 source actions must end in G1-owned ledgers/grants rather than direct mutation. Required golden paths:

```text
Contact result -> deterministic Intel grant -> reveal -> replay rejected
Social result -> deterministic Intel grant -> reveal -> replay rejected
Route/Event rare result -> reward ledger entry -> extraction settlement
Contract/Finale reward -> source-proven ledger -> terminal materialization once
```

---

## Task 12: Run core end-to-end checks without G5 forward dependencies

Required G1B scenarios:

```text
PREPARE -> same-seed preview -> START -> active
full build identities preserved
active Expedition never crosses protectedCareerCash through G1/G2/G4 spend owners
voluntary extraction keeps 60% base + secured/explicit rare items
completion keeps 100% + all rare items
failure keeps 25% + secured rare items
technical/Crew/Authority/high-risk Contract failure reaches one terminal owner
terminal navigation occurs after committed save
PREPARE_NEXT succeeds in a fixture with no G5 post-run decision layer installed
```

G5 adds its stricter Between-Tour gate later and tests it in G5.

Run:

```bash
pnpm run test:node
pnpm run test:ui
pnpm run typecheck:core
pnpm run deadcode:check
```

Expected: PASS.

---

## G1 exit criteria

- Root `GameState.runSeed` is the only map/run seed owner; preview and active map cannot diverge through duplicate seed state.
- The full build commits setlist, 0..3 real owned HQ gear/instruments, selected chassis/modules, real cargo/Contraband, Sponsor offer, native Contracts, Fuel and protected Career Cash.
- Selected performance gear consumes G2 technical-gear cargo capacity; the build has a real equipment trade-off.
- No fictitious per-member production equip action exists in the plan.
- Hybrid Fog is monotonic and source-entitled.
- Hybrid Extraction distinguishes secured, explicitly carried and abandoned rare rewards.
- Extraction/completion/failure are reducer-authoritative and idempotent.
- G1B is executable before G5; G5 may only add later post-run gating.
