# Meta, Regions, Tours, HQ, Ascension and Legendary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the persistent Expedition meta loop with one effective-rules path, mechanically distinct Regions/Tours, a concrete Tour-Token/rank economy, capability-gated HQ progression, a real transition away from Day-1 numeric HQ snowballing, 1–3 typed Between-Tour decisions, Tour Archive, Ascension and rule-changing Legendary rewards.

**Architecture:** Career stores Expedition rank/counters/Tour Tokens, completed Regions, facilities, Between-Tour decision state and persistent consequence summaries. `unlockManager` remains the persistent capability-marker owner. `getEffectiveExpeditionRules(state)` is the single runtime composition path created in G2 and extended here to its final v1 form.

**Tech Stack:** TypeScript 6, React 19, current Band HQ/upgrade catalog/unlock manager/storage adapter, typed reducers/actions, deterministic RNG, Node/Vitest/Playwright.

---

## Authority and dependencies

```text
approved design spec > master plan > this child plan
```

`00-*` files are NON-NORMATIVE. G5 runs after G1B, G2, G3 and G4 are complete so every capability introduced here has an immediate production consumer.

---

## File structure

**Create:**

- `src/data/expedition/regions.ts`
- `src/data/expedition/tourTypes.ts`
- `src/data/expedition/metaEconomy.ts`
- `src/data/expedition/unlockSets.ts`
- `src/data/expedition/hqFacilities.ts`
- `src/data/expedition/betweenTourDecisions.ts`
- `src/data/expedition/legendaryCapabilities.ts`
- `src/domain/expedition/career.ts`
- `src/domain/expedition/capabilities.ts`
- `src/domain/expedition/betweenTour.ts`
- `src/domain/expedition/legendary.ts`
- `src/ui/bandhq/ExpeditionMetaTab.tsx`
- `src/ui/expedition/BetweenTourDecisionPanel.tsx`
- `tests/node/expeditionMetaEconomy.test.js`
- `tests/node/expeditionCapabilities.test.js`
- `tests/node/expeditionBetweenTour.test.js`
- `tests/node/expeditionLegendary.test.js`
- `tests/ui/ExpeditionMetaTab.test.tsx`
- `tests/ui/BetweenTourDecisionPanel.test.tsx`

**Modify:**

- `src/types/career.d.ts`
- `src/types/expedition.d.ts`
- `src/types/actions.d.ts`
- `src/context/actionTypes.ts`
- `src/context/GameState.tsx`
- `src/context/careerActionCreators.ts`
- `src/context/useCareerDispatchActions.ts`
- `src/context/reducers/careerReducer.ts`
- `src/context/reducers/careerSanitizers.ts`
- `src/context/reducers/expeditionReducer.ts`
- `src/domain/expedition/effectiveRules.ts`
- `src/domain/expedition/loadout.ts`
- `src/domain/expedition/map.ts`
- `src/data/upgradeCatalog.ts`
- `src/data/hqItems/hq.ts`
- `src/ui/bandhq/UpgradesTab.tsx`
- `src/ui/bandhq/ShopTab.tsx`
- `src/ui/bandhq/BandHQContentArea.tsx`
- current `unlockManager`/storage adapter owner
- Run Summary UI/controller
- `public/locales/en/ui.json`
- `public/locales/de/ui.json`

---

## Task 1: Define the concrete Career economy before any simulator measures it

This closes the implementation-dependent economy gap from the 2026-09-04 review.

### Career state

```ts
export type ExpeditionCareerRank = 'rookie' | 'roadtested' | 'headliner' | 'cult_legend'

export interface ExpeditionCareerProgress {
  tourTokens: number
  rank: ExpeditionCareerRank
  settledExpeditionRunIds: string[]
  finalizedExpeditionRuns: number
  completedExpeditionRuns: number
  extractedExpeditionRuns: number
  completedExpeditionRegionIds: string[]
  completedFinaleTypes: string[]
}
```

### Token award registry

```ts
export const EXPEDITION_TOUR_TOKEN_AWARDS = {
  failed: 0,
  extracted: 1,
  completed: 2,
  firstRegionCompletion: 1,
  metaQuestMilestone: 1
} as const
```

