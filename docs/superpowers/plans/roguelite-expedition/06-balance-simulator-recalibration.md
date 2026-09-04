# Balance Simulator, Career Sequence and Expedition Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebase the balance harness onto production Expedition semantics and prove correctness, strategy diversity, push-your-luck extraction, cross-run meta timing and active-skill relevance without letting simulator-only formulas or hidden defaults stand in for shipped gameplay.

**Architecture:** Keep `scripts/game-balance-simulation.mjs` as the authoritative population runner but move Expedition profiles/metrics/Career sequences into focused utilities. Every gameplay transition uses production validators/helpers/reducers; G6 may choose deterministic policy decisions, but may not duplicate formulas. Real 20–30 minute pacing is measured separately from human/playtest runtime evidence because a headless simulator cannot prove real interaction time.

**Tech Stack:** Node.js ESM, `tsx` loader for production TypeScript helpers, deterministic seeds, existing reducer/domain modules, 2,000-run calibration + 2,000-run holdout cohorts, 1,000 six-run Career sequences/profile/cohort, Node tests, JSON/Markdown reports.

---

## Depends On

- G0 baseline snapshot runs before G1 changes.
- G1B complete route/lifecycle/failure/ledger.
- G2–G5 production helpers and app tests are green.

## File Structure

**Create:**

- `scripts/utils/expedition-balance-profiles.mjs`
- `scripts/utils/expedition-balance-metrics.mjs`
- `scripts/utils/expedition-career-simulation.mjs`
- `scripts/game-balance-expedition-probe.mjs`
- `scripts/game-balance-expedition-skill-probe.mjs`
- `scripts/expedition-playtest-summary.mjs`
- `tests/node/expedition-balance-profiles.test.js`
- `tests/node/expedition-balance-metrics.test.js`
- `tests/node/expedition-career-simulation.test.js`
- `tests/node/game-balance-expedition-probe.test.js`
- `tests/node/game-balance-expedition-skill-probe.test.js`
- `tests/node/expedition-playtest-summary.test.js`
- `tests/node/preExpeditionBalanceBaseline.test.js`

**Modify:**

- `scripts/game-balance-simulation.mjs`
- `scripts/utils/balance-report-metadata.mjs`
- `tests/node/game-balance-simulation.test.js`
- `tests/node/balanceSourceFiles.test.js`
- `package.json`
- production Run Summary/Expedition outcome telemetry owner from G1 for real-duration samples

---

## Task 1: Freeze the pre-Expedition v14 baseline before any semantic cutover

- [ ] **Step 1: Copy current report artifacts to immutable baseline names**

```text
reports/game-balance-pre-expedition-v14.json
reports/game-balance-pre-expedition-v14.md
```

- [ ] **Step 2: Add provenance test**

Pin report version, seed namespace, source fingerprint and the current baseline file hash. Fail when a later Expedition change rewrites the frozen baseline.

- [ ] **Step 3: Read current repository command contracts**

Before implementing G6, re-read root/nested `AGENTS.md`, `package.json` and `scripts/AGENTS.md`. The v15 plan may change horizon semantics only through an explicit report-version/seed-namespace cutover; do not silently violate current script instructions.

---

## Task 2: Define six complete production-valid strategy profiles

Profiles:

```text
clean_sponsor
underground_heat
diy_repair
scout_intel
high_exposure_performance
rival_hunter
```

A profile is a policy, not a partial fake loadout:

```ts
export interface ExpeditionBalanceProfile {
  id: string
  tourTypeId: string
  regionId: string
  chassisPreference: 'compact' | 'diy' | 'coach' | 'armored_hauler'
  crewRolePreference: string[]
  starterPerkId: null | 'mechanic_kit' | 'press_pass' | 'underground_contact' | 'rehearsed_set'
  insurancePolicyId: string | null
  pressureModifierIds: string[]
  contractPreference: string
  sponsorPreference: string
  cargoPolicy: 'safe' | 'balanced' | 'merch' | 'contraband'
  decisionPolicy: ExpeditionDecisionPolicy
}
```

No Legendary id appears in `starterPerkId`.

---

## Task 3: Build every simulation loadout through production owners

Add:

```js
export const buildProductionSimulationLoadout = (
  state,
  profile,
  seed
) => validatedLoadout
```

The builder must execute this deterministic sequence:

1. start from `createInitialState()` or linked Career state;
2. grant only profile-required capability markers through the same unlock-set/availability semantics as production;
3. call G1 `PREPARE_EXPEDITION_RUN` to fix prep id/seed;
4. use current valid setlist as the setlist commitment; if a profile needs a performance bias, choose among already-owned/currently legal songs with a deterministic sorted policy, never inject unknown song ids;
5. snapshot current normalized band equipment through G1 helper;
6. choose an actually owned/available tourbus chassis matching `chassisPreference`; if the fresh fixture owns none and the production validator permits `null`, use `null`, otherwise seed ownership through the same production asset fixture/setup path used by app tests;
7. derive installed module ids from the selected chassis; never pass simulator-only module ids;
8. choose up to three available Crew ids through `isCrewAvailable` and the profile role order;
9. build Cargo from actually owned inventory/stash content, deterministic lexical ordering and the production `materializeExpeditionCargo` capacity helper;
10. for Sponsor profiles, obtain/accept a real Brand Deal through the production offer/accept helper before committing `sponsorDealId`;
11. choose native Contracts only from the G4 registry and only when `buildContractOffer` proves the prepared route supports the target;
12. choose a legal Fuel target and protected Career Cash amount through G1 validation;
13. call `validateExpeditionLoadout` and then the production START action/reducer.

If a profile cannot construct a valid loadout, the simulator throws. It may not fall back to a hidden partial build.

Tests assert all six profiles pass production validation under both calibration and Career-sequence setup.

---

## Task 4: Cut the main simulator to Expedition route-horizon semantics

Bump report contract and use:

```js
reportVersion: 15
seedNamespace: '#roguelite-expedition-v1'
runsPerScenario: 2000
progressionCheckpointSteps: [2, 4, 6]
defensiveMaxIterations: 20
```

Remove day-horizon assumptions such as `daysPerRun`/legacy day checkpoint labels from the Expedition report path.

`runSingleSimulation(profile, seed)` must:

```text
prepare/start production-valid Expedition
advance only through legal route edges
settle travel/node/gig/event/repair/Contract/draft decisions through production helpers/reducers
stop only on extracted/completed/failed
throw on defensive iteration exhaustion rather than classify it as an ordinary failure
```

The same profile+seed must reproduce the same complete run result.

Calibration seeds:

```text
${profile.id}#roguelite-expedition-v1#calibration#${runIndex}
```

Holdout seeds:

```text
${profile.id}#roguelite-expedition-v1#holdout#${runIndex}
```

The two sets must be disjoint and both contain 2,000 runs/profile.

---

## Task 5: Instrument production outcomes rather than simulator intentions

Record a metric only after the owning production transition succeeds.

Required per-run shape:

```text
expeditionOutcome
routeSteps
meaningfulNodeChoices
nodeTypeVisits
rivalNodeReached
undergroundNodeReached
extractionStep
moneyEarned
fameEarned
securedReward
spendByCategory { repair, supply, insurance, bribe, contract, crew, fuel }
conditionMinimums { vehicle, pa, instruments, stageGear }
fieldRepairUses
fieldRepairQualityMean
defectsCreated / Revealed / Triggered
insuranceClaims
crewStressPeak
crewCrises
injuryPeakStage / seriousInjuryCount
heatTimeline
exposureTimeline
obligationsAccepted/completed/failed/doubledDown
maxObligationStack
rivalEncounters
nemesisRuleActivations
questProgressEvents
finaleType
draftsOffered/accepted
runTraitIds
chassisProfileId
legendaryRuleActivation counts
ledgerReconciled
```

Vehicle minimum comes from `state.player.van.condition`; technical minima come from `state.expedition.condition`.

`ledgerReconciled` must be true for 100% of runs. Do not average reconciliation failures.

---

## Task 6: Separate hard safety gates from soft design corridors

Hard blockers in both calibration and holdout:

```text
invalidRouteCount > 0
productionInvalidLoadoutCount > 0
settlementReconciliationPct < 100
nonFiniteStateCount > 0
negativeProtectedResourceCount > 0
extractionDoubleSettlementCount > 0
contractDoubleSettlementCount > 0
careerDoubleSettlementCount > 0
manifestBypassCount > 0
staleRunStateAfterResetCount > 0
mandatoryPreGigSoftlockCount > 0
severeReliefViolationCount > 0
simulatorOnlyMechanicCount > 0
```

Per-profile broad failure ceilings remain safety limits, not desired balance targets:

```text
clean_sponsor              <=35%
underground_heat            <=50%
diy_repair                  <=40%
scout_intel                 <=35%
high_exposure_performance   <=40%
rival_hunter                <=45%
```

Soft corridors report extraction/completion/failure mix, subsystem incidence, economy composition and strategy diversity without automatically failing until playtests justify hard targets.

---

