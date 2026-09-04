# Meta, Regions, Tours, HQ, Ascension, Between-Tour and Legendary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make long-term Expedition progression unlock new strategies, regions, Crew/chassis/content packages and rule-changing rewards while keeping permanent raw power small and the between-tour pause short.

**Architecture:** `career` owns ranks, Tour Tokens, HQ facilities, completed-Region familiarity, Rival/Crew history, Archive and settled-run journals; `state.unlocks`/`unlockManager` remains the capability marker boundary. All run modifiers compose through one production `getEffectiveExpeditionRules(state)` result so app and simulator cannot disagree about Region/Tour/Chassis/Crew/Starter/Draft/Pressure/Nemesis behavior. Rule-changing Legendary transforms remain explicit named capabilities inside the same effective-rules result, not temporary starter perks.

**Tech Stack:** TypeScript 6, React 19, existing persistence/unlock manager/Band HQ, typed reducers/actions, i18next, deterministic RNG, Node/Vitest/Playwright.

---

## Depends On

- G1B complete lifecycle and finalized `runId` outcome.
- G2 chassis/Condition/Cargo.
- G3 Crew Career/signature registry.
- G4 Pressure/Contracts/Rivals/Quests/Finales/Drafts.

## File Structure

**Create:**

- `src/types/career.d.ts`
- `src/data/expedition/careerRanks.ts`
- `src/data/expedition/regions.ts`
- `src/data/expedition/tourTypes.ts`
- `src/data/expedition/unlockSets.ts`
- `src/data/expedition/pressureModifiers.ts`
- `src/data/expedition/legendaryRules.ts`
- `src/domain/expedition/career.ts`
- `src/domain/expedition/rules.ts`
- `src/domain/expedition/tourPressure.ts`
- `src/domain/expedition/betweenTours.ts`
- `src/domain/expedition/archive.ts`
- `src/ui/expedition/CareerProgress.tsx`
- `src/ui/expedition/TourArchive.tsx`
- `src/ui/bandhq/ExpeditionMetaTab.tsx`
- `src/ui/expedition/RegionPicker.tsx`
- `src/ui/expedition/TourTypePicker.tsx`
- `src/ui/expedition/PressureModifierPicker.tsx`
- `tests/node/expeditionCareer.test.js`
- `tests/node/expeditionRules.test.js`
- `tests/node/expeditionUnlockSets.test.js`
- `tests/node/expeditionTourPressure.test.js`
- `tests/node/expeditionBetweenTours.test.js`
- `tests/node/expeditionLegendaryRules.test.js`
- `tests/node/expeditionArchive.test.js`
- `tests/ui/ExpeditionMetaTab.test.tsx`

**Modify:**

- `src/types/expedition.d.ts`
- `src/types/actions.d.ts`
- `src/context/actionTypes.ts`
- `src/context/careerActionCreators.ts`
- `src/context/reducers/careerReducer.ts`
- `src/context/reducers/careerSanitizers.ts`
- `src/context/useCareerDispatchActions.ts`
- `src/context/reducers/expeditionReducer.ts`
- `src/context/reducers/expeditionSanitizers.ts`
- `src/hooks/usePersistence.ts`
- `src/utils/unlockManager.ts`
- `src/ui/bandhq/BandHQTabsList.tsx`
- `src/ui/bandhq/BandHQContentArea.tsx`
- `src/ui/bandhq/UpgradesTab.tsx`
- `src/ui/bandhq/ShopTab.tsx`
- `src/scenes/TourPrep.tsx`
- `src/ui/expedition/TourPrepLoadout.tsx`
- G1/G2/G3/G4 production consumers listed in the unified rules task
- `public/locales/en/ui.json`
- `public/locales/de/ui.json`
- `public/locales/en/unlocks.json`
- `public/locales/de/unlocks.json`

---

## Task 1: Add Career ranks and Tour Tokens without turning Fame into a universal upgrade currency

Career ranks:

```text
unknown
local_noise
underground_act
rising_band
touring_force
headliner
cult_legend
```

Rank eligibility requires combinations of finalized evidence, not raw Fame alone:

```text
successful extractions/completions
Region completions
Rival/Nemesis milestones
Sponsor/Contract milestones
Expedition quest chain completion
challenge achievements
Fame threshold as one signal, not sole requirement
```

Persistent Career adds:

```ts
completedExpeditionRegionIds: string[]
settledExpeditionRunIds: string[]
```

A Region id enters `completedExpeditionRegionIds` only after a completed Finale in that Region, once per `runId`. G1 Intel uses this as the exact Region-familiarity proof; Archive discovery alone is insufficient.

Tour Tokens are the only new dedicated permanent purchase currency. They are earned only from finalized Expedition outcomes/quest milestones and settled exactly once by `runId`.

Public action:

```ts
SETTLE_EXPEDITION_CAREER_RESULT { runId: string }
```

Reducer loads the finalized outcome, derives token/rank/Region-completion/milestone changes and rejects already-settled run ids. No payload contains token deltas or target rank.

Fame remains on `player.fame` and drives access/Exposure/expectations/Sponsor quality. G5 removes Expedition permanent-power purchases from Fame-only upgrade paths; unrelated legacy Shop/Upgrade purchases stay functional.

---

## Task 2: Define one complete effective-rules composition path

This replaces separate partial rule profiles.

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
}

export interface ExpeditionRuleFlags {
  forcedRival: boolean
  fieldRepairNoHiddenDefect: boolean
  fieldRepairMinimumCondition: number | null
  severeReliefBypass: boolean
  extraScoutReconAfterStep4: boolean
  firstPoorRoadIgnored: boolean
  firstAuthoritySafeExitPreserved: boolean
}

export interface ExpeditionLegendaryRules {
  safeHarbor: boolean
  fixer: boolean
  nemesisKey: boolean
  ghostRoute: boolean
  salvageRights: boolean
}

export interface EffectiveExpeditionRules {
  numeric: ExpeditionNumericRules
  flags: ExpeditionRuleFlags
  legendary: ExpeditionLegendaryRules
}