Rules:

```text
failed run                         +0
voluntary extracted run            +1
completed Finale                   +2
first completion of a Region       +1 once/Region
quest_expedition_meta_unlock step  +1, max one such bonus per run
```

A first Home completion therefore yields 3 Tokens before later-rank meta quests; it cannot buy both a 2-Token facility and a 2-Token capability set in the same first Run Summary.

### Rank criteria

Rank is derived, never caller supplied:

```text
rookie
  default

roadtested
  finalizedExpeditionRuns >=2
  AND completedExpeditionRuns >=1

headliner
  completedExpeditionRuns >=5
  AND completedExpeditionRegionIds.length >=2

cult_legend
  completedExpeditionRuns >=10
  AND completedExpeditionRegionIds.length >=4
  AND max persistent Nemesis level >=3
```

`calculateExpeditionCareerRank(career)` returns the highest satisfied rank.

### Settlement action

```ts
SETTLE_EXPEDITION_CAREER_RESULT { runId: string }
```

Reducer requires finalized G1 outcome with matching run id, rejects ids already in `settledExpeditionRunIds`, derives all counters/Region/token bonuses/rank from canonical outcome+quest evidence and applies once. No payload contains token delta or rank.

Tests cover extracted/completed/failed, first/repeat Region, eligible/ineligible meta quest bonus, replay and save/reload.

---

## Task 2: Complete the single effective-rules composition path

Final v1 composition order in `src/domain/expedition/effectiveRules.ts`:

```text
Base
-> Region
-> Tour Type
-> G2 Chassis
-> G2 installed module profile
-> selected/available G3 Crew
-> Starter Perk
-> G4 accepted Run Draft traits
-> Tour Pressure modifiers
-> G4 Nemesis pressure
-> persistent Legendary capability flags
```

Use the `EffectiveExpeditionRules` type introduced by G2. Add final v1 fields only if a production consumer is named in the same task; no partial side profiles remain.

Required consumer matrix:

```text
startingSpareParts               -> G1 START cargo materialization
startingHeat                     -> G1/G4 START pressure
fuelConsumptionMultiplier        -> G2 travel Fuel settlement
roadWearMultiplier               -> G2 travel wear
technicalWearMultiplier          -> G2 gig technical wear
repairCostMultiplier             -> G2 repair prices
fieldRepairEfficiency            -> G2 field repair formula
fieldRepairNoHiddenDefect        -> G2 field repair formula
fieldRepairMinimumCondition      -> G2 field repair formula
gigRewardMultiplier              -> canonical post-Gig positive reward
contractRewardMultiplier         -> G4 Contract settlement
contractPenaltyMultiplier        -> G4 Contract failure
pressureRewardMultiplier         -> owning positive Expedition reward resolvers, once
heatGainMultiplier               -> positive G4 Heat gains
exposureGainMultiplier           -> positive G4 Exposure gains
crewStressMultiplier             -> G3 positive Stress gains
extractionRetentionMultiplier    -> G1 extracted/failed base retention
rareRewardMultiplier             -> G1/G4 canonical rare-reward source weighting
completionMultiplier             -> G1 completed positive earnings only
rivalEventWeightMultiplier       -> G4 Director Rival family
authorityEventWeightMultiplier   -> G4 Director Authority family
rivalRewardMultiplier            -> G4 Rival reward
finaleRewardMultiplier           -> G4 Finale positive reward
nodeIntelFloor                   -> G1 Intel entitlement
explicitExtractionRareCarrySlots -> G1 voluntary extraction carry selection
severeReliefBypass               -> G4 Director explicit override only
legendary flags                  -> Task 10 exact transforms
```

Clamp multiplicative numeric axes `0.25..3`, Heat `0..100`, Intel `0..2`, carry slots `0..3`.

Parity tests cover chassis+Technician+field_engineer repair, Media Frenzy, No Safety Net, Union Trouble, Press Pass, Cold Trail and Authority weighting.

---

## Task 3: Implement mechanically distinct Regions and bounded passive Intel

Initial Regions:

```text
home
industrial
festival
corporate
underground
```

Exact initial rule tendencies:

```text
home
  baseline map/rules

industrial
  Supply/technical node weight +25%
  roadWearMultiplier x1.15
  repairCostMultiplier x0.90

festival
  Festival/high-profile node weight +30%
  exposureGainMultiplier x1.20
  technicalWearMultiplier x1.10
  rivalEventWeightMultiplier x1.10

corporate
  Sponsor/Contract event weight +30%
  authorityEventWeightMultiplier x1.15
  contractRewardMultiplier x1.10
  Heat >=60 makes corporate Sponsor offers ineligible

underground
  Underground/Black Market node weight +35%
  rareRewardMultiplier x1.20
  heatGainMultiplier x1.15
  authorityEventWeightMultiplier x1.20
```

Region availability uses `isExpeditionCapabilityUnlocked`, not raw unlock ids.

Passive Intel remains narrow:

```text
completed Region familiarity -> Level-0 view may reveal hidden repair OR Sponsor opportunity presence, no exact id/value
headliner/cult_legend rank   -> Level-0 view may reveal Rival/Sponsor presence category, no exact identity/payout
G2 authorityIntelBonus       -> qualitative Authority band one level earlier
```

Scout/Contact/Social remain valuable because none of these grants a universal Level-1/2 reveal.

---

## Task 4: Implement Tour archetypes as route/rule templates

```text
standard
  depth 8
  extraction windows [3,6]

blitz
  depth 6
  extraction [2,4]
  Gig route weight +25%
  completionMultiplier x0.95

underground
  depth 8
  extraction [3,6]
  requires/weights Underground route class
  startingHeat +10

corporate
  depth 8
  extraction [3,6]
  Sponsor/Contract pressure weight +25%
  contractRewardMultiplier x1.10

rival_hunt
  depth 8
  extraction [3,6]
  forcedRival true
  rivalEventWeightMultiplier x1.30

survival
  depth 9
  extraction [4,7]
  recovery-node weight -30%
  completionMultiplier x1.20
```

`standard`/`home` remain baseline. Compatibility is enforced by G1 canonical loadout validator using capability resolver.

---

## Task 5: Define exact facility registry and purchase transaction

```ts
export type HqFacilityId =
  | 'workshop'
  | 'rehearsal'
  | 'management_office'
  | 'garage'
  | 'black_market_contact'
  | 'crew_lounge'

export const HQ_FACILITY_LEVEL_COSTS = [2, 4, 7] as const
```

Meaning: level `0->1` costs 2 Tour Tokens, `1->2` costs 4, `2->3` costs 7.

Action:

```ts
PURCHASE_EXPEDITION_HQ_FACILITY {
  facilityId: HqFacilityId
  expectedLevel: 0 | 1 | 2
}
```

Reducer validates known id/current expected level/max level/Tokens, derives canonical cost and updates `career.hqFacilityLevels` once. Caller never submits cost or target level.

Facilities change capability eligibility, not universal numeric stats.

---

## Task 6: Define exact unlock-set costs/ranks/facilities and immediate consumers

```ts
export interface ExpeditionUnlockSet {
  id: string
  unlockId: `expedition.set.${string}`
  tokenCost: number
  requiredRank: ExpeditionCareerRank
  requiredFacility: { id: HqFacilityId; level: number }
  capabilityIds: string[]
}
```

Initial registry:

```text
mechanic_network
  tokenCost 2 | rank rookie | Workshop L1
  -> industrial Region, survival Tour, mechanic_kit starter perk, advanced inspection

industry_network
  tokenCost 3 | rank roadtested | Management Office L1
  -> Manager Crew, corporate Region/Tour, press_pass perk, premium Sponsor/Contract pool

underground_network
  tokenCost 3 | rank roadtested | Black Market Contact L1
  -> Security Crew, underground Region/Tour, underground_contact perk, Black Market route content

festival_network
  tokenCost 3 | rank roadtested | Rehearsal L1
  -> festival Region, blitz Tour, rehearsed_set perk, performance Contract pool

crew_network
  tokenCost 4 | rank roadtested | Crew Lounge L1
  -> G3 signature-trait eligibility/acquisition path

chassis_network
  tokenCost 5 | rank headliner | Garage L1
  -> higher-tier coach/armored-hauler Expedition availability when owned/purchasable in existing asset system

rival_network
  tokenCost 5 | rank headliner | Management Office L2
  -> rival_hunt Tour + persistent Rival quest continuation content
```

