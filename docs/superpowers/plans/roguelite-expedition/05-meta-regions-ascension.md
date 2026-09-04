# Meta Progression, Regions, Tours, HQ, Ascension and Between-Tour Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the persistent Expedition meta layer: exact Career economy/ranks, mechanically distinct Region/Tour route profiles, Fame as access/expectation signal, capability-broadening HQ progression, bounded starter perks, earnable Ascension pressure, naturally earnable rule-changing Legendary capabilities, Tour Archive and 1–3 consequential Between-Tour decisions.

**Architecture:** G3's persisted `CareerState` is extended in place. Numeric Expedition effects compose through G2's `getEffectiveExpeditionRules(state)`; route/offer/non-numeric Region/Tour behavior composes through one separate `getExpeditionRoutePressureProfile(state)` consumed by G1 map generation and G4 Sponsor/Pressure/Rival selection. Fame is a signal, not a universal upgrade currency. Existing HQ ownership remains compatible for old saves, while fresh-Career Expedition-affecting effects are explicitly gated.

**Tech Stack:** TypeScript 6, React 19, current unlockManager/unlockCheck, Band HQ, assets, quest system, typed Career reducer/persistence, Node/Vitest/Playwright.

---

## Authority and dependencies

```text
approved design spec > master plan > this child plan
G5 depends on G1B + G2 + G3 + G4
```

G5 is the first gate allowed to require Between-Tour decisions, facility purchases, Ascension and Legendary acquisition.

---

## File structure

**Create:**

- `src/data/expedition/regions.ts`
- `src/data/expedition/tourTypes.ts`
- `src/data/expedition/meta.ts`
- `src/data/expedition/hqFacilities.ts`
- `src/data/expedition/unlockSets.ts`
- `src/data/expedition/starterPerks.ts`
- `src/data/expedition/tourPressure.ts`
- `src/data/expedition/legendary.ts`
- `src/domain/expedition/meta.ts`
- `src/domain/expedition/routeProfile.ts`
- `src/domain/expedition/fame.ts`
- `src/domain/expedition/capabilities.ts`
- `src/domain/expedition/hqPolicy.ts`
- `src/domain/expedition/ascension.ts`
- `src/domain/expedition/legendary.ts`
- `src/domain/expedition/betweenTours.ts`
- `src/domain/expedition/archive.ts`
- `src/ui/expedition/ExpeditionMetaTab.tsx`
- `src/ui/expedition/BetweenTourDecisions.tsx`
- `src/ui/expedition/LegendaryRewardPanel.tsx`
- `tests/node/expeditionMeta.test.js`
- `tests/node/expeditionRouteProfile.test.js`
- `tests/node/expeditionFame.test.js`
- `tests/node/expeditionHqPolicy.test.js`
- `tests/node/expeditionAscension.test.js`
- `tests/node/expeditionLegendary.test.js`
- `tests/node/expeditionBetweenTours.test.js`
- `tests/node/expeditionArchive.test.js`

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
- `src/context/reducers/expeditionSanitizers.ts`
- `src/domain/expedition/effectiveRules.ts`
- `src/domain/expedition/map.ts`
- `src/domain/expedition/loadout.ts`
- `src/domain/expedition/sponsors.ts`
- `src/domain/expedition/pressure.ts`
- `src/domain/expedition/rivals.ts`
- `src/utils/unlockManager.ts`
- `src/utils/unlockCheck.ts`
- `src/data/upgradeCatalog.ts`
- `src/utils/purchaseLogicUtils.ts`
- `src/ui/bandhq/hooks/usePurchaseLogic.ts`
- Run Summary / Tour Prep owners
- `public/locales/en/ui.json`
- `public/locales/de/ui.json`

---

## Task 1: Define exact Career economy and rank derivation

Extend G3 Career state:

```ts
export type ExpeditionCareerRank =
  | 'rookie'
  | 'roadtested'
  | 'headliner'
  | 'cult_legend'

export interface ExpeditionCareerProgress {
  tourTokens: number
  finalizedExpeditionRuns: number
  completedExpeditionRuns: number
  completedExpeditionRegionIds: string[]
  settledExpeditionRunIds: string[]
}
```

