# Roguelite Expedition — Exact Owner and Contract Clarifications

> **Authority:** This file is a narrow, binding clarification of `00-spec-fidelity-execution-contract.md`. It exists only to remove remaining ambiguous owner/file/effect wording found during self-review. For the clauses below, this file wins; all other Spec-Fidelity and Review-Hardening rules remain unchanged.

---

## C1 — G1-F1 Sponsor commitment uses persisted Social state only

**Replaces:** G1-F1 wording allowing `sponsorDealId` to mean an “active/eligible” deal.

**Exact owner:** `state.social.activeDeals` from `src/types/social.d.ts`.

`ExpeditionBuildCommitment.sponsorDealId` is valid only when it is `null` or exactly matches an own `id` in current `state.social.activeDeals`.

```ts
export const isCommittedSponsorDealValid = (
  state: GameState,
  sponsorDealId: string | null
): boolean =>
  sponsorDealId === null ||
  state.social.activeDeals.some(deal => deal.id === sponsorDealId)
```

Do **not** call `generateBrandOffers` during loadout validation: offers are RNG-generated and are not persisted. If the player wants a new sponsor before a tour, they must first accept it through the existing Brand Deal flow; Tour Prep then commits the resulting persisted active deal.

Add to `tests/node/expeditionLoadout.test.js`:

```text
active deal id -> valid
registry/eligible-looking but inactive deal id -> invalid
stale deal removed from activeDeals before START -> reducer returns identical state
```

---

## C2 — G1-F2 Map-node metadata must update the real map type and validator

**Adds exact files to G1-F2:**

- Modify: `src/types/map.d.ts`
- Modify: `src/utils/mapValidation.ts`

`src/types/map.d.ts` is the canonical `MapNode` declaration. Add:

```ts
expedition?: {
  subtype: 'rival_encounter' | 'underground_market' | null
}
```

`src/utils/mapValidation.ts` must allow only that optional shape. For an `expedition` object:

```text
must be a plain/loose record with no forbidden own keys
subtype must be exactly rival_encounter, underground_market, or null
unknown extra Expedition metadata keys are rejected
```

Legacy nodes without `expedition` remain byte-for-byte valid. Extend `tests/node/mapGenerator.test.js` and the existing map-validation test file discovered beside `src/utils/mapValidation.ts`; if that file has no dedicated test at implementation time, add `tests/node/mapValidation.test.js` in the same task rather than skipping validation coverage.

---

## C3 — G1-F4 empty Crew selection cannot vacuously fail

**Tightens:** `crew_collapse`.

```ts
const selectedCrewIds = state.expedition.loadout.crewIds
const crewCollapse =
  selectedCrewIds.length > 0 &&
  selectedCrewIds.every(id =>
    state.expedition.crewRunById[id]?.stressStatus === 'breaking'
  ) &&
  !hasCrewRecoveryOption(state)
```

A zero-Crew build never satisfies `crew_collapse` merely because `every([])` is true.

---

## C4 — G4-F1 exact Quest-event calls and test owner

**Exact source:** `src/quests/producers/economyQuestEvents.ts`.

Use the actual producer signatures:

```ts
const moneyEvent = createMoneyEarnedQuestEvent({
  amount: moneyDelta,
  reason: 'expedition_contract'
})

const fameEvent = createFameGainedQuestEvent({
  amount: fameDelta,
  reason: 'expedition_contract'
})
```

Only emit when the corresponding delta is `> 0`. Feed both through the same `QuestEvents.emit` / existing dispatch path used by other income owners; do not call quest reducers directly.

**Exact additional test:** `tests/node/questSystem.test.js`.

Add a contract-settlement integration case proving the generated `economy.moneyEarned` and `fame.gained` events advance quests with `money_earned` / `fame_gained` progress rules exactly once.

---

## C5 — G4-F2 exact Brand Deal owner and tests

**Replaces:** vague “Brand Deal offer selector used by `useDealHandlers`”.

**Exact production file:** `src/utils/brandDealLogic.ts`.

Extend `generateBrandOffers(...)` through a pure post-eligibility helper:

```ts
export const applyNemesisSponsorInterference = (
  offers: readonly BrandOffer[],
  blockedCount: number
): BrandOffer[]
```

Rules:

```text
blockedCount <= 0 -> same ordered offers
otherwise sort a copy by existing canonical offer score/rank order (keep current order when already ranked)
remove the lowest-ranked min(blockedCount, offers.length) offers
never inspect or mutate state.social.activeDeals
never call RNG in this helper
```

`generateBrandOffers` performs all existing eligibility/scoring first, then calls the helper with `getNemesisRuleProfile(...).sponsorOffersBlocked` when an active Expedition has a current persistent Rival; legacy/non-Expedition calls use `0`.

**Exact tests:**

- `tests/utils/brandDealLogic.test.ts`
- `tests/social/extendedSocial.test.js`

Pin deterministic 0/1/2 blocked-offer cases, stable ordering, and “active deal state is untouched”.

---

## C6 — G4-F3 exact Finale registry API

`src/data/expedition/finaleProfiles.ts` exports both the registry and getter:

```ts
export const EXPEDITION_FINALE_PROFILES = Object.freeze({
  regional_headliner: /* G4-F3 values */,
  corporate_showcase: /* G4-F3 values */,
  rival_battle: /* G4-F3 values */,
  illegal_show: /* G4-F3 values */,
  disaster_gig: /* G4-F3 values */
} as const)

export const getExpeditionFinaleProfile = (
  type: ExpeditionFinaleType
): ExpeditionFinaleProfile => EXPEDITION_FINALE_PROFILES[type]
```

`tests/node/expeditionFinale.test.js` must assert all five ids have a profile and the getter returns the exact frozen registry entry. G6 imports this getter instead of duplicating profile numbers.

---

## C7 — G5-F3 exact Between-Tour targets and effects

**Adds Career state:**

```ts
export interface CareerNextTourState {
  unavailableCrewIds: string[]
  rivalIntent: {
    rivalId: string
    mode: 'challenge' | 'avoid'
  } | null
  sponsorIntent: {
    dealId: string
    mode: 'renew' | 'renegotiate' | 'walk_away'
  } | null
}

// CareerState
nextTour: CareerNextTourState
```

Defaults are empty arrays / `null`. Sanitizer validates ids against canonical Crew/Rival/active-deal state where possible and drops malformed/prototype keys.

The deterministic candidate families become these exact decision ids:

### `band_injury_recovery`

Eligible when at least one `career.persistentInjuriesByMemberId` entry is `serious|critical`. Target the highest injury stage, then lexical member id.

Options:

```text
pay_rehab:
  require player.money >= 750
  subtract exactly €750
  critical -> serious; serious -> light

carry_injury:
  cost 0
  persistent injury remains unchanged
```

### `crew_stress_debrief`

Eligible when a selected Expedition Crew actor ended the finalized run with stress >=70. Target highest stress, then lexical crew id.

```text
pay_bonus:
  require player.money >= 500
  subtract exactly €500
  add +4 loyalty to target Crew through canonical Career helper

give_space:
  add target id once to career.nextTour.unavailableCrewIds
```

`validateExpeditionLoadout` rejects a next-tour Crew selection containing an unavailable id. `START_EXPEDITION` clears `unavailableCrewIds` only after the validated next run has successfully started.

### `rival_response`

Eligible when the finalized run recorded a Rival encounter. Target the last encountered persistent rival id.

```text
challenge:
  career.nextTour.rivalIntent = { rivalId, mode:'challenge' }
  next START reuses that Rival and adds +5 starting Heat

show_respect:
  apply the canonical persistent Rival `respect` outcome immediately
  career.nextTour.rivalIntent = null

avoid_territory:
  career.nextTour.rivalIntent = { rivalId, mode:'avoid' }
  for exactly the next run, that Rival's event weight and Rival route subtype weight are 0
  no Rival encounter means no Rival reward for that run
```

Clear `rivalIntent` only after successful next `START_EXPEDITION` materializes the rule.

### `sponsor_followup`

Eligible when the finalized run contains a sponsor obligation with a non-null `sourceId`. Target the last such obligation by array order.

```text
renew:
  career.nextTour.sponsorIntent = { dealId, mode:'renew' }
  Tour Prep preselects it only if it is still in social.activeDeals

renegotiate:
  career.nextTour.sponsorIntent = { dealId, mode:'renegotiate' }
  if the same sponsor is selected next run, its Expedition obligation target increases by 1
  and its canonical completion reward is multiplied by 1.15

walk_away:
  career.nextTour.sponsorIntent = { dealId, mode:'walk_away' }
  that deal id is excluded from Tour Prep sponsor selection for the next run
```

No option regenerates Brand Offers. Clear `sponsorIntent` after successful next START.

### `starting_condition`

Eligible when `player.van.condition < 40` in finalized state.

```text
repair_before_next_tour:
  derive cost with existing calculateRepairCost(player.van.condition)
  require enough current money
  subtract canonical cost and set player.van.condition = 100

carry_damage:
  cost 0
  leave canonical player.van.condition unchanged into next Tour Prep/run
```

Technical Expedition Condition is run-scoped and does not create this decision by itself; persistent vehicle Condition does.

### Fallback `tour_debrief`

Only when no family above is eligible:

```text
rest_band:
  +1 loyalty to each Crew actor selected in the finalized run, once

network:
  add one deterministic undiscovered Crew/Rival/Sponsor archive id to Tour Archive when available;
  if every eligible archive category is exhausted, this option is hidden and rest_band is the only option
```

`buildBetweenTourDecisionSet` selects 1–3 **decision ids**, not multiple targets from one family. Resolution remains reducer-authoritative and replay-safe.

**Additional exact files for money/van mutation:**

- Modify: `src/utils/economy/logisticsLogic.ts` only by importing existing `calculateRepairCost`; do not change the helper.
- Modify: `src/context/gameReducer.ts` if root routing is needed for the Between-Tour action to update both Career and Player atomically.

---

## C8 — G5-F4 exact BandHQ files/tests

**Replaces:** “existing BandHQ Upgrades/Shop catalog consumers”.

Exact files:

- Modify: `src/ui/bandhq/UpgradesTab.tsx`
- Modify: `src/ui/bandhq/ShopTab.tsx`
- Modify: `src/ui/bandhq/BandHQContentArea.tsx` only if role-filtered catalogs are passed there
- Test: `tests/ui/UpgradesTab.test.jsx`
- Test: `tests/ui/ShopTab.test.jsx`
- Test: `tests/ui/BandHQ.test.jsx`

`getUnifiedUpgradeCatalog()` remains the canonical source for Upgrades data. Add a filtering selector in `src/data/upgradeCatalog.ts` rather than duplicating id lists in React:

```ts
export const getExpeditionVisibleUpgradeCatalog = (
  careerActive: boolean
): CatalogItem[]
```

When `careerActive === false`, preserve existing catalog behavior. When true, hide `meta_capability` and `legacy_compatibility` entries from ordinary Fame purchase surfaces. `run_gear` remains visible under existing purchase rules.

---

## C9 — G5-F5 exact Legendary run-state and route contracts

**Adds exact state:**

```ts
export interface ExpeditionLegendaryRunState {
  safeHarborUsed: boolean
  fixerUsed: boolean
  nemesisKeyUsed: boolean
  ghostRouteUsed: boolean
  salvageRightsUsed: boolean
  bonusExtractionSteps: number[]
  bonusConnectionsByNodeId: Record<string, string[]>
}

// ExpeditionState
legendary: ExpeditionLegendaryRunState
```