`rehearsed_set` remains concrete:

```text
first major Gig/run grants +20 setupProtection to currently lowest technical group after PreGig setup; no direct score bonus
```

`isExpeditionCapabilityUnlocked(unlocks, capabilityId)` resolves direct compatible legacy markers and set-derived capabilities. Crew/Region/Tour availability must call this resolver.

Unlock-set purchase uses the existing crash-safe journal sequence:

```text
BEGIN validate set/rank/facility/Tokens -> debit -> persist pending
write unlock marker through unlockManager
COMPLETE clear pending after marker confirmed in state
ROLLBACK exact canonical cost once if marker write fails
```

Sanitizer recomputes set id/cost from registry; persisted cost is never trusted.

---

## Task 7: Make the fresh-career Band HQ transition explicit instead of leaving the old Day-1 power loop intact

The old catalog remains available for unrelated legacy gameplay, but every entry that materially changes an Expedition must be classified. Add:

```ts
export type ExpeditionLegacyHqPolicy =
  | 'unaffected'
  | 'between_tours_only'
  | 'requires_roadtested'
  | 'requires_headliner'
  | 'requires_capability'

export const EXPEDITION_LEGACY_HQ_POLICY: Record<string, ExpeditionLegacyHqPolicy>
```

Initial explicit classification:

```text
hq_room_coffee             between_tours_only
hq_room_sofa               between_tours_only
hq_room_cheap_beer_fridge  between_tours_only

hq_room_cat                requires_roadtested
hq_room_marketing          requires_roadtested
hq_room_skull              requires_roadtested
pr_manager_contract        requires_capability (industry_network)

hq_room_beer_pipeline      requires_headliner

all catalog entries not affecting Expedition resources/rules
                           unaffected
```

Semantics:

- `between_tours_only`: purchase remains legacy-compatible, but its passive recovery effect is ignored during active Expedition; G2/G3 explicit rest/recovery owners remain authoritative.
- `requires_roadtested`/`requires_headliner`: old saves that already own the item keep it; a fresh Career cannot buy it before the rank. Purchase logic enforces the gate, not only UI.
- `requires_capability`: requires the named Expedition capability/unlock set before purchase.
- `unaffected`: no Expedition-specific restriction.

Add a test that scans the unified upgrade catalog and fails if a new `stat_modifier`/HQ unlock is detected as affecting `harmony`, Expedition recovery, Fame/Sponsor pressure or other Expedition rule inputs without an explicit policy entry.

Fresh-career design assertion:

```text
before first finalized Expedition:
  no newly purchased Band HQ item may grant an active-Expedition Harmony/recovery/Sponsor/numeric advantage
  Expedition-affecting purchase rate = 0
```

This closes the parallel old-Day-1-power-loop rather than merely adding a second meta tab.

---

## Task 8: Add starter perks without turning them into Legendary percentage ladders

Initial starter perks unlocked by sets:

```text
mechanic_kit       -> startingSpareParts +1
press_pass         -> Exposure gain x1.10; Sponsor quality/eligibility option, no guaranteed payout
underground_contact-> startingHeat +5; one Underground opportunity category revealed
rehearsed_set      -> first major Gig setupProtection +20 to lowest technical group
```

All feed `getEffectiveExpeditionRules` or a named one-shot run marker. Legendary ids are never legal `starterPerkId` values.

---

## Task 9: Implement modular Ascension / Tour Pressure

Registry:

```text
bad_roads
  reward +0.15; road wear x1.30

media_frenzy
  reward +0.20; Exposure gain x2.00

no_safety_net
  reward +0.25; extraction retention x0.75; severeReliefBypass only for explicitly tagged extreme events

union_trouble
  reward +0.15; positive Crew Stress x1.25

hostile_territory
  reward +0.20; Rival weight x1.50
```