export const getEffectiveExpeditionRules = (
  state: GameState
): EffectiveExpeditionRules
```

Compose in one order:

```text
Base
-> Region
-> Tour Type
-> G2 Chassis profile
-> selected G3 Crew aggregate
-> Starter Perk
-> G4 accepted Run Draft traits
-> Tour Pressure modifiers
-> Nemesis numeric pressure
-> persistent Legendary capability flags
```

Run Draft special flags such as no-hidden-defect/minimum repair and Tour Pressure reward multiplier are part of this result; G6 must not import a separate partial run-trait/pressure profile for production semantics.

Clamp multiplicative numeric axes to `0.25..3`, Heat `0..100`, Intel floor `0..2`.

---

## Task 3: Wire every effective rule to exactly one production consumer

Required consumer matrix:

```text
startingSpareParts             -> G1 START Cargo materialization
startingHeat                   -> G1 START pressure
fuelConsumptionMultiplier      -> G2 travel Fuel settlement
roadWearMultiplier             -> G2 travel wear
technicalWearMultiplier        -> G2 gig technical wear
repairCostMultiplier           -> G2 professional/field repair cost
fieldRepairEfficiency          -> G2 field repair restore
gigRewardMultiplier            -> canonical post-Gig Expedition positive reward
contractRewardMultiplier       -> G4 Contract settlement
contractPenaltyMultiplier      -> G4 Contract penalty
pressureRewardMultiplier       -> positive run rewards earned under selected Ascension pressure; applied once at owning reward resolver
heatGainMultiplier             -> positive Heat deltas
exposureGainMultiplier         -> positive Exposure deltas
crewStressMultiplier           -> G3 positive Stress gains
extractionRetentionMultiplier  -> G1 voluntary/failure retention, capped by Tour rule
rareRewardMultiplier           -> G1/G4 rare reward source weighting
completionMultiplier           -> G1 completed positive run earnings only
rivalEventWeightMultiplier     -> G4 Director Rival weighting
authorityEventWeightMultiplier -> G4 Director Authority weighting
rivalRewardMultiplier          -> G4 Rival reward settlement
finaleRewardMultiplier         -> G4 non-Legendary Finale reward
nodeIntelFloor                 -> G1 Intel selector/action entitlement
forcedRival                    -> G4 Rival generation
flags.*                        -> exact G2/G3/G4 consumers described by their names
legendary.*                    -> Task 10 exact transforms
```

Add parity tests proving app consumer and G6 use the same returned field for Media Frenzy, No Safety Net, Union Trouble, Press Pass, Cold Trail, Field Engineer and Authority weighting.

---

## Task 4: Implement mechanically different Regions plus approved passive Intel sources

Initial Regions:

```text
home
industrial
festival
corporate
underground
```

Each definition includes map weights and rule differences, not only labels:

```text
industrial  -> more Supply/technical events, harsher road wear, repair opportunity bonus
festival    -> more Festivals, higher Exposure/technical wear, more Rival/Sponsor pressure
corporate   -> stronger Sponsor/Contract pool, lower tolerated Heat, more Authority/Contract events
underground -> Underground/Black Market route weight, Contraband/rare reward opportunities, higher Heat/Authority pressure
home        -> baseline balanced pool
```

Region availability uses `isExpeditionCapabilityUnlocked`, never raw capability id checks only.

Passive Intel rules are deliberately narrow so Scout remains valuable:

```text
Region familiarity:
  if current region id is in career.completedExpeditionRegionIds,
  G1 Intel at Level 0 may reveal whether a visible future node contains a hidden repair OR Sponsor opportunity,
  but not exact opportunity id/value.

Reputation:
  at Career rank headliner or cult_legend,
  G1 Intel at Level 0 may reveal Rival-presence category and Sponsor-opportunity presence on structurally visible nodes,
  but not exact Rival identity/payout.

Vehicle module:
  G2 authorityIntelBonus reveals qualitative Authority-risk band one level earlier.
```

These rules are tested alongside Scout/Contact/Social/run-trait Intel to prove they add selective information rather than a universal Level-1 floor.

---

## Task 5: Implement Tour archetypes as route/rule templates

```text
standard   depth 8, extraction [3,6]
blitz      depth 6, extraction [2,4], denser Gig route
underground depth 8, Underground route required/weighted
corporate  depth 8, Contract/Sponsor route pressure
rival_hunt depth 8, forced Rival route/finale behavior
survival   depth 9, scarce recovery windows
```

Each Tour changes route composition and rule pressure rather than just a difficulty percentage.

Availability/compatibility helpers use the capability resolver and are called by the G1 loadout validator. `standard`/`home` remain baseline.

---

## Task 6: Define concrete capability unlock sets, including real Rehearsal and Crew Lounge value

```ts
export interface ExpeditionUnlockSet {
  id: string
  unlockId: `expedition.set.${string}`
  tokenCost: number
  requiredRank: string
  requiredFacility: { id: HqFacilityId; level: number }
  capabilityIds: string[]
}
```

Initial sets:

```text
mechanic_network
  facility Workshop L1
  -> industrial Region, survival Tour, mechanic_kit starter perk, G2 advanced inspection option

industry_network
  facility Management Office L1
  -> Manager Crew, corporate Region/Tour, press_pass perk, premium Sponsor/Contract pool

underground_network
  facility Black Market L1
  -> Security Crew, underground Region/Tour, underground_contact perk, Black Market route content

festival_network
  facility Rehearsal L1
  -> festival Region, blitz Tour, rehearsed_set perk, performance Contract pool

rival_network
  facility Management Office L2
  -> rival_hunt Tour, Rival quest continuation content

