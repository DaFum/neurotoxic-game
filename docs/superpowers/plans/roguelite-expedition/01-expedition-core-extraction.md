# Expedition Core and Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Expedition lifecycle, constrained Tour Prep commitment, map/Fog/Intel foundation, source-proven reward ledger, push-your-luck extraction and core Economy/Mobility failures without depending prematurely on Condition, Crew or Pressure producers.

**Architecture:** Existing `player`, `band`, `assets`, `social` and map owners remain canonical. Expedition stores a prepared run identity/seed, immutable build snapshots, run-only route/Intel/reward/failure state and a protected-Career-Cash boundary. G1 is split into a foundation section that can ship before G2–G4 and an Integration Closure section that is executed only after those subsystem producers exist.

**Tech Stack:** TypeScript 6, React 19, existing reducers/action creators, `MapGenerator`, deterministic RNG, i18next, Node/Vitest/Playwright.

---

## Depends On

- G0 frozen baseline/provenance from `06-balance-simulator-recalibration.md` Task 1.
- No G2–G4 production files are required by Tasks 1–9.
- Tasks 10–12 are explicitly deferred until G2, G3 and G4 are complete.

## File Structure

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
- `src/context/actionTypes.ts`
- `src/types/actions.d.ts`
- `src/context/expeditionActionCreators.ts`
- `src/context/useExpeditionDispatchActions.ts`
- `src/context/reducers/expeditionReducer.ts`
- `src/context/reducers/expeditionSanitizers.ts`
- `src/context/gameReducer.ts`
- `src/context/reducers/gigReducer.ts`
- `src/context/reducers/assetReducer.ts`
- `src/context/reducers/bandReducer.ts`
- `src/utils/eventEngine/eventEffectHandlers.ts`
- `src/scenes/TourPrep.tsx`
- `src/hooks/useMapGeneration.ts`
- `src/hooks/useArrivalLogic.ts`
- `src/components/MapNodeView.tsx`
- `src/context/useGameDispatchActions.ts`
- `public/locales/en/ui.json`
- `public/locales/de/ui.json`

---

# G1A — Foundation

## Task 1: Add prepared-run identity and canonical Expedition state

- [ ] **Step 1: Write failing default/sanitizer tests**

Pin safe defaults and old-save loading:

```js
const state = createInitialState()
assert.equal(state.expedition.status, 'idle')
assert.equal(state.expedition.prep, null)
assert.equal(state.expedition.runId, null)
assert.deepEqual(state.expedition.rewardLedger, [])
assert.deepEqual(state.expedition.intelByNodeId, {})
assert.equal(state.expedition.outcome, null)
```

- [ ] **Step 2: Add exact state contracts**

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
  reason: string | null
  finalizedAtRouteStep: number
  keptRewardIds: string[]
  lostRewardIds: string[]
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
  loadout: ExpeditionLoadout
  startingMoney: number
  startingFame: number
  protectedCareerCash: number
  rewardLedger: ExpeditionRewardLedgerEntry[]
  extractionWindowsSeen: number[]
  pendingFailure: PendingExpeditionFailure | null
  outcome: ExpeditionOutcome | null
}
```

`expedition.prep` is created before Tour Prep choices are finalized and owns the deterministic map/run seed. Reopening the same prepared Tour does not reroll it. `PREPARE_NEXT_EXPEDITION` clears it only after the prior run is finalized and all G5 Between-Tour requirements are satisfied.

- [ ] **Step 3: Add `PREPARE_EXPEDITION_RUN`**

The action creator generates `prepId` and `runSeed`; the reducer accepts it only from `idle` and stores it once. Replay is an identical-state no-op.

- [ ] **Step 4: Run focused tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionReducer.test.js tests/node/saveSliceRoundTrip.test.js
pnpm run typecheck:core
```

Expected: PASS.

---

## Task 2: Commit the complete build, including a real Cash allocation

- [ ] **Step 1: Write failing build-normalization tests**

Cover setlist/equipment/module snapshots, owned merch/Contraband, Fuel target and protected Cash.

- [ ] **Step 2: Add final build types**

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
  contractIds: string[]
  pressureModifierIds: string[]
  build: ExpeditionBuildCommitment
}
```

`protectedCareerCash` replaces the legacy reserve-floor concept. It is the amount of pre-run money the player explicitly keeps outside the Expedition budget. The Tour Prep UI shows:

```text
Career Cash now
Protected after Start
Spendable Expedition Cash = current money - protectedCareerCash
```

- [ ] **Step 3: Add one spendability helper and enforce it at every active-run negative money owner**

```ts
export const getExpeditionSpendableCash = (state: GameState): number =>
  state.expedition.status === 'active'
    ? Math.max(0, state.player.money - state.expedition.protectedCareerCash)
    : Math.max(0, state.player.money)

export const canSpendExpeditionCash = (
  state: GameState,
  amount: number
): boolean =>
  Number.isFinite(amount) &&
  amount >= 0 &&
  getExpeditionSpendableCash(state) >= amount
```

Every active-run Expedition purchase/rescue/bribe/repair/Fuel top-up uses this helper before the canonical `player.money` mutation. In `eventEffectHandlers.ts`, negative `resource:money` effects during an active Expedition are clamped so they cannot reduce `player.money` below `protectedCareerCash`; positive event rewards remain unaffected. Any legacy run-accessible expense path that can fire during Expedition must use the same boundary rather than bypassing it.

Money earned during the run becomes spendable because it increases `player.money`; the protected Career amount remains unavailable until settlement.

- [ ] **Step 4: Validate exact ownership**

`validateExpeditionBuildCommitment` proves:

```text
setlist ids = current normalized setlist ids, non-empty and unique
equipment = current normalized member equipment snapshot
selectedTourbusModuleIds = exact installed ids on selected owned tourbus chassis
merch = owned current inventory quantities
contraband = owned current stash stacks/instance ids
sponsorDealId = null or exact own id currently in state.social.activeDeals
startingFuelTarget = integer currentFuel..100
protectedCareerCash = integer 0..current player.money
```

No reducer calls `generateBrandOffers`.

- [ ] **Step 5: Run tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionLoadout.test.js tests/node/bandReducer.test.js tests/node/assetReducer.test.js tests/node/eventEngine_resolver.test.js
pnpm run typecheck:core
```

Expected: PASS.

---

## Task 3: Start the run transactionally and freeze committed identity

- [ ] **Step 1: Add failing START replay/stale tests**

Cover stale setlist/equipment/modules/Sponsor, insufficient spendable Cash for Fuel, duplicate START and malformed direct reducer payloads.

- [ ] **Step 2: Implement `START_EXPEDITION`**

The action payload contains only validated `loadout`, `prepId` and expected `runSeed`. The reducer re-runs `validateExpeditionLoadout`, requires the stored `prep` to match, derives Fuel top-up cost from `EXPENSE_CONSTANTS.TRANSPORT.FUEL_PRICE`, requires `canSpendExpeditionCash`, applies the canonical money/Fuel mutation once, fixes `runId = prep.prepId`, and transitions `prepared -> active`.

- [ ] **Step 3: Freeze active-run identity**

During active Expedition:

```text
handleSetSetlist               -> reject ids differing from committed setlist
handleInstallModule/remove     -> reject selected-chassis module identity change
handleUpdateBand               -> reject normalized equipment identity change only
```

Mood, stamina, relationships, repairs and consumables remain mutable. Use one shared `normalizeMemberEquipment` helper; never compare JSON strings/object identity.

- [ ] **Step 4: Add identity-freeze tests**

Required:

```text
active equipment replacement -> identical state
active non-equipment member patch -> succeeds
inactive equipment replacement -> existing behavior
active module/setlist drift -> identical state
active attempted equipment removal/addition cannot change G2 cargo technical slots
```

---

## Task 4: Generate the exact prepared map and expose route-visible Rival/Underground classes

- [ ] **Step 1: Extend map subtype contracts**

Use the existing map system; do not build a second route engine. Add validated Expedition Special subtypes:

```ts
export type ExpeditionSpecialNodeSubtype =
  | 'RIVAL_ENCOUNTER'
  | 'UNDERGROUND_MARKET'
  | 'BLACK_MARKET'
```

Node type, rough danger, rough reward and reachable edges are always visible. Exact payout/wear/event/rival/authority/hidden opportunity data remain hidden behind Intel.

- [ ] **Step 2: Use the prepared seed for preview and active map**

Tour Prep calls the same pure `buildExpeditionMap(runSeed, tourType, region)` used by Overworld. START does not reroll the route. G4 route contracts may therefore target a real reachable preview node before commitment.

- [ ] **Step 3: Add depth-safe fallback**

Fallback map generation must preserve requested tour depth and a reachable Finale. Validation fails closed on disconnected layers.

- [ ] **Step 4: Test deterministic preview parity**

```text
same prepared seed + loadout -> same node ids/subtypes/edges in Tour Prep and Overworld
new prepared run -> new deterministic seed
Rival/Underground node class survives map validation
```

---

## Task 5: Implement hybrid Fog and base Intel without future-source dependencies

- [ ] **Step 1: Define Intel view levels**

```ts
export type NodeIntelLevel = 0 | 1 | 2

export interface ExpeditionNodeIntelView {
  nodeType: string
  dangerTier: 'low' | 'medium' | 'high'
  rewardTier: 'low' | 'medium' | 'high'
  exactPayout: number | null
  wearTier: 'low' | 'medium' | 'high' | null
  projectedWear: Record<string, number> | null
  eventIdentity: string | null
  rivalId: string | null
  authorityRiskPct: number | null
  hiddenOpportunityIds: string[]
}
```

Level 0: always-visible fields only. Level 1: qualitative hidden risk/wear/opportunity category. Level 2: exact payout/projection/event/rival/authority values.

- [ ] **Step 2: Define grant storage but only implement current producers**

```ts
export interface ExpeditionIntelGrant {
  id: string
  source: 'social' | 'contact'
  sourceProofId: string
  nodeId: string
  targetLevel: 1 | 2
  consumed: boolean
}
```

G1 implements only:

```text
Scout passive: 0 -> 1 on a visible future node
Scout recon:    1 -> 2 once per route step
Starter/perk floor: selector may expose at least the canonical floor
```

G1 does **not** create generic Social/contact grants. G3 and G4 add source-specific producers with reducer-verifiable proof ids, then G1B proves the consumer path.

- [ ] **Step 3: Add `REVEAL_EXPEDITION_NODE_INTEL` intent**

Payload contains `nodeId`, `source`, `expectedLevel`, `expectedRouteStep`, optional `grantId`. Reducer derives next level and validates Scout/perk/grant entitlement. Payload never carries `nextLevel`.

- [ ] **Step 4: Reserve passive Intel hooks for approved later sources**

`getExpeditionNodeIntel` also accepts passive source flags supplied by G2/G5 without creating new state owners:

```text
vehicle module Intel -> G2 GPS/inspection-capable module reveals Authority-risk band one level earlier
Region familiarity   -> after first completed Region, reveal hidden repair/Sponsor opportunity presence for that Region without exact values
reputation           -> Headliner+ Career rank reveals Sponsor/Rival presence category at structurally visible nodes without exact identity
run trait/Region perk -> G5 effective-rules Intel floor
```

These passive sources reveal only the stated detail axes and must not make Scout Recon redundant.

---

## Task 6: Add a real reward ledger and route-reward producer

- [ ] **Step 1: Define ledger state**

```ts
export type ExpeditionRewardSourceType =
  | 'route_rare'
  | 'event_rare'
  | 'contract'
  | 'crew_contact'
  | 'finale_nonlegendary'

export interface ExpeditionRewardLedgerEntry {
  id: string
  kind: 'module' | 'crew_contact' | 'contract' | 'other'
  sourceType: ExpeditionRewardSourceType
  sourceId: string
  secured: boolean
  earnedAtRouteStep: number
}
```

There are no parallel secured/unsecured id-array owners and no public generic secure action.