Maximum three unique modifiers. G1 validator enforces registry membership, uniqueness, max-3 and `career.ascensionUnlocked`; save sanitizer removes invalid ids. `pressureRewardMultiplier = 1 + sum(rewardBonus)` applies once at owning positive reward resolver.

G6 late-career profiles that use pressure modifiers explicitly seed/earn `ascensionUnlocked:true` through production-compatible Career fixtures.

---

## Task 10: Keep five Legendary rewards rule-changing and production-owned

Persistent capability markers:

```text
expedition.legendary.safe_harbor
expedition.legendary.the_fixer
expedition.legendary.nemesis_key
expedition.legendary.ghost_route
expedition.legendary.salvage_rights
```

Exact transforms:

### Safe Harbor
Once/run after second normal extraction window, adds one extra valid extraction opportunity at the next non-Finale node. No retention percentage bonus.

### The Fixer
Once/run may excuse one failed **non-tour-ending** Contract: no positive payout, failure penalty skipped. Cannot excuse `tourEndingOnFailure:true`.

### Nemesis Key
With active persistent Rival Nemesis `>=2`, adds one effective shortcut edge to Rival Encounter/Finale branch; base map unchanged.

### Ghost Route
Once/run player may convert one eligible severe Authority route/event opportunity into deterministic Underground alternative.

### Salvage Rights
Once/run when technical group would hit 0, keep it at 20 by sacrificing one eligible unsecured rare reward; if none, spend two spare parts; if neither, cannot trigger.

Each capability has one run-consumed marker in Expedition state and one production activation test. Finale-earned marker persistence must succeed before Career result settlement becomes available; storage failure keeps settlement controls disabled and offers retry.

---

## Task 11: Implement Tour Archive as observation, not ownership

Archive categories:

```text
Crew | modules | chassis | Rivals | Sponsors | Regions | Finales | special events | Contraband
```

Typed action:

```ts
RECORD_EXPEDITION_ARCHIVE_DISCOVERY {
  category: ExpeditionArchiveCategory
  id: string
  sourceId: string
}
```

Creator and reducer validate category/id against canonical registry/current observed source. Archive discovery never grants capability ownership and is not a mandatory 100% progression gate.

---

## Task 12: Define exact persisted 1–3 Between-Tour decision instances and reducer-owned resolution

This closes the caller-authorized/unspecified Between-Tour gap.

### State

```ts
export type BetweenTourDecisionType =
  | 'injury_rehab'
  | 'crew_debrief'
  | 'rival_response'
  | 'sponsor_follow_up'
  | 'vehicle_repair'
  | 'network_contact'

export interface BetweenTourDecisionInstance {
  id: string
  type: BetweenTourDecisionType
  targetId: string | null
  optionIds: string[]
}

export interface BetweenTourRunState {
  runId: string
  decisions: BetweenTourDecisionInstance[]
  resolvedOptionByDecisionId: Record<string, string>
}

// Career
betweenTourByRunId: Record<string, BetweenTourRunState>
```

### Deterministic selection

`buildBetweenTourDecisionSet(state, runId)` requires finalized run and chooses **1–3 distinct decision instances** in this priority order:

```text
1. injury_rehab      if Band critical consequence or G3 crewRecoveryDebt exists
2. crew_debrief      if selected Crew exists; target = deterministic lowest-loyalty selected Crew, tie lexical id
3. rival_response    if persistent Rival was encountered this run; target = exact Rival id
4. sponsor_follow_up if Sponsor obligation existed; target = exact deal id
5. vehicle_repair    if player.van.condition <75
6. network_contact   fallback/remaining slot when eligible Archive discovery exists
```

Use run seed only to break equally eligible lower-priority choices; never exceed 3. If no conditional decision exists, create `crew_debrief` when a selected Crew exists, otherwise `network_contact`; thus every finalized run has at least one decision.

### Exact options/effects