crew_network
  facility Crew Lounge L1
  -> enables G3 concrete signature-trait eligibility/progression for the six registered traits

chassis_network
  facility Garage L1
  -> Expedition availability of higher-tier coach/armored-hauler chassis profiles already owned/purchasable through existing asset systems
```

`rehearsed_set` is concrete in v1:

```text
first major Gig each run grants +20 setupProtection to the currently lowest technical group after PreGig setup, no direct score bonus
```

No facility/set description may say “future feature”. Every purchased set has an immediate production consumer/test.

`isExpeditionCapabilityUnlocked(unlocks, capabilityId)` resolves both direct legacy markers and purchased set markers.

---

## Task 7: Make HQ facilities capability gates, not numeric stat shops

Facilities:

```text
Workshop
Rehearsal Room
Management Office
Garage
Black Market Contact
Crew Lounge
```

Levels 0..3 cost Tour Tokens. Initial costs `[2,4,7]` may be tuned later.

Facility purchases change only `career.hqFacilityLevels`; actual capabilities still come from unlock sets/registered Legendary rewards. Facility cards list which currently available set/capability becomes purchasable at the next level so the value is not abstract.

`ExpeditionMetaTab` surfaces Career rank, Tour Tokens, facilities, unlock sets, Archive, Crew/Rival summary and Legendary capabilities.

---

## Task 8: Remove Expedition permanent power from early Fame-only HQ/Shop paths

Audit `UpgradesTab.tsx`, `ShopTab.tsx` and `BandHQContentArea.tsx` for permanent Expedition-relevant purchases that would make a first successful run buy broad stat power with Fame/Cash alone.

Rules:

```text
existing non-Expedition legacy purchases remain functional
already-owned old-save effects remain honored
new Expedition permanent capabilities require rank/facility/Tour Token/unlock-set ownership
Fame may gate access/quality but is not the sole Expedition meta purchase currency
no automatic Day-1 HQ purchase grants universal Expedition stats
```

Regression tests pin old-save ownership and verify a fresh Career cannot buy an Expedition capability through Fame alone.

---

## Task 9: Implement modular Ascension / Tour Pressure

Modifiers:

```text
bad_roads         -> reward +0.15; road wear x1.30
media_frenzy      -> reward +0.20; Exposure gain x2.00
no_safety_net     -> reward +0.25; extraction retention x0.75; severeReliefBypass true only for explicitly tagged extreme events
union_trouble     -> reward +0.15; positive Crew Stress x1.25
hostile_territory -> reward +0.20; Rival weight x1.50
```

Maximum three unique modifiers. Validator requires `career.ascensionUnlocked` plus known registry ids and rejects duplicates/locked use.

The combined additive reward bonus becomes `numeric.pressureRewardMultiplier = 1 + sum(rewardBonus)` and is consumed once by positive Expedition reward owners. It is no longer a disconnected Tour-Pressure reward field that G6 could miss.

---

## Task 10: Implement rule-changing Legendary rewards as named capabilities

Persistent markers:

```text
expedition.legendary.safe_harbor
expedition.legendary.the_fixer
expedition.legendary.nemesis_key
expedition.legendary.ghost_route
expedition.legendary.salvage_rights
```

Exact transforms:

### Safe Harbor

Once per run, after reaching the second normal extraction window, add one extra valid extraction opportunity at the next non-Finale node. Consumed marker lives in run state; no retention percentage bonus.

### The Fixer

Once per run, excuse one failed non-tour-ending Contract obligation. The Contract becomes completed-without-positive-payout rather than minting reward; failure penalty is skipped.

### Nemesis Key

When current persistent Rival is Nemesis level >=2, add one effective shortcut edge to a Rival Encounter/Finale branch through `getEffectiveNodeConnections`. Does not mutate base map.

### Ghost Route

Once per run, convert one eligible severe Authority route/event opportunity into a deterministic Underground route/event alternative. The player chooses whether to consume it.

### Salvage Rights

Once per run, when a technical group would hit zero, keep it at 20 by sacrificing one eligible unsecured rare reward or, if none exists, two spare parts. If neither cost exists, it cannot trigger.

These are never represented as `starterPerkId` and never flattened into generic numeric bonuses.

Finale Legendary persistence happens at the finalized Run Summary barrier once per `runId` and only after the owning Finale/reward resolution succeeds.

---

## Task 11: Implement the Tour Archive as observation, not unlock ownership

Archive categories:

```text
Crew
modules
chassis
Rivals
Sponsors
Regions
Finales
special events
Contraband
```

`RECORD_EXPEDITION_ARCHIVE_DISCOVERY` may only be dispatched from actual observation/use seams and reducer validates the category/id against its canonical registry/current event. Archive discovery never implies capability ownership.

Use it as a discovery/progression surface, not a mandatory 100% gate.

---

## Task 12: Build exactly 1–3 consequential Between-Tour decisions

After a finalized run, `buildBetweenTourDecisionSet(state, runId)` deterministically selects one to three **decision ids**, not multiple targets from one family.

Initial decisions:

```text
injury_rehab
crew_debrief
rival_response
sponsor_follow_up
vehicle_repair
network_contact
```

Examples:

```text
injury_rehab:
  spend Tour/Career Cash or next-run availability consequence