Token awards:

```text
failed outcome                +0
extracted outcome             +1
completed outcome             +2
first completed/extracted Region +1 once
validated meta-unlock quest milestone +1 once/run maximum
```

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

```ts
SETTLE_EXPEDITION_CAREER_RESULT { runId: string }
```

Reducer proves finalized G1 outcome, rejects settled ids, derives counters/Region/Tokens/rank from canonical outcome+quest evidence and applies once.

---

## Task 2: Complete the single numeric effective-rules composition path

Final v1 order:

```text
Base
-> Region numeric profile
-> Tour numeric profile
-> G2 Chassis
-> G2 installed modules
-> selected/available G3 Crew
-> Starter Perk
-> G4 Run Draft traits
-> Tour Pressure modifiers
-> G4 Nemesis numeric pressure
-> persistent Legendary flags
```

Every field in G2's `EffectiveExpeditionRules` must name one production consumer. No Region/Tour id-specific numeric branches outside this function.

---

## Task 3: Define one canonical Region/Tour route-pressure profile

Numeric rules are insufficient for route/content identity. Create exactly one non-numeric/weight owner:

```ts
export interface ExpeditionRoutePressureProfile {
  supplyNodeWeightMultiplier: number
  technicalNodeWeightMultiplier: number
  festivalHighProfileNodeWeightMultiplier: number
  sponsorContractEventWeightMultiplier: number
  undergroundNodeWeightMultiplier: number
  rivalNodeWeightMultiplier: number
  gigNodeWeightMultiplier: number
  recoveryNodeWeightMultiplier: number
  forcedRival: boolean
}

export const getExpeditionRoutePressureProfile = (
  state: GameState
): ExpeditionRoutePressureProfile
```

Composition order:

```text
Base -> Region -> Tour Type -> Fame access/high-profile signal -> Nemesis route pressure
```

Consumers:

```text
G1 buildExpeditionMap              -> node/subtype weights + forced Rival route opportunity
G4 buildPreparedSponsorOffers      -> sponsorContractEventWeightMultiplier in offer scoring
G4 Pressure Director               -> sponsor/contract/rival family weight bias
G4 selectExpeditionRivalForRun     -> forcedRival + rivalNodeWeightMultiplier
G6                                -> imports this exact production helper
```

Initial Region route profiles:

```text
home
  all 1.00

industrial
  supply 1.25 | technical 1.25 | recovery 1.05

festival
  festival/high-profile 1.30 | gig 1.10 | rival 1.10

corporate
  sponsor/contract 1.30 | festival/high-profile 1.10

underground
  underground 1.35 | rival 1.10 | recovery 0.90
```

Initial Tour route profiles:

```text
standard
  all 1.00 | forcedRival false

blitz
  gig 1.25 | recovery 0.90 | forcedRival false

underground
  underground 1.30 | sponsor/contract 0.90 | forcedRival false

corporate
  sponsor/contract 1.25 | festival/high-profile 1.10 | forcedRival false

rival_hunt
  rival 1.50 | forcedRival true

survival
  recovery 0.70 | technical 1.20 | forcedRival false
```

All weight multipliers clamp `0.25..3.0`.

---

## Task 4: Define mechanically distinct Regions/Tours and bounded passive Intel

Regions:

```text
home
  numeric baseline

industrial
  roadWear x1.15
  repairCost x0.90

festival
  Exposure gain x1.20
  technical wear x1.10
  Rival event weight x1.10

corporate
  Authority event weight x1.15
  Contract reward x1.10
  Heat >=60 makes corporate Sponsor category ineligible

underground
  rare reward x1.20
  Heat gain x1.15
  Authority event weight x1.20
```

Tours:

```text
standard
  depth 8 | extraction [3,6]

blitz
  depth 6 | extraction [2,4] | completion x0.95

underground
  depth 8 | extraction [3,6] | starting Heat +10

corporate
  depth 8 | extraction [3,6] | Contract reward x1.10

rival_hunt
  depth 8 | extraction [3,6] | Rival event weight x1.30

survival
  depth 9 | extraction [4,7] | completion x1.20
```