Defaults: all booleans false, arrays/maps empty. Sanitize own map keys/node ids; cap `bonusExtractionSteps` to valid integer route steps and each bonus-connection list to existing map node ids after map generation.

### Safe Harbor exact trigger

A `major Gig` is a successfully completed non-Finale Gig where either:

```text
current map node type is FESTIVAL
OR currentGig.diff >= 4
OR current map node Expedition subtype is rival_encounter
```

After the first such success at `routeStep >=2`, if `safeHarborUsed === false`, add `min(mapDepth - 1, routeStep + 1)` once to `bonusExtractionSteps` when it is not already a normal extraction step. Mark used atomically.

Canonical extraction eligibility uses:

```ts
export const getEffectiveExtractionSteps = (state: GameState): number[]
```

which unions Tour Type extraction steps with `legendary.bonusExtractionSteps`.

### The Fixer exact state

Extend `ObligationStatus` with `'excused'`. On the first transition that would canonically produce `failed`, if the capability is owned and `fixerUsed === false`, reducer writes `excused`, sets `fixerUsed:true`, and applies neither reward nor failure penalty. `excused` is terminal for that obligation and cannot later be settled again.

### Nemesis Key exact route owner

Create:

```ts
export const getEffectiveNodeConnections = (
  state: GameState,
  nodeId: string
): string[]
```

It unions `gameMap.nodes[nodeId].connections` with `legendary.bonusConnectionsByNodeId[nodeId]`, filters to real node ids and deduplicates. G1-F3 arrival connectivity and Overworld reachable-node rendering both use this helper.

Once/run, when a Rival route node is structurally visible, choose the reachable Rival node with smallest layer > current layer, tie lexical id, and add that id as one bonus connection from current node. If none exists, do not consume `nemesisKeyUsed`. Rival nodes also have Intel floor 2 while the capability is owned.

### Ghost Route exact conversion

In `src/data/events/pressure.ts`, the first authority roadblock during a run conditionally adds option:

```text
id: go_underground
condition: owns ghost_route && !legendary.ghostRouteUsed
outcome: +5 Heat; queue/open the canonical underground_market encounter; no money cost
```

The typed resolution action sets `ghostRouteUsed:true` in the same reducer sequence that applies the conversion. It never changes the roadblock's base probabilities for players without the unlock.

### Salvage Rights exact mutation

At the shared technical Condition reducer seam, before committing a transition from `>0` to `0`, if capability owned and unused:

```text
commit group condition = 20
append one discovered major HiddenDefectState for that group using creator-generated UUID
set salvageRightsUsed = true
```

The action may carry only the generated defect UUID; group/condition/severity/discovered status are derived by reducer. Insurance runs first; Salvage Rights is considered only if insurance did not already rescue the zero.

`tests/node/expeditionLegendaryRules.test.js` covers all five rules and replay/use consumption.

---

## C10 — G6 exact additional source/test files

Add all clarification-owned production files to `BALANCE_SOURCE_FILES` when they materially affect simulation output, including:

```text
src/types/map.d.ts
src/utils/mapValidation.ts
src/utils/brandDealLogic.ts
src/data/expedition/finaleProfiles.ts
src/data/expedition/betweenTourDecisions.ts
src/domain/expedition/betweenTour.ts
src/data/expedition/legendaryRules.ts
src/domain/expedition/legendaryRules.ts
```

G6 Brand Deal/Nemesis coverage uses `tests/utils/brandDealLogic.test.ts`; HQ catalog coverage uses `tests/ui/UpgradesTab.test.jsx` and `tests/ui/ShopTab.test.jsx`; contract Quest-credit coverage uses `tests/node/questSystem.test.js`.

The final release gate must fail if any listed production source is omitted from provenance after it begins affecting a report field.