crew_debrief:
  choose rest_band (+1 Loyalty selected Crew) OR network (one deterministic undiscovered Archive discovery when available)

rival_response:
  confront (increase next Rival presence) OR cool_down (reduce Rival weight, lose one Rival reward opportunity)

sponsor_follow_up:
  keep relationship (future offer weighting) OR walk away (lower obligation pressure, lose Sponsor preference)

vehicle_repair:
  pay canonical repair or carry reduced vehicle condition into next run
```

`PREPARE_NEXT_EXPEDITION` is rejected until all generated decisions are resolved. Every decision is idempotent and keyed by finalized `runId`.

---

## Task 13: Persistence transaction safety for unlock-set purchases

Unlock-set purchase spans Career token state and `unlockManager` marker state. Preserve the existing storage adapter and add a recoverable journal:

```ts
pendingUnlockSetPurchase: {
  setId: string
  unlockId: string
  tokenCost: number
} | null
```

Flow:

```text
BEGIN -> reducer validates set/rank/facility/tokens, debits canonical token cost, stores pending
persist debited state
write unlock marker
COMPLETE -> clear pending
if marker write fails -> ROLLBACK restores exact canonical token cost once
save final state
```

Sanitizer recomputes cost/id from registry and never trusts persisted values. Tests simulate crash/reload between every transition and prove no free unlock or double debit.

---

## Task 14: G5 verification and simulator handoff

Export only canonical production helpers for G6:

```text
getEffectiveExpeditionRules
getAvailableRegions
getAvailableTourTypes
isExpeditionCapabilityUnlocked
buildBetweenTourDecisionSet
getLegendaryRuleState
getCareerRankEligibility
```

Run:

```bash
pnpm run test:node
pnpm run test:ui
pnpm run test:additional
pnpm run typecheck:core
pnpm run typecheck
pnpm run deadcode:check
```

Expected: PASS.

---

## G5 Exit Criteria

- App and simulator have one complete effective-rules composition path.
- Run Draft special rules and Ascension reward multipliers cannot disappear in G6.
- Regions/Tours differ mechanically.
- Region familiarity, reputation and vehicle-module information sources have bounded explicit Intel effects.
- Every HQ facility has immediate purchasable/usable capability value.
- Rehearsal and Crew Lounge no longer sell unspecified “future” functionality.
- Fame gates access/expectations but is not the sole Expedition permanent upgrade currency.
- Unlock-set purchases are crash/reload safe.
- Between-Tour always resolves 1–3 consequential decisions before the next Tour.
- Legendary rewards change rules through five explicit production transforms and are never starter perks.