Passive Intel:

```text
completed Region familiarity -> Level-0 presence hint for repair OR Sponsor opportunity
headliner/cult_legend rank   -> Level-0 Rival/Sponsor category presence
G2 authorityIntelBonus       -> qualitative Authority band one level earlier
reputationByRegion threshold -> one Level-0 -> Level-1 reveal for a matching Region node per route step, never Level 2
```

Exact reputation entitlement:

```text
reputationByRegion[region] >= 50 -> one bounded familiarity reveal per route step
```

Scout/Contact/Social remain required for broader/exact information.

---

## Task 5: Restore Fame as a Career/pressure signal, not a universal upgrade currency

Use canonical `state.player.fame`.

```ts
export interface ExpeditionFameProfile {
  band: 'unknown' | 'local' | 'underground' | 'rising' | 'touring' | 'headliner'
  accessTier: 0 | 1 | 2 | 3 | 4 | 5
  expectationPressure: number
  sponsorQualityBias: 0 | 1 | 2
  rivalAttentionMultiplier: number
  highProfileNodeWeightMultiplier: number
}
```

Initial bands:

```text
0..249       unknown      access 0 | expectation 0  | sponsor +0 | Rival x1.00 | high-profile x0.90
250..999     local        access 1 | expectation 10 | sponsor +0 | Rival x1.05 | high-profile x1.00
1000..2499   underground  access 2 | expectation 25 | sponsor +1 | Rival x1.10 | high-profile x1.05
2500..4999   rising       access 3 | expectation 40 | sponsor +1 | Rival x1.20 | high-profile x1.10
5000..9999   touring      access 4 | expectation 60 | sponsor +2 | Rival x1.35 | high-profile x1.20
>=10000      headliner    access 5 | expectation 80 | sponsor +2 | Rival x1.50 | high-profile x1.30
```

Consumers:

```text
G4 PressureDirectorContext.fameExpectationPressure
G4 prepared Sponsor offer score/pool quality bias
G4 Rival selection/event weight
Task 3 high-profile route weight
high-profile access checks where content requires a minimum accessTier
```

Career rank still uses accomplishments from Task 1 and never derives solely from Fame.

Tests hold other state constant and prove Fame changes these signals without directly buying Expedition permanent capabilities.

---

## Task 6: Define exact HQ facility registry with only implemented purchasable levels

```ts
export type HqFacilityId =
  | 'workshop'
  | 'rehearsal'
  | 'management_office'
  | 'garage'
  | 'black_market_contact'
  | 'crew_lounge'

export const HQ_FACILITY_MAX_IMPLEMENTED_LEVEL = {
  workshop: 1,
  rehearsal: 1,
  management_office: 2,
  garage: 1,
  black_market_contact: 1,
  crew_lounge: 1
} as const

export const HQ_FACILITY_LEVEL_COSTS = {
  1: 2,
  2: 4
} as const
```

```ts
PURCHASE_EXPEDITION_HQ_FACILITY {
  facilityId: HqFacilityId
  expectedLevel: 0 | 1
}
```

Reducer validates known id/current level, refuses target above that facility's `maxImplementedLevel`, derives cost and debits tokens once.

Every purchasable level has a v1 consumer:

```text
Workshop L1            mechanic_network
Rehearsal L1           festival_network
Management Office L1   industry_network
Management Office L2   rival_network
Garage L1              chassis_network
Black Market L1        underground_network
Crew Lounge L1         crew_network
```

Registry test fails if a purchasable level has zero capability consumers.

---

## Task 7: Define exact unlock sets, costs, ranks and facilities

```text
mechanic_network
  cost 2 | rookie | Workshop L1
  industrial Region, survival Tour, mechanic_kit, advanced inspection

industry_network
  cost 3 | roadtested | Management Office L1
  Manager Crew, corporate Region/Tour, press_pass, premium Sponsor/Contract pool

underground_network
  cost 3 | roadtested | Black Market L1
  Security Crew, underground Region/Tour, underground_contact, Black Market content

festival_network
  cost 3 | roadtested | Rehearsal L1
  festival Region, blitz Tour, rehearsed_set, performance Contract pool

crew_network
  cost 4 | roadtested | Crew Lounge L1
  G3 signature-trait capability

chassis_network
  cost 5 | headliner | Garage L1
  higher-tier coach/armored-hauler Expedition availability when actually owned/purchasable

rival_network
  cost 5 | headliner | Management Office L2
  rival_hunt Tour + persistent Rival quest continuation
```

`isExpeditionCapabilityUnlocked(unlocks, capabilityId)` is the only set-derived capability resolver. Crew/Region/Tour/Perk availability calls it.

Unlock purchase uses crash-safe debit/pending/persist-marker/complete/rollback journal and revalidates facility/rank/token cost in the reducer.

---

## Task 8: Fully classify the existing unified HQ/Van upgrade catalog for Expedition

Do not leave `HQ_ITEMS.van` outside the policy.

```ts
export type ExpeditionLegacyHqPolicy =
  | { kind: 'unaffected' }
  | { kind: 'between_tours_only' }
  | { kind: 'requires_roadtested' }
  | { kind: 'requires_headliner' }
  | { kind: 'requires_capability'; capabilitySetId: string }
```

Exact high-impact current ids:

```text
hq_van_suspension        requires_roadtested
hq_van_tyre_spare        requires_roadtested
hq_van_tuning            requires_headliner
hq_van_sound_system      between_tours_only
hq_van_mattress          between_tours_only
hq_van_storage           requires_capability(chassis_network)
hq_van_sleeping_bags     between_tours_only
hq_van_tape_glue         between_tours_only
hq_van_paint_job         requires_roadtested
hq_van_spoiler           requires_roadtested
hq_van_disco             requires_roadtested
hq_van_flamethrower      requires_headliner

hq_room_coffee            between_tours_only
hq_room_sofa              between_tours_only
hq_room_cheap_beer_fridge between_tours_only
hq_room_cat               requires_roadtested
hq_room_marketing         requires_roadtested
hq_room_skull             requires_roadtested
pr_manager_contract       requires_capability(industry_network)
hq_room_beer_pipeline     requires_headliner
```

For every other current `getUnifiedUpgradeCatalog()` entry, `classifyExpeditionLegacyHqItem(item)` must return `unaffected` **only if** all canonical effects are proven not to touch:

```text
Harmony/recovery
travel/Fuel/vehicle breakdown
inventory/cargo capacity
Fame/Exposure/Sponsor/Rival signal
active performance modifiers
Expedition repair/Condition/Pressure inputs
```

If an effect touches one of those domains and the id is not in the explicit high-impact table, the catalog-policy test fails. There is no permissive unknown fallback.

Semantics:

```text
between_tours_only -> ownership remains, active-Expedition effect ignored
requires_*         -> old saves keep ownership; fresh purchase blocked until gate
unaffected         -> normal legacy behavior
```

Fresh Career before first finalized Expedition:

```text
newly purchased Expedition-affecting HQ/Van advantage = 0
```

---

## Task 9: Add starter perks as bounded build options

```text
mechanic_kit        startingSpareParts +1
press_pass          Exposure gain x1.10 + Sponsor quality option; no guaranteed payout
underground_contact startingHeat +5 + one Underground opportunity category reveal
rehearsed_set       first major Gig/run +20 setupProtection to current lowest technical group
```

Starter perks feed `getEffectiveExpeditionRules` or one named run marker. Legendary ids are never legal starter perks.

---

## Task 10: Make Ascension naturally earnable before Tour Pressure can be selected

Pressure registry:

```text
bad_roads         reward +0.15 | road wear x1.30
media_frenzy      reward +0.20 | Exposure gain x2.00
no_safety_net     reward +0.25 | extraction retention x0.75 | bounded severe-relief bypass
union_trouble     reward +0.15 | positive Crew Stress x1.25
hostile_territory reward +0.20 | Rival weight x1.50
```

Maximum 3 unique modifiers. G1 validator enforces registry/uniqueness/max3/`career.ascensionUnlocked`.

Ascension eligibility:

```text
rank >= headliner
AND at least 3 Expedition unlock-set markers owned
AND quest_expedition_meta_unlock completed at least once
```

Typed transition:

```ts
UNLOCK_EXPEDITION_ASCENSION { runId: string }
```

Reducer requires the referenced finalized/settled run, recomputes all eligibility from Career/unlocks/quests and sets `career.ascensionUnlocked = true` once. No caller supplies a boolean.

G6 fixtures that need Ascension must execute this production transition with a fixture that satisfies the real prerequisites; direct state seeding is forbidden except dedicated sanitizer tests.

---

## Task 11: Keep five Legendary capabilities rule-changing and make them earnable

Persistent markers:

```text
expedition.legendary.safe_harbor
expedition.legendary.the_fixer
expedition.legendary.nemesis_key
expedition.legendary.ghost_route
expedition.legendary.salvage_rights
```

Transforms:

```text
Safe Harbor
  once/run after second normal extraction window -> one extra valid extraction opportunity at next non-Finale node

The Fixer
  once/run excuse one failed non-tour-ending Contract; no payout, failure penalty skipped

Nemesis Key
  active Nemesis >=2 -> one effective shortcut edge to Rival Encounter/Finale branch

Ghost Route
  once/run convert one eligible severe Authority opportunity into deterministic Underground alternative

Salvage Rights
  once/run when technical group would reach 0 -> keep at 20 by sacrificing one unsecured rare reward; else 2 spare parts; otherwise unavailable
```

Natural acquisition mapping from a successfully completed Finale:

```text
regional_headliner -> Safe Harbor
corporate_showcase -> The Fixer
rival_battle       -> Nemesis Key
illegal_show       -> Ghost Route
disaster_gig       -> Salvage Rights
contract_special   -> first unowned capability in the above order
```

Eligibility:

```text
Career rank >= headliner
matching finalized successful Finale
mapped capability not already owned
run has not already claimed a Legendary
```

Action:

```ts
COMMIT_EXPEDITION_LEGENDARY_REWARD {
  runId: string
  expectedCapabilityId: string
}
```

Reducer recomputes candidate from finalized Finale; expected id is a stale guard. Run Summary persists marker through `unlockManager`; persistence must succeed and `ADD_UNLOCK` must commit before Career settlement/Next Tour controls unlock. Failure offers retry and does not mint Career progression.

At least one linked Career integration test earns a Legendary naturally. G6 direct capability fixtures are only for exhaustive activation edge coverage.

---

## Task 12: Tour Archive records discovery only

Categories:

```text
Crew | modules | chassis | Rivals | Sponsors | Regions | Finales | special events | Contraband
```

```ts
RECORD_EXPEDITION_ARCHIVE_DISCOVERY {
  category: ExpeditionArchiveCategory
  id: string
  sourceId: string
}
```

Reducer validates canonical registry/current observed source. Archive never grants capability ownership and is not a mandatory completion gate.

---

## Task 13: Implement exact persisted 1–3 Between-Tour decisions with deterministic targets

```ts
export type BetweenTourDecisionType =
  | 'injury_rehab'
  | 'crew_debrief'
  | 'rival_response'
  | 'sponsor_follow_up'
  | 'vehicle_repair'
  | 'network_contact'

export type BetweenTourTarget =
  | { kind: 'crew'; id: string }
  | { kind: 'band'; id: string }
  | { kind: 'rival'; id: string }
  | { kind: 'sponsor'; id: string }
  | { kind: 'vehicle'; id: 'active_van' }
  | { kind: 'archive'; id: string }

export interface BetweenTourDecisionInstance {
  id: string
  type: BetweenTourDecisionType
  target: BetweenTourTarget
  optionIds: string[]
}

export interface BetweenTourRunState {
  runId: string
  decisions: BetweenTourDecisionInstance[]
  resolvedOptionByDecisionId: Record<string, string>
}
```

G5 replaces G3's placeholder `betweenTourByRunId` with the final typed record.

Decision selection priority and target rules:

```text
1. injury_rehab
   first serious Crew recovery debt by created run order then crew id;
   otherwise highest-stage persistent Band consequence, id lexical

2. crew_debrief
   if any G3 signature-eligible selected Crew exists:
     choose lowest Loyalty among eligible, then id
     options include develop_signature
   else:
     choose lowest Loyalty selected Crew, then id
     develop_signature is NOT offered

3. rival_response
   exact persistent Rival encountered this run; highest Nemesis then id

4. sponsor_follow_up
   exact Sponsor obligation from run; lexical deal id if multiple

5. vehicle_repair
   target active_van when condition <75

6. network_contact
   deterministic eligible Archive lead; fallback when no other decision exists
```

Choose 1–3 distinct instances in priority order. Run seed only breaks genuinely equal lower-priority choices.

Exact options:

```text
injury_rehab
  pay_rehab:
    Crew target -> €300 Career Cash, call G3 resolveCrewRecoveryDebt(...,'rehab')
    Band target -> €300, reduce persistent consequence one stage
  accept_unavailability:
    Crew target -> cost 0, Crew remains unavailable for next Tour
    Band target -> leave consequence unchanged

crew_debrief
  rest_band -> target Crew Loyalty +1, capped 100
  develop_signature -> only when this exact target is currently G3 signature-eligible; create G3 career_development proof and acquire trait

rival_response
  confront -> next-run Rival-presence preference marker
  cool_down -> next-run Rival weight x0.75 marker; forfeit one Rival rare opportunity

sponsor_follow_up
  keep_relationship -> next Sponsor weighting +1 bounded tier
  walk_away -> clear preference; next Sponsor obligation pressure -1 bounded tier

vehicle_repair
  pay_repair -> ceil((100-condition)*€12), set canonical van condition 100
  carry_damage -> no change

network_contact
  follow_lead -> one deterministic Archive discovery
  cash_out -> +€200 Career Cash, no discovery
```

```ts
RESOLVE_EXPEDITION_BETWEEN_TOUR_DECISION {
  runId: string
  decisionId: string
  optionId: string
}
```

Reducer derives all target/effect values from stored decision+registry.

### Served-unavailable-tour expiry

After each later finalized Tour, before creating new Between-Tour decisions:

```text
for every pre-existing CrewRecoveryDebt:
  if that crewId was NOT selected in the just-finalized run
  -> call G3 resolveCrewRecoveryDebt(...,'served_unavailable_tour')
  -> clear debt after its one required skipped Tour
```

Selected/injured-again Crew do not accidentally expire debt. Tests cover multiple debts and multiple signature candidates.

`PREPARE_NEXT_EXPEDITION` UI/selector is enabled only after every stored decision for the finalized run is resolved and any required Legendary persistence barrier has cleared.

---

## Task 14: Verification

Run:

```bash
pnpm run test:node
pnpm run test:ui
pnpm run typecheck:core
pnpm run deadcode:check
```

Expected: PASS.

Required integration evidence:

```text
Region/Tour non-numeric weights alter production map/offer/Rival choices
Fame changes expectation/Sponsor/Rival/high-profile access without buying permanent power
all purchasable facility levels have real v1 consumers
existing Expedition-affecting Van/HQ items cannot bypass fresh-Career meta gate
real Career earns Ascension through prerequisites
real completed Finale can earn/persist one Legendary naturally
multiple Crew injury debts and multiple signature candidates target deterministically
one skipped Tour clears serious Crew recovery debt
Next Tour blocked until G5 decisions/Legendary barrier complete
```

---

## G5 exit criteria

- Tour Tokens/ranks/facility/unlock-set economics are exact and reducer-derived.
- Region/Tour route/content rules use one typed production route-pressure profile, not hidden id branches.
- Fame again affects access, expectation pressure, Sponsor quality and Rival attention without becoming the sole meta currency.
- Every purchasable facility level unlocks at least one real v1 capability; dead L2/L3 sinks are impossible.
- The complete current Expedition-affecting Van/HQ path is classified/gated for fresh Career.
- Ascension has a real earn path; G6 may not simply seed the flag.
- Legendary transforms are naturally earnable from finalized Finales with crash-safe persistence.
- Between-Tour decisions have exact actor targets, options, replay guards and recovery-debt expiry.