## Task 7: Add reproducible material strategy-dominance detection

Use:

```js
securedRewardAdvantagePct: 20
failureRateAdvantagePoints: 5
```

Profile A materially dominates B only when:

```text
A.avgSecuredReward >= B.avgSecuredReward * 1.20
AND
A.failedPct <= B.failedPct - 5 percentage points
```

Blocking dominance requires the same ordered pair in both calibration and holdout. Report a Pareto table; do not force deliberately different builds into equal average reward.

---

## Task 8: Add the paired extraction counterfactual probe

Script:

```text
scripts/game-balance-expedition-probe.mjs
```

Namespace:

```text
#roguelite-expedition-v1#paired-extraction
```

At each configured extraction window:

1. capture the same serializable production state + RNG continuation token;
2. `structuredClone` into Extract and Continue branches;
3. Branch A finalizes extraction immediately through production action/reducer;
4. Branch B continues using the same profile policy;
5. report secured reward, failure probability, premium and winner share.

Use separate calibration and holdout markers inside the probe. One decision is a blocker only when it wins on secured reward in >=90% of paired states at every tested window in both cohorts.

Package script:

```json
"simulate:balance:expedition-probe": "node --import tsx scripts/game-balance-expedition-probe.mjs"
```

---

## Task 9: Add a paired skill-vs-management probe

Script:

```text
scripts/game-balance-expedition-skill-probe.mjs
```

Namespace:

```text
#roguelite-expedition-v1#skill-probe
```

Purpose: prove the Spec pillar **management creates the situation; skill determines the outcome**.

For each selected deterministic pre-Gig snapshot, clone the exact same management state into three branches and resolve only active-play quality differently:

```text
low skill      -> accuracy 45 / repair minigame quality 0.35
competent      -> accuracy 70 / repair minigame quality 0.70
high skill     -> accuracy 90 / repair minigame quality 0.95
```

Use production Gig/Condition/Crew/repair resolvers. Continue each branch for the next two route nodes with the same policy/RNG continuation where possible.

Report:

```text
immediate reward delta
technical wear delta
Crew Stress delta
injury incidence delta
next-two-node repair spend
secured reward after two nodes
branch survival/extraction availability
```

Hard structural expectations:

```text
at least one production outcome dimension differs between low and high skill for every management snapshot family
high skill never receives worse technical wear solely because accuracy is higher unless a documented high-intensity rule explicitly trades reward for wear
critical Condition/injury modifiers do not erase all outcome difference between competent and high skill across every probe
field-repair high quality restores more Condition than low quality from identical damage
```

This probe is evidence for skill relevance; it is not tuned to make high skill guarantee success.

Package script:

```json
"simulate:balance:skill-probe": "node --import tsx scripts/game-balance-expedition-skill-probe.mjs"
```

---

## Task 10: Add linked six-run Career sequences for cross-run evidence

`runSingleSimulation` is never used to measure a cross-run metric.

Create:

```js
export const CAREER_RUNS_PER_SEQUENCE = 6
export const CAREER_SEQUENCES_PER_PROFILE = 1000

runCareerSequence(profile, seed, runCount = 6)
```

Namespaces:

```text
#roguelite-expedition-v1#career-calibration
#roguelite-expedition-v1#career-holdout
```

Persist only production-persistent state:

```text
Career rank/Tour Tokens/facilities/unlock sets
Crew loyalty/relationships/signature traits/unavailability
Rival/Nemesis history
Legendary capability markers
Tour Archive
vehicle condition when G5 Between-Tour choice intentionally carries it
quest progression
```

Clear run-scoped Expedition state through production finalize/Between-Tour/PREPARE_NEXT boundaries.

Between runs:

```text
resolve all 1–3 Between-Tour decisions
make at most one deterministic affordable eligible meta purchase
build next production-valid loadout from current capabilities
validate/start next run
```

Meta-purchase policy:

```text
lowest required rank
then lowest token cost
then lexical set/facility id
```

Report only from Career sequences:

```text
firstMetaFacilityRun
firstPermanentExpeditionCapabilityRun
run1PermanentCapabilityPurchaseRate
betweenTourDecisionMean
crossTourNemesisEscalationRate
legendaryCapabilityCarryRate
signatureTraitUnlockRun
questChainCompletionRun
```

---

## Task 11: Prove all five Legendary transforms in production parity

Late-Career profiles may seed separate persistent markers:

```text
expedition.legendary.safe_harbor
expedition.legendary.the_fixer
expedition.legendary.nemesis_key
expedition.legendary.ghost_route
expedition.legendary.salvage_rights
```