- [ ] **Step 2: Add source-derived add intent**

```ts
export interface AddExpeditionRewardPayload {
  expectedRewardId: string
  sourceType: ExpeditionRewardSourceType
  sourceId: string
  expectedRouteStep: number
}
```

Reducer calls `proveExpeditionRewardSource(state, payload)`, derives the canonical reward id/kind/security and requires it to equal `expectedRewardId` as a stale guard. For G1, implement `route_rare`: the current real map node must expose the matching deterministic rare reward source and must have just settled at `expectedRouteStep`. Route rewards are unsecured. Unknown/stale/replayed payloads are identical-state no-ops.

G4 adds `event_rare` and `contract`; G3 adds `crew_contact`; G4 Finale adds non-Legendary Finale sources. Legendary persistence stays in G5 Run Summary and never travels through this ledger.

- [ ] **Step 3: Test settlement divergence**

Completion keeps all valid entries; voluntary extraction/failure keep only canonically secured entries. No payload carries `secured`, `kind` or retention values.

---

## Task 7: Implement authoritative arrival, extraction, completion and reset

- [ ] **Step 1: Harden arrival**

Reducer requires active run, real current node, expected route step, unvisited node and legal connection from prior visited node. From G5 Legendary shortcuts onward use `getEffectiveNodeConnections`.

- [ ] **Step 2: Define settlement**

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

Retention applies only to run-earned positive Money/Fame deltas, never starting principal or losses. G5 composes final retention/completion multipliers through one effective-rules helper.

- [ ] **Step 3: Add explicit extraction confirmation**

`ExtractionDialog` must display before confirmation:

```text
Cash/Fame kept now
unsecured rewards that will be lost
persistent consequences that remain
next known route danger/reward summary
```

No one-click invisible extraction settlement.

- [ ] **Step 4: Guard reset**

`PREPARE_NEXT_EXPEDITION` requires finalized outcome. G5 later adds the requirement that all Between-Tour decisions are resolved.

---

## Task 8: Add only core Economy/Fuel failure and rescue in G1A

- [ ] **Step 1: Define failure contracts**

```ts
export type ExpeditionFailureReason =
  | 'bankruptcy'
  | 'mobility_disabled'
  | 'technical_shutdown'
  | 'band_incapacitated'
  | 'crew_collapse'
  | 'harmony_collapse'
  | 'authority_crisis'
  | 'critical_contract_breach'

export type ExpeditionRescueOption =
  | 'emergency_refuel'
  | 'pay_tow'
  | 'extract_now'
  | 'field_repair'
  | 'cannibalize'
  | 'rest'
  | 'pay_escape'
  | 'sacrifice_reward'
  | 'accept_failure'
```

- [ ] **Step 2: Implement `evaluateCoreExpeditionFailure` only**

G1A owns:

```text
bankruptcy:
  a mandatory current cost cannot be paid from spendable Expedition Cash,
  no free/local alternative exists and extraction is not currently legal

mobility_disabled:
  no reachable edge is traversable with current player.van.fuel/condition,
  and no local refuel/tow/extraction rescue is legal
```

Fuel is explicitly part of Mobility. `emergency_refuel` derives amount/cost from the existing Fuel price, uses `canSpendExpeditionCash`, and cannot exceed 100 Fuel. `pay_tow` is a deterministic expensive fallback only when the current node has no ordinary refuel option.

Do not test technical/Crew/Authority/Contract causes yet.

---

## Task 9: Build the compact six-resource run UI

Persistent status strip contains only:

```text
Cash | Fuel | Stamina | Harmony | Equipment Condition | Heat
```

Contextual panels appear only when actionable/relevant:

```text
Mood
injury
Crew Stress
Contraband risk
Sponsor pressure
Rival status
hidden defects once revealed
active Obligations
Exposure detail
```

Tour Prep must surface every committed build axis. Map cards must show the visible Fog fields and clearly distinguish unknown exact information from zero values.

Run UI tests include keyboard/focus behavior and extraction/failure modal focus trapping.

---

# G1B — Integration Closure (execute only after G2, G3 and G4)

## Task 10: Compose every failure family without forward dependencies

- [ ] **Step 1: Add subsystem evaluators from their owning plans**

```ts
getTechnicalFailureSignal(state) // G2
getCrewFailureSignal(state)      // G3
getPressureFailureSignal(state)  // G4
```

- [ ] **Step 2: Compose final evaluator**

```ts
export const evaluateExpeditionFailure = (state: GameState) =>
  evaluateCoreExpeditionFailure(state) ??
  getTechnicalFailureSignal(state) ??
  getCrewFailureSignal(state) ??
  getPressureFailureSignal(state) ??
  null
```

Each subsystem signal includes its own legal rescue options. Low Harmony alone is never failure because canonical Harmony bottoms at 1; `harmony_collapse` requires an explicit unresolved G3 crisis marker. `critical_contract_breach` requires G4 template `tourEndingOnFailure:true`. `authority_crisis` requires G4 severe encounter evidence plus no remaining safe exit.

- [ ] **Step 3: Golden-path tests**

Cover bankruptcy, Fuel mobility, vehicle/technical shutdown, Band/Crew/Harmony, Authority and critical Contract. Every recoverable state opens a decision before terminal settlement.

---

## Task 11: Close Intel and reward producer loops

- [ ] **Step 1: Add source-specific Intel producer proofs**

G3 Contact and G4 Social producers create `ExpeditionIntelGrant` only from their canonical event/social result seams. Their action payloads carry source proof ids; reducers validate those ids against the just-settled canonical result and atomically add one grant. Generic arbitrary grant creation remains forbidden.

G2/G5 passive Intel sources are exercised here as well: vehicle module Authority band, Region familiarity, Career reputation and run/Region perk floors reveal only their documented axes.

- [ ] **Step 2: Add remaining ledger proofs**

G3/G4 supply `event_rare`, `contract`, `crew_contact` and `finale_nonlegendary` proof branches to `proveExpeditionRewardSource`. Add/replay tests for each.

---

## Task 12: Add full Expedition integration/E2E and plan-authority tests

- [ ] **Step 1: Implement `expeditionPlanAuthority.test.js`**

Read the Canonical Index, master and six numbered child plans. Assert historical files are non-normative and banned superseded contract identifiers are absent from child plans.

- [ ] **Step 2: Add route lifecycle integration test**

```text
prepare run
-> choose/validate full loadout
-> START
-> map preview == active map
-> travel
-> arrive
-> resolve gig/event
-> update Condition/Crew/Pressure
-> choose next route
-> extract OR resolve contextual finale
-> finalize ledger
-> run summary
-> Between-Tour gate prevents premature next run
```

- [ ] **Step 3: Add softlock proof**

Enumerate mandatory PreGig/failure states for zero Fuel, zero vehicle condition, disabled technical group, critical Band/Crew/Harmony and Authority/critical Contract. Assert each state has at least one enabled recovery or `accept_failure` action.

- [ ] **Step 4: Run G1B gate**

```bash
pnpm run test:node
pnpm run test:ui
pnpm run test:e2e
pnpm run typecheck:core
pnpm run typecheck
pnpm run deadcode:check
```

Expected: PASS.

---

## G1 Exit Criteria

- Tour Prep commits a real constrained build and protects an explicit portion of Career Cash from every active-run negative-money path.
- Prepared map seed does not reroll between preview and Overworld.
- Active-run setlist/equipment/module identity cannot drift.
- Hybrid Fog exposes planning information without leaking exact hidden values.
- Scout/perk/Social/Contact plus approved reputation/vehicle/Region passive Intel sources have bounded, reducer-safe effects.
- Reward ledger is the only reward-security owner; generic secure setters do not exist.
- Fuel and vehicle state can create Mobility failure with a visible rescue/termination path.
- Multi-axis failure is composed only after owning subsystem producers exist.
- Extraction is explicit, idempotent and regularly available at designed windows.
- The full route→node→consequence→continue/extract/finale loop has integration coverage.
