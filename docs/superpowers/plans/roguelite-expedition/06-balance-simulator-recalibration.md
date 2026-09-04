# Balance Simulator Recalibration and Production-Evidence Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the balance evidence around production-valid Expedition mechanics, with six concrete strategy profiles, disjoint calibration/holdout cohorts, extraction/skill/Fog counterfactuals, fresh-Career progression sequences, natural meta acquisition evidence and real runtime samples.

**Architecture:** G6 never reimplements gameplay formulas. Single-run strategy cohorts may use explicitly recorded late-game fixture prerequisites to compare mature builds; fresh-Career cohorts start from baseline and acquire every facility/capability/Ascension/Legendary only through production transitions. Every release metric is accepted only if the measured mechanic has a real production owner and app-side test.

**Tech Stack:** Node ESM scripts, current production TypeScript helpers imported through tsx/build adapters where required, deterministic RNG, JSON/Markdown reports, Node/Vitest/Playwright.

---

## Authority and dependencies

```text
approved design spec > master plan > G1-G5 production contracts > this G6 plan
```

G6 runs only after G1-G5 are green.

---

## File structure

**Create:**

- `scripts/game-balance-expedition-profiles.mjs`
- `scripts/game-balance-expedition-runner.mjs`
- `scripts/game-balance-expedition-career.mjs`
- `scripts/game-balance-expedition-extraction-probe.mjs`
- `scripts/game-balance-expedition-skill-probe.mjs`
- `scripts/game-balance-expedition-fog-probe.mjs`
- `scripts/game-balance-expedition-runtime-report.mjs`
- `tests/node/gameBalanceExpeditionProfiles.test.js`
- `tests/node/gameBalanceExpeditionRunner.test.js`
- `tests/node/gameBalanceExpeditionCareer.test.js`
- `tests/node/gameBalanceExpeditionExtractionProbe.test.js`
- `tests/node/gameBalanceExpeditionSkillProbe.test.js`
- `tests/node/gameBalanceExpeditionFogProbe.test.js`
- `docs/superpowers/reports/roguelite-expedition-v15-balance.md`
- `docs/superpowers/reports/roguelite-expedition-v15-balance.json`

**Modify:**

- `scripts/AGENTS.md`
- package scripts for balance execution
- existing production helpers only when an import-safe adapter is needed; formulas remain owned by G1-G5

---

## Task 1: Cut the simulator from historical day horizon to Expedition terminal outcomes

Historical v14 remains frozen. v15 uses:

```text
namespace #roguelite-expedition-v1
route depth from production TourTypeDefinition
terminal outcome: extracted | completed | failed
extraction windows from production TourTypeDefinition
```

Update `scripts/AGENTS.md` in the same change:

```text
v14 historical harness keeps its 10-hop/daysPerRun semantics
v15 Expedition harness must not use daysPerRun as a terminal condition
route-step checkpoints replace day checkpoints
all production RNG/provenance/reproducibility rules remain mandatory
```

Hard test fails if v15 imports/reads the old day-horizon constant for termination.

---

## Task 2: Define the complete concrete strategy-profile schema

```ts
export interface ExpeditionBalanceProfile {
  id: string
  tourTypeId: 'standard' | 'blitz' | 'underground' | 'corporate' | 'rival_hunt' | 'survival'
  regionId: 'home' | 'industrial' | 'festival' | 'corporate' | 'underground'
  chassisSpec: {
    flavor: 'legit' | 'diy'
    tier: 1 | 2 | 3
    expectedArchetype: 'compact' | 'diy' | 'coach' | 'armored_hauler'
  }
  requiredModuleIds: string[]
  crewRoleOrder: Array<'technician' | 'roadie' | 'driver' | 'manager' | 'scout' | 'security'>
  starterPerkId: null | 'mechanic_kit' | 'press_pass' | 'underground_contact' | 'rehearsed_set'
  insurancePolicyId: null | 'roadside' | 'equipment' | 'touring'
  pressureModifierIds: Array<'bad_roads' | 'media_frenzy' | 'no_safety_net' | 'union_trouble' | 'hostile_territory'>
  nativeContractPreferenceIds: string[]
  sponsorPolicy: 'none' | 'highest_clean_value' | 'highest_exposure_value' | 'highest_nonrival_value'
  cargoPolicy: 'safe' | 'balanced' | 'merch' | 'contraband'
  setlistPolicy: 'balanced_four' | 'lowest_difficulty_four' | 'highest_energy_four'
  equipmentPolicy: 'current_selection' | 'best_owned_selection'
  startingFuelTarget: number
  protectedCashRatio: number
  decisionPolicy: ExpeditionDecisionPolicy
  requiredCapabilitySetIds: string[]
  requiresAscension: boolean
}
```

No hidden Fuel/Cash/module/Sponsor/Contract/equipment defaults exist outside the six objects.

---

## Task 3: Instantiate six production-valid mature-build strategies

```js
export const EXPEDITION_BALANCE_PROFILES = [
  {
    id: 'clean_sponsor',
    tourTypeId: 'corporate',
    regionId: 'corporate',
    chassisSpec: { flavor: 'legit', tier: 2, expectedArchetype: 'coach' },
    requiredModuleIds: ['tb_solar_panel', 'tb_sleeping_bunks'],
    crewRoleOrder: ['manager', 'roadie', 'scout'],
    starterPerkId: 'press_pass',
    insurancePolicyId: 'touring',
    pressureModifierIds: [],
    nativeContractPreferenceIds: ['contract_keep_it_clean', 'contract_three_good_gigs'],
    sponsorPolicy: 'highest_clean_value',
    cargoPolicy: 'safe',
    setlistPolicy: 'balanced_four',
    equipmentPolicy: 'best_owned_selection',
    startingFuelTarget: 90,
    protectedCashRatio: 0.40,
    requiredCapabilitySetIds: ['industry_network', 'chassis_network'],
    requiresAscension: false,
    decisionPolicy: 'safe_value'
  },
  {
    id: 'underground_heat',
    tourTypeId: 'underground',
    regionId: 'underground',
    chassisSpec: { flavor: 'diy', tier: 3, expectedArchetype: 'armored_hauler' },
    requiredModuleIds: ['tb_gps_jammer', 'tb_trailer_hitch', 'tb_roof_rack'],
    crewRoleOrder: ['security', 'driver', 'scout'],
    starterPerkId: 'underground_contact',
    insurancePolicyId: 'roadside',
    pressureModifierIds: ['media_frenzy', 'hostile_territory'],
    nativeContractPreferenceIds: ['contract_all_in'],
    sponsorPolicy: 'none',
    cargoPolicy: 'contraband',
    setlistPolicy: 'highest_energy_four',
    equipmentPolicy: 'best_owned_selection',
    startingFuelTarget: 95,
    protectedCashRatio: 0.15,
    requiredCapabilitySetIds: ['underground_network', 'chassis_network'],
    requiresAscension: true,
    decisionPolicy: 'push_heat'
  },
  {
    id: 'diy_repair',
    tourTypeId: 'survival',
    regionId: 'industrial',
    chassisSpec: { flavor: 'diy', tier: 2, expectedArchetype: 'diy' },
    requiredModuleIds: ['tb_cb_radio_mesh', 'tb_roof_rack', 'tb_sleeping_bunks'],
    crewRoleOrder: ['technician', 'roadie', 'driver'],
    starterPerkId: 'mechanic_kit',
    insurancePolicyId: 'equipment',
    pressureModifierIds: ['bad_roads'],
    nativeContractPreferenceIds: ['contract_route_target'],
    sponsorPolicy: 'none',
    cargoPolicy: 'balanced',
    setlistPolicy: 'lowest_difficulty_four',
    equipmentPolicy: 'current_selection',
    startingFuelTarget: 85,
    protectedCashRatio: 0.30,
    requiredCapabilitySetIds: ['mechanic_network'],
    requiresAscension: true,
    decisionPolicy: 'repair_first'
  },
  {
    id: 'scout_intel',
    tourTypeId: 'standard',
    regionId: 'home',
    chassisSpec: { flavor: 'legit', tier: 1, expectedArchetype: 'compact' },
    requiredModuleIds: ['tb_gps_jammer', 'tb_solar_panel'],
    crewRoleOrder: ['scout', 'manager', 'driver'],
    starterPerkId: null,
    insurancePolicyId: 'roadside',
    pressureModifierIds: [],
    nativeContractPreferenceIds: ['contract_route_target'],
    sponsorPolicy: 'none',
    cargoPolicy: 'safe',
    setlistPolicy: 'balanced_four',
    equipmentPolicy: 'current_selection',
    startingFuelTarget: 80,
    protectedCashRatio: 0.35,
    requiredCapabilitySetIds: ['industry_network'],
    requiresAscension: false,
    decisionPolicy: 'intel_then_value'
  },
  {
    id: 'high_exposure_performance',
    tourTypeId: 'blitz',
    regionId: 'festival',
    chassisSpec: { flavor: 'legit', tier: 2, expectedArchetype: 'coach' },
    requiredModuleIds: ['tb_subwoofer_stack', 'tb_side_graphics', 'tb_sleeping_bunks'],
    crewRoleOrder: ['roadie', 'manager', 'scout'],
    starterPerkId: 'rehearsed_set',
    insurancePolicyId: 'equipment',
    pressureModifierIds: ['media_frenzy'],
    nativeContractPreferenceIds: ['contract_three_good_gigs', 'contract_no_rest_finale'],
    sponsorPolicy: 'highest_exposure_value',
    cargoPolicy: 'merch',
    setlistPolicy: 'highest_energy_four',
    equipmentPolicy: 'best_owned_selection',
    startingFuelTarget: 90,
    protectedCashRatio: 0.25,
    requiredCapabilitySetIds: ['festival_network', 'industry_network', 'chassis_network'],
    requiresAscension: true,
    decisionPolicy: 'performance_push'
  },
  {
    id: 'rival_hunter',
    tourTypeId: 'rival_hunt',
    regionId: 'festival',
    chassisSpec: { flavor: 'diy', tier: 2, expectedArchetype: 'diy' },
    requiredModuleIds: ['tb_gps_jammer', 'tb_subwoofer_stack', 'tb_side_graphics'],
    crewRoleOrder: ['security', 'scout', 'driver'],
    starterPerkId: 'rehearsed_set',
    insurancePolicyId: 'touring',
    pressureModifierIds: ['hostile_territory'],
    nativeContractPreferenceIds: ['contract_all_in', 'contract_no_rest_finale'],
    sponsorPolicy: 'highest_nonrival_value',
    cargoPolicy: 'balanced',
    setlistPolicy: 'highest_energy_four',
    equipmentPolicy: 'best_owned_selection',
    startingFuelTarget: 95,
    protectedCashRatio: 0.20,
    requiredCapabilitySetIds: ['festival_network', 'underground_network', 'rival_network'],
    requiresAscension: true,
    decisionPolicy: 'rival_pressure'
  }
]
```

Important corrections:

```text
scout_intel declares industry_network because Manager is not baseline
rival_hunter declares underground_network because Security is not baseline
clean_sponsor/high_exposure declare chassis_network because legit tier2 maps to coach
```

Profile test constructs each strategy using **only its declared capability provenance** and fails on any hidden capability assumption.

It also imports G2 `getExpeditionChassisArchetype` and rejects any repeated hard-coded mapping drift.

---

## Task 4: Build mature single-run loadouts through production owners only

```js
export const buildProductionSimulationLoadout = (
  fixtureState,
  profile,
  seed
) => validatedActiveState
```

This builder is for mature single-run strategy comparisons only.

Exact sequence:

```text
1. start from createInitialState or supplied linked mature fixture
2. record required capability-set fixture markers in provenance
3. if requiresAscension:
     fixture must satisfy real G5 rank/set/quest prerequisites
     dispatch UNLOCK_EXPEDITION_ASCENSION; direct boolean seeding forbidden
4. ensure exact production chassis exists through purchase/asset fixture path
5. install required modules through production INSTALL_MODULE; failure throws
6. resolve exact archetype through G2 production helper; mismatch throws
7. choose Crew through isCrewAvailable; missing declared capability throws
8. equipment current_selection:
     use already selected legal G1 gear ids
   equipment best_owned_selection:
     call G1 getExpeditionOwnedPerformanceGear
     choose deterministic legal run-selection by canonical effect utility then lexical id
     DO NOT call a fictitious equip action
9. choose first four legal unique songs by profile policy; insufficient songs throws
10. dispatch G1 PREPARE_EXPEDITION_RUN with seed; assert root state.runSeed === seed
11. build prepared map from the exact root runSeed
12. dispatch G4 PREPARE_EXPEDITION_SPONSOR_OFFERS; select staged sponsorOfferId by policy; do not accept yet
13. build native Contract offers from G4 registry; accept legal preferences up to MAX_NATIVE_EXPEDITION_CONTRACTS and compatibility rules
14. materialize cargo from real owned inventory/stash according to policy
15. set exact startingFuelTarget and protectedCareerCash ratio
16. set insurance/perk/pressure ids exactly
17. validate with one G1 canonical loadout validator
18. dispatch production START_EXPEDITION; assert Sponsor acceptance/obligations occur now, status active and every commitment matches provenance
```

No fallback defaults. Invalid step throws with profile id + production validator reason.

Resolved provenance includes:

```json
{
  "profileId": "...",
  "seed": 123,
  "tourTypeId": "...",
  "regionId": "...",
  "chassis": {"flavor":"...","tier":2,"archetype":"..."},
  "moduleIds": ["..."],
  "crewIds": ["..."],
  "selectedGearItemIds": ["..."],
  "starterPerkId": "...",
  "insurancePolicyId": "...",
  "pressureModifierIds": ["..."],
  "sponsorOfferId": "...",
  "acceptedSponsorDealId": "...",
  "nativeContracts": [{"templateId":"...","targetNodeId":"..."}],
  "cargo": {"...":"materialized manifest summary"},
  "setlistSongIds": ["..."],
  "startingFuelTarget": 90,
  "protectedCareerCash": 1234,
  "fixtureCapabilitySetIds": ["..."]
}
```

---

## Task 5: Run production transitions, not simulator-only formulas

The runner imports/reuses:

```text
G1 map/loadout/arrival/extraction/failure/settlement helpers
G2 effective rules, cargo, Condition, repair, defect, insurance, travel/day policy
G3 Stress/relationship/injury/Career settlement helpers
G4 Sponsor staging/acceptance, Contracts, Double Down, Crowd Hype, Pressure, Rival, Finale, Draft helpers
G5 route-pressure/Fame/meta/facility/unlock/Ascension/Legendary/Between-Tour helpers
```

A metric is invalid if its production owner is absent or the runner copies a formula instead of importing/calling the owner.

Hard correctness gates:

```text
invalid loadout accepted
profile hidden fallback/default used
route disconnected/no Finale reachable
preview map differs from active map
active expense crosses protectedCareerCash
legacy daily wear double-applies Expedition travel wear
cargo consumer accesses omitted manifest
terminal settlement/reward materializes twice
unknown/forged Contract/Intel/Rival/Crew source changes state
PreGig zero-Condition/critical-incapacity softlock
same eligible Rival replaced by fresh id
Between-Tour unresolved but Next Tour enabled
simulator formula diverges from production helper
Sponsor payout occurs before START
```

---

## Task 6: Record rich single-run telemetry

Per profile/run:

```text
completion/extraction/failure + source
meaningful node count and route depth
Money/Fame retained
Fame band/expectation pressure
Fuel/vehicle/technical minima
repair mode/spend/minigame quality
defects created/revealed/triggered/resolved
insurance offered/bought/claimed/skipped
Authority safe exits offered/used/skipped
Crew Stress/injury/recovery state
Crowd Hype and realized combo bonus
Contract/Double-Down outcomes
Sponsor staged/accepted terms
same Rival id/Nemesis level
Finale type/result
selected chassis + exact modules + Crew combination
selected G1 gear ids
Intel levels/grants/recon uses/reputation reveals
route choices that consumed revealed information
secured/explicitly-extracted/abandoned rare rewards
```

---

## Task 7: Define soft balance corridors and strategy dominance

Tuneable hypotheses:

```text
Standard meaningful nodes approximately 7..9
completion/extraction/failure mix avoids near-certain single outcome
voluntary extraction is meaningful but not always optimal
repair/insurance/safe exits are optional, not universal tax
no chassis/module/Crew/gear combination dominates reward + survival + low risk in both calibration and holdout
all six profiles produce enough valid completed samples for comparison
```

Dominance blocks only when the same conclusion reproduces in disjoint calibration and holdout.

---

## Task 8: Generate disjoint single-run calibration and holdout cohorts

```text
6 profiles
2,000 runs/profile calibration
2,000 runs/profile holdout
```

Namespaces:

```text
#roguelite-expedition-v1#calibration
#roguelite-expedition-v1#holdout
```

Seed sets are provably disjoint. Same namespace+seed+profile reproduces identical provenance/result.

---

## Task 9: Add paired Extraction counterfactual with separate cohorts

At each legal extraction window clone canonical active state:

```text
A extract now using optimal legal explicit rare carry selection under profile policy
B continue using same downstream policy/RNG stream definition
```

Namespaces:

```text
#roguelite-expedition-v1#extraction#calibration
#roguelite-expedition-v1#extraction#holdout
```

Each: 2,000 paired states/profile/window.

Compare retained Money/Fame, rare rewards, later completion/failure probability, persistent consequences and meta progress.

---

## Task 10: Add paired skill-vs-management probe

Hold route, management snapshot, Condition, injuries, Finale profile, Crowd Hype and RNG constant.

```text
low skill       gig 45 | repair quality 0.35
competent       gig 70 | repair quality 0.70
high skill      gig 90 | repair quality 0.95
```

Use production hit/miss/stamina/combo/Hype/Condition/Injury/Finale and G2 repair resolver.

Report Gig result/reward, realized Hype combo bonus, technical wear, Crew/Band consequences, repair spend, Cash burden and terminal outcome.

Acceptance:

```text
management materially changes the situation
higher skill materially improves matched outcomes/resource burden
high Hype amplifies successful execution without automatically rescuing miss-heavy play
```

---

## Task 11: Add a matched Hybrid-Fog information counterfactual

This is a required release probe, not optional telemetry.

For a prepared state with at least two legal next nodes and a selected Scout (or separately a reputation reveal case), clone identical canonical state/map/RNG:

```text
A masked branch
  make route decision using only currently legal visible Level-0 information

B informed branch
  dispatch one real legal G1 REVEAL_EXPEDITION_NODE_INTEL through Scout recon
  make the route decision using the same decision policy after the reveal
```

The only difference before decision is legal information visibility; resources, map, RNG, build and policy are identical.

Separate reputation cohort:

```text
same Region/map/state
A reputation below G5 threshold
B reputation >=50 and consume one real bounded reputation reveal
```

Report:

```text
intel source/level
revealed fields actually inspected by decision policy
chosen node/edge in A vs B
expected value/risk difference at decision time
terminal/reward difference
recon/reputation reveal used but route unchanged rate
```

Blocking fidelity failure:

```text
Scout/reputation reveal system produces information in production
BUT across calibration+holdout the route policy never consumes it and choices are invariant because the revealed fields are not reachable by the decision policy
```

Use disjoint namespaces:

```text
#roguelite-expedition-v1#fog#calibration
#roguelite-expedition-v1#fog#holdout
```

2,000 matched states per applicable profile/source/cohort.

---

## Task 12: Split fresh-Career sequences from mature pre-seeded strategy cohorts

Fresh-Career metrics must never use `buildProductionSimulationLoadout`'s capability fixture seeding.

Create:

```js
runFreshCareerSequence(createInitialState(), personaProfile, sequenceSeed, 6)
```

Initial state rules:

```text
baseline initialState only
no Expedition facility levels
no Expedition unlock-set markers
ascensionUnlocked false
no Legendary markers
no synthetic persistent Rival history
no pre-seeded Tour Tokens/rank progression
```

For each run, build the **best currently legal approximation** of the persona profile:

```text
Tour fallback: requested if unlocked else standard
Region fallback: requested if unlocked else home
Chassis: requested if owned/legal else first owned legal Tourbus sorted legit tier1 then id
Modules: requested ids only when owned/unlocked/legal; never fixture-seed
Crew: walk crewRoleOrder and select only currently available roles, max 3
Starter perk: requested if unlocked else null
Pressure: requested only after real Ascension unlock; otherwise []
Sponsor: apply policy to current real staged offers
Contracts: apply legal preference ids up to real slot/compatibility limit
Equipment: choose only current real owned selection; never fixture-seed gear
Cargo/Setlist/Fuel/Cash: same deterministic policies with current legal ownership/resources
```

After each finalized run:

```text
1. persist/commit any naturally eligible Legendary through G5 action
2. SETTLE_EXPEDITION_CAREER_RESULT
3. SETTLE_EXPEDITION_CREW_CAREER
4. expire served-unavailable Crew debts through real G5/G3 source
5. build/resolve 1-3 G5 Between-Tour decisions using persona meta policy
6. perform at most one facility OR unlock-set purchase:
     first unmet persona required capability set prerequisite
     required facility before set
     then lowest rank, lowest token cost, lexical id
7. when real Ascension prerequisites become true, dispatch UNLOCK_EXPEDITION_ASCENSION
8. start next run through the fresh legal builder above
```

No permanent state is inserted just because the persona eventually wants it.

Fresh-Career cohorts:

```text
1,000 six-run sequences/profile calibration
1,000 six-run sequences/profile holdout
```

Record:

```text
firstRoadtestedRun
firstHeadlinerRun
firstMetaFacilityRun
firstPermanentExpeditionCapabilityRun
run1PermanentCapabilityPurchaseRate
run1LegacyExpeditionAffectingHqPurchaseRate
firstLegacyExpeditionAffectingHqPurchaseRun
firstAscensionUnlockRun
firstNaturalLegendaryRun
signatureTraitUnlockRun
betweenTourDecisionMean/type distribution
Crew recovery-debt duration
sameRivalReturnRate/Nemesis progression
```

Assertions:

```text
firstMetaFacilityRun cannot be 0 due to fixture seeding
firstPermanentExpeditionCapabilityRun cannot be 0 due to fixture seeding
fresh sequence provenance contains fixtureCapabilitySetIds: [] for every run
Ascension true only after recorded production unlock transition
Legendary ownership only after recorded natural acquisition transition
```

---

## Task 13: Keep explicit late-game Legendary activation coverage separate

In addition to natural acquisition evidence, create controlled late-career edge fixtures for all five capabilities and prove actual rule activation:

```text
Safe Harbor extra extraction
Fixer Contract forgiveness
Nemesis Key shortcut
Ghost Route conversion
Salvage Rights zero-Condition rescue
```

These fixtures do not contribute to first-acquisition Career timing metrics.

---

## Task 14: Collect real runtime/playtest duration evidence

```ts
export interface ExpeditionRuntimeSample {
  buildProfileId: string
  startedAtMs: number
  finalizedAtMs: number
  realDurationMs: number
  outcome: 'extracted' | 'completed' | 'failed'
  meaningfulNodes: number
}
```

Use repository clock conventions (`IClock`/`systemClock`) for capture code. Do not infer real minutes from simulator steps.

Release evidence for Standard reports median/p25/p75 real duration and compares the intended 20–30 minute target as a product corridor, not a synthetic hard correctness gate.

---

## Task 15: Produce v15 report and release gate

Report must clearly separate:

```text
hard correctness failures
single-run calibration corridors
single-run holdout confirmation
Extraction paired calibration/holdout
Skill paired evidence
Fog paired calibration/holdout
fresh-Career progression cohorts
late-game Legendary edge coverage
real runtime/playtest samples
```

The final report must include full resolved build provenance, capability provenance and cohort seed namespaces.

Run:

```bash
pnpm run test:node
pnpm run typecheck:core
pnpm run deadcode:check
pnpm run balance:expedition
```

Expected: PASS with no hard correctness failures before balance conclusions are accepted.

---

## G6 exit criteria

- All six mature profiles construct successfully from only declared capability provenance.
- `scout_intel` and `rival_hunter` no longer depend on undeclared Manager/Security capabilities; coach profiles declare chassis capability.
- Mature strategy cohorts and fresh-Career progression cohorts are separate data populations.
- Fresh Career starts with zero Expedition facility/set/Ascension/Legendary seeding and acquires meta only through production actions.
- Simulator imports G1-G5 production helpers instead of duplicating formulas.
- Extraction, skill and Hybrid-Fog decisions have matched counterfactual evidence with disjoint calibration/holdout streams.
- FoW report proves whether revealed information is actually consumed and changes route decisions when strategically relevant.
- Fame signal, optional safety choices, exact chassis/module/Crew/gear combinations and same-Rival history are observable.
- Natural Ascension/Legendary timing is measurable without synthetic contamination.
- Real 20–30 minute pacing evidence comes only from actual runtime/playtest samples.