Never encode them as starter perks.

Track:

```text
safeHarborActivationCount
fixerExcuseCount
nemesisShortcutActivationCount
ghostRouteConversionCount
salvageRightsActivationCount
```

G6 is structurally incomplete until deterministic coverage scenarios activate all five through production code at least once.

---

## Task 12: Add Fog, chassis, Contract, Quest and Director health metrics

Report:

```text
intelInfluencedRoutePct
scoutReconUseRate
socialIntelGrantUseRate
contactIntelGrantUseRate
chassisProfilePickRates
chassisOutcomeDeltaByProfile
contractDoubleDownRate
doubleDownCompletionPct
doubleDownRewardDelta
runGoalQuestCompletionRate
nemesisQuestProgressRate
metaUnlockQuestProgressRate
severeEventRunsPct
severeCrossFamilyRepeatPct
Director family encounter shares
```

A system with zero/near-zero production activity across its intended profile becomes a soft design warning; a claimed release-gate mechanic with no production activity/test is a structural blocker.

---

## Task 13: Measure real run duration separately from the simulator

Headless simulation estimates decision density but cannot prove real 20–30 minute play time.

Add lightweight local run timing to the finalized Expedition outcome/Run Summary:

```ts
export interface ExpeditionRuntimeSample {
  runId: string
  startedAtMs: number
  finalizedAtMs: number
  realDurationMs: number
  visitedNodeCount: number
  outcome: 'extracted' | 'completed' | 'failed'
}
```

`startedAtMs` is fixed on successful START from the injected clock; `finalizedAtMs` is fixed on terminal settlement. Sanitizer treats invalid/missing values as absent telemetry and never uses runtime timestamps for gameplay logic.

Run Summary may expose the duration in development/reporting UI. Add an export helper that writes/returns the last N local samples for manual/playtest analysis without network telemetry.

`scripts/expedition-playtest-summary.mjs <samples.json>` reports:

```text
sample count
P25/P50/P75 real duration
share 20–30 min
node count distribution
outcome distribution
duration by strategy label when supplied
```

The 20–30 minute target remains a soft product corridor until at least 20 real human/playtest samples exist. The simulator must label any duration estimate as modelled, not real.

---

## Task 14: Final G6 report and provenance coverage

Add all production files that materially determine Expedition results to `BALANCE_SOURCE_FILES`, including:

```text
G1 loadout/map/intel/reward/failure/extraction
G2 chassis/cargo/condition/repair/insurance
G3 Crew/Stress/relationships/injuries
G4 pressure/contracts/director/rivals/finale/runDrafts/quests
G5 rules/regions/tours/unlockSets/tourPressure/legendaryRules/betweenTours
```

The report must clearly separate:

```text
Hard Safety Validation
Soft Design Review
Calibration vs Holdout Stability
Paired Extraction Probe
Skill-vs-Management Probe
Career Sequence Evidence
Legendary Transform Coverage
Real Playtest Duration Evidence (when samples supplied)
```

Do not let report-generation success hide a missing cohort or empty metric population.

---

## Task 15: Run final verification

```bash
pnpm run test:node
pnpm run test:ui
pnpm run test:additional
pnpm run test:e2e
pnpm run typecheck:core
pnpm run typecheck
pnpm run deadcode:check
pnpm run deadcode:budget
pnpm run symbols:check
pnpm run simulate:balance
pnpm run simulate:balance:expedition-probe
pnpm run simulate:balance:skill-probe
```

Expected:

```text
all correctness gates pass
all six profiles are production-valid full builds
calibration and holdout both present/disjoint
no simulator-only behavior
all ledgers reconcile
all five Legendary transforms activate in deterministic coverage
paired extraction is not reproducibly dominated under blocking rule
skill probe shows meaningful outcome conversion from active performance
Career sequence metrics come only from linked runs
real-duration section is labelled unavailable unless actual samples were supplied
```

---

## G6 Exit Criteria

- v15 no longer models the legacy day horizon as Expedition evidence.
- Every profile uses a complete production-valid build with no hidden defaults.
- Simulator records state changes only after production accepts them.
- Calibration and holdout are disjoint and both gate correctness.
- Cross-run metrics come only from linked Career sequences.
- Extraction value is tested from paired identical snapshots.
- Active Gig/repair skill relevance is tested from paired identical management snapshots.
- Real 20–30 minute pacing is measured from real runtime samples, not inferred from simulator iterations.
- All five rule-changing Legendary capabilities have production activation evidence.
- The final report distinguishes hard safety blockers from soft design hypotheses.