```text
injury_rehab
  pay_rehab:
    cost €300 Career Cash if spendable outside active run
    clear target Crew recovery debt OR reduce target persistent Band injury consequence one stage
  accept_unavailability:
    cost 0
    leave recovery debt/consequence for next Tour

crew_debrief
  rest_band:
    +1 Loyalty to the decision's target Crew, capped 100
  develop_signature:
    only if G3 signature eligibility is currently true
    invoke G3 source-derived signature acquisition for the decision target

rival_response
  confront:
    set one next-run Rival-presence preference marker for this Rival
  cool_down:
    set one next-run Rival-weight x0.75 marker for this Rival; forfeit one Rival rare-reward opportunity

sponsor_follow_up
  keep_relationship:
    next offer weighting +1 bounded preference tier for target Sponsor
  walk_away:
    clear Sponsor preference; next-run Sponsor obligation pressure -1 bounded tier

vehicle_repair
  pay_repair:
    derive cost = ceil((100 - van.condition) * €12)
    require Career Cash; set canonical van condition to 100
  carry_damage:
    cost 0; leave current vehicle condition unchanged

network_contact
  follow_lead:
    record one deterministic eligible Archive discovery
  cash_out:
    +€200 Career Cash; no Archive discovery
```

### Typed resolve action

```ts
RESOLVE_EXPEDITION_BETWEEN_TOUR_DECISION {
  runId: string
  decisionId: string
  optionId: string
}
```

Reducer proves finalized run, stored canonical decision instance, listed option, unresolved status and current eligibility/cost. It derives target/effect from the decision registry and commits sensitive Career/Rival/Sponsor/vehicle/signature changes itself. Caller never supplies Loyalty, Money, condition, Rival or trait deltas.

Replay/StrictMode/reload is safe because `resolvedOptionByDecisionId` is persisted and duplicate resolve is a no-op.

G1 `PREPARE_NEXT_EXPEDITION` requires all stored decision ids resolved.

Required tests:

```text
1..3 decisions always
serious Crew injury produces injury_rehab and next-tour availability consequence
eligible crew_debrief develop_signature acquires exact G3 trait once
rival_response uses the exact persistent Rival id
vehicle repair price derived/revalidated in reducer
forged decision/option -> no-op
save/reload after one of three decisions -> only remaining two are actionable
StrictMode duplicate dispatch -> effect once
Next Tour blocked until all resolved
```

---

## Task 13: Build the Band HQ Expedition meta surface

`ExpeditionMetaTab` shows:

```text
rank and exact next-rank criteria
Tour Token balance and token award explanation
facility levels/costs
unlock sets with exact token/rank/facility requirements
Archive
Crew recovery/signature summary
persistent Rival/Nemesis summary
Legendary capabilities
```

Facility cards show the concrete capability/set unlocked at the next level. No card may advertise a future/no-consumer feature.

Run Summary flow:

```text
finalized G1 outcome
-> persist any required Legendary marker barrier
-> SETTLE_EXPEDITION_CAREER_RESULT
-> SETTLE_EXPEDITION_CREW_CAREER
-> build/persist 1–3 Between-Tour decisions
-> resolve all decisions
-> optional Band HQ/meta purchase
-> PREPARE_NEXT_EXPEDITION enabled
```

---

## Task 14: Verification and G6 handoff

Production telemetry:

```text
Tour Tokens earned by source
rank transition run
facility purchase run/id/level
unlock-set purchase run/id
fresh-career legacy Expedition-affecting HQ purchase attempts/successes
Between-Tour decision count/type/option
Legendary activation
Region/Tour/capability ownership
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

## G5 Exit criteria

- Tour-Token awards, rank thresholds, facility costs and every initial unlock-set cost/rank/facility requirement are explicit production registries.
- `getEffectiveExpeditionRules` is the single final composition path and every field has one named production consumer.
- Regions/Tours change route/rules rather than labels only.
- A first Home completion cannot immediately buy both a facility and capability set from its normal award alone.
- Fresh Career has **zero** newly purchased Expedition-affecting legacy HQ numeric advantages before the first finalized Expedition; old saves keep owned content.
- Facilities unlock real immediate options; no speculative token sink exists.
- Between-Tour loop persists exactly 1–3 typed decision instances and reducer-owned effects; Next Tour is blocked until all settle.
- G3 signature traits can actually be acquired through a canonical Between-Tour decision.
- Archive is observation, not ownership.
- Five Legendary capabilities transform rules and are individually production-tested.