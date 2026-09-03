# Roguelite Expedition Spec Fidelity + Execution Contract

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to apply this contract task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the approved Roguelite Expedition design as an executable implementation contract, close the remaining review gaps, and prevent the implementation from becoming only an Expedition state layer over the legacy touring flow.

**Architecture:** Preserve the repository's existing canonical owners (`player`, `band`, `assets`, `social`, `unlocks`, event/quest pipelines), but make Tour Prep commit a real build, make route/Condition/Crew/Pressure systems change player decisions and active gameplay, and move permanent progression toward new options/rule changes instead of percentage power. This contract amends G1–G6. `00a-exact-owner-contract-clarifications.md` has higher authority for the clauses it explicitly tightens; within this file, the **Final Review Closure Amendments R1–R12** below replace any conflicting older gate text. All compatible `00-review-hardening-contract.md` requirements remain mandatory.

**Tech Stack:** React 19, TypeScript 6, typed `GameAction`/`ActionTypes`, reducers/action creators, existing BandHQ/setlist/assets/stash/event/quest owners, deterministic `MapGenerator`, Node/Vitest/Playwright, balance simulator v15.

---

## Source-of-truth order

The authority order is identical to the Canonical Index and is binding from every plan entrypoint:

1. `docs/superpowers/specs/2026-09-03-roguelite-expedition-tour-design.md`
2. `docs/superpowers/plans/roguelite-expedition/00a-exact-owner-contract-clarifications.md`
3. **this file** (`00-spec-fidelity-execution-contract.md`)
4. `docs/superpowers/plans/roguelite-expedition/00-review-hardening-contract.md`
5. `docs/superpowers/plans/2026-09-03-roguelite-expedition-master-plan.md`
6. `docs/superpowers/plans/roguelite-expedition/01-expedition-core-extraction.md` through `06-balance-simulator-recalibration.md`

For clauses explicitly named in `00a`, `00a` wins. For clauses R1–R12 below, the matching R-amendment wins over older text later in this file and over child-plan snippets. The hardening contract remains mandatory wherever it is compatible with those higher contracts.

### Mechanical authority-order guard

G1 must create `tests/node/expeditionPlanAuthority.test.js`. The test reads:

```text
docs/superpowers/plans/2026-09-03-roguelite-expedition-implementation-plan-complete.md
docs/superpowers/plans/roguelite-expedition/00-spec-fidelity-execution-contract.md
```

and asserts that both expose the exact ordered basenames:

```js
[
  '2026-09-03-roguelite-expedition-tour-design.md',
  '00a-exact-owner-contract-clarifications.md',
  '00-spec-fidelity-execution-contract.md',
  '00-review-hardening-contract.md',
  '2026-09-03-roguelite-expedition-master-plan.md',
  '01-expedition-core-extraction.md',
  '02-condition-repairs-cargo.md',
  '03-crew-stress-relationships.md',
  '04-pressure-rivals-contracts.md',
  '05-meta-regions-ascension.md',
  '06-balance-simulator-recalibration.md'
]
```

The test must fail when an entrypoint omits/reorders a canonical layer. It does not compare prose bodies.

Apply before each gate closes:

```text
G1-F1 full pre-tour build commitment
G1-F2 route-visible Rival/Underground nodes
G1-F3 authoritative lifecycle + entitled Intel + source-derived reward security
G1-F4 multi-axis failure/rescue framework with zero-Condition recovery
G2-F1 owned-content cargo manifest used by every Expedition cargo consumer
G2-F2 travel wear + Condition gameplay + hidden-defect lifecycle + insurance
G3-F1 production Crew effects + band↔crew relationships + persistent crew consequences
G3-F2 production-valid Expedition event data
G4-F1 intent-based obligations + committed-Sponsor START materialization + quest-credit settlement
G4-F2 full Pressure Director + typed Rival outcome persistence + Nemesis rule escalation
G4-F3 executable contextual-finale profiles
G5-F1 complete production Region/Tour/Crew/Starter/Tour-Pressure composition path
G5-F2 authoritative Ascension/Tour-Pressure validation
G5-F3 1–3 consequential between-tour decisions
G5-F4 HQ transition away from universal run-1 permanent power buying
G5-F5 rule-changing Legendary rewards
G6-F1 simulator/release gates proving shipped behavior
G6-F2 linked Career-sequence evidence for meta/Nemesis/unlock timing
```

**Global rule:** a simulator metric is not evidence until the measured behavior has a production consumer and an app-side test.

---

# Final Review Closure Amendments — R1 through R12

These amendments are part of this file, not a new authority layer. They close the final review gaps and are binding before the corresponding gate can turn green.

## R1 — Authority graph is mechanically identical everywhere

**Replaces:** any wording in this file that places `00-spec-fidelity-execution-contract.md` directly after the design Spec.

Use the Source-of-truth order above. `00a-exact-owner-contract-clarifications.md` is always between the approved design Spec and this file. The `expeditionPlanAuthority.test.js` guard is required in G1 and belongs in the G1 verification/commit surface.

---

## R2 — Freeze committed band equipment, not only setlist/modules

**Amends:** G1-F1 Step 4.

**Additional exact files:**

- Modify: `src/context/reducers/bandReducer.ts`
- Test: `tests/node/bandReducer.test.js`
- Test: `tests/node/expeditionCargo.test.js`

The active-run identity freeze is:

```text
setlist                  -> handleSetSetlist
selected chassis modules -> handleInstallModule / handleRemoveModule
band-member equipment    -> handleUpdateBand
```

`handleUpdateBand` remains the canonical general band patch owner. During an active Expedition, only a `members` patch that attempts to change the normalized `equipment` snapshot is rejected. Mood, stamina, relationships and other legal member patches continue to work.

Use the same normalization function that G1-F1 uses to build `ExpeditionEquipmentCommitment`; do not compare object identity or JSON stringification. For every patched known member:

```ts
const committed = state.expedition.loadout.build.equipment.find(
  item => item.memberId === existingMember.id
)
const candidateEquipment = normalizeMemberEquipment({ ...existingMember, ...patch })

if (
  Object.hasOwn(patch, 'equipment') &&
  committed &&
  !areEquipmentSlotsEqual(candidateEquipment, committed.slots)
) {
  return state
}
```

Required regressions:

```text
active run + equipment replacement -> identical state
active run + non-equipment member patch -> succeeds
inactive run + equipment replacement -> existing behavior remains
active run + attempted equipment removal cannot lower technicalGearSlots/cargo use
active run + attempted equipment addition cannot create gear outside committed cargo budget
```

---

## R3 — Every active-run merch/Contraband consumer uses the manifest view

**Amends:** G2-F1. Materializing a manifest is insufficient unless all Expedition consumers stop reading the unfiltered global inventory/stash.

**Additional exact production files:**

- Modify: `src/utils/economy/gigLogic/calculators/calculateMerchIncome.ts` and its owning Gig-economy call site
- Modify: `src/hooks/useContrabandStash.ts`
- Modify: `src/context/reducers/bandReducer.ts` (`USE_CONTRABAND`)
- Modify: `src/hooks/minigames/useRoadieLogic.ts`
- Modify: `src/hooks/useMinigameSceneLogic.ts`
- Modify: `src/utils/eventEngine/eventEffectHandlers.ts`
- Modify: `src/utils/gameState/delta.ts` only where the existing event/confiscation path must synchronize a selected manifest entry after canonical stash removal

**Additional tests:**

- `tests/node/economyEngine.merchProfiles.test.js`
- `tests/ui/useContrabandStash.test.jsx`
- `tests/ui/useRoadieLogic.test.jsx`
- the existing event-resolver/Contraband tests that cover `stashRemove`

Create one pure read boundary in `src/domain/expedition/cargo.ts`:

```ts
export interface ExpeditionCargoView {
  merch: ExpeditionMerchSelection[]
  contraband: ExpeditionContrabandSelection[]
}

export const getExpeditionCargoView = (state: GameState): ExpeditionCargoView

export const getExpeditionMerchQuantity = (
  state: GameState,
  inventoryKey: string
): number

export const isContrabandInExpeditionManifest = (
  state: GameState,
  stashKey: string,
  instanceId?: string | null
): boolean
```

Rules:

```text
inactive Expedition -> helpers expose the current canonical inventory/stash behavior
active Expedition   -> helpers expose only committed/materialized manifest entries
removed/consumed canonical content -> manifest view clamps to what still exists globally
manifest never invents ownership and never increases quantities
```

Production wiring:

```text
post-gig merch settlement -> passes manifest-limited merch quantities to calculateMerchIncome
Contraband stash modal     -> lists only manifest entries while Expedition is active
USE_CONTRABAND reducer     -> rejects active-run instance/key not in manifest
Roadie selection           -> chooses only manifest Contraband
minigame fast-complete     -> chooses only manifest Contraband
Expedition event risk/confiscation -> candidate selection comes from manifest; canonical stash removal then synchronizes/removes that manifest entry
```

Do not globally block non-Expedition crafting/event systems from canonical stash. The restriction is scoped to an active Expedition and to actions/consumers acting as part of that run.

Required end-to-end proofs:

```text
omitted merch remains in band.inventory but earns €0 Expedition merch revenue
selected merch cannot sell more than committed quantity
omitted Contraband remains in band.stash but is absent from Stash UI/Roadie and USE_CONTRABAND is a no-op
selected Contraband can be consumed once and disappears from manifest view when canonical stash ownership is gone
Expedition confiscation cannot target an omitted stash entry
```

---

## R4 — Condition 0 always has an executable recovery/termination path

**Amends:** G1-F4 and G2-F2.

Extend the failure reason union:

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
```

`technical_shutdown` is opened when the current required Gig/Festival PreGig has at least one `disabledGroups` entry after insurance/Salvage Rights have had their canonical chance to prevent zero.

`PreGig` may disable Gig Start, but it must simultaneously render the canonical recovery contract:

```text
field_repair   -> hardened G2 repair action when resources permit
cannibalize    -> hardened G2 cannibalize action when a valid source exists
accept_failure -> G1-F3 system_failure for technical_shutdown
```

Use the existing/planned `FailureCrisisDialog` and the same repair/cannibalize resolvers used by Supply Stop; do not create a second price/effect formula in PreGig. When a successful recovery moves every disabled group above zero, the crisis clears and Gig Start becomes available.

Required golden path:

```text
post-gig technical wear reaches 0
-> next mandatory node is Gig/Festival
-> PreGig shows disabled group + recovery/termination choices
-> successful repair/cannibalize enables Start
OR accept_failure commits failed settlement and routes safely to Run Summary
-> no state can remain on PreGig with Start disabled and no legal action
```

---

## R5 — Relationship actors support Crew↔Crew and Band↔Crew and affect later events

**Replaces:** the child-plan contract that restricts `SHIFT_CREW_RELATIONSHIP` to two `EXPEDITION_CREW_BY_ID` ids.

**Additional exact files:**

- Modify: `src/types/career.d.ts`
- Modify: `src/domain/expedition/relationships.ts`
- Modify: `src/context/careerActionCreators.ts`
- Modify: `src/context/reducers/careerReducer.ts`
- Modify: `src/context/reducers/careerSanitizers.ts`
- Modify: `src/data/events/crew.ts`
- Test: `tests/node/expeditionRelationships.test.js`
- Test: `tests/node/saveSliceRoundTrip.test.js`
- Test: the G3 event end-to-end test

Use the final actor contract:

```ts
export type ExpeditionRelationshipActorRef =
  | { kind: 'crew'; id: string }
  | { kind: 'band'; id: string }

export interface ShiftExpeditionRelationshipPayload {
  firstActor: ExpeditionRelationshipActorRef
  secondActor: ExpeditionRelationshipActorRef
  tierDelta: number
}
```

Canonical validation:

```text
crew actor -> Object.hasOwn(EXPEDITION_CREW_BY_ID, id)
band actor -> exact stable id in current state.band.members
same actor -> reject
band↔band -> reject; the repository's existing band-member relationship system remains owner
Crew↔Crew and Band↔Crew -> allowed
non-finite delta / prototype ids / unknown ids -> reject
```

Replace the planned `crewRelationshipByPair`/`toCrewRelationshipKey` naming with:

```ts
career.expeditionRelationshipByPair: Record<string, CrewRelationshipTier>

toExpeditionRelationshipKey(a, b) // serialize as kind:id, lexical-sort, join with ::
```

Reducer receives the two actor refs and derives the pair key itself. It never accepts a materialized key from the caller.

Production requirement: at least one validated G3 Crew event option must call this action for a Band↔Crew pair, and at least one later Crew event condition or option must read the resulting tier. Use a stable selected band member id from current state, not a display name.

Golden proof:

```text
resolve Crew event -> Band↔Crew tier changes
save/reload -> tier persists
later validated Crew event -> eligibility/option differs because of that tier
malformed direct actor refs -> identical state
```

---

## R6 — Materialize the committed pre-tour Sponsor obligation during START

**Amends:** G4-F1 and replaces the assumption that only a deal accepted after START creates an Expedition obligation.

`00a/C1` remains authoritative: Tour Prep may commit only `null` or an id already present in `state.social.activeDeals`; loadout validation never generates offers.

During hardened `START_EXPEDITION`, after the loadout/Sponsor id has been revalidated and `runId` is fixed, materialize the selected persisted deal's `expeditionObligation` metadata exactly once.

```ts
export const createCommittedSponsorObligation = (
  state: GameState,
  dealId: string,
  runId: string
): ActiveObligationState | null
```

Rules:

```text
deal must still be in state.social.activeDeals
metadata absent -> no obligation
obligation id is deterministic from runId + dealId
sourceType = 'brandDeal'
sourceId = dealId
money/fame reward = 0 because the existing Brand Deal owns its economic payout
existing same obligation id -> do not duplicate
```

The START reducer derives/materializes this obligation; caller does not submit it. A mid-run deal accepted through the existing supported flow may still create its own linked obligation, but it must use the same idempotent helper/shape and cannot duplicate a pre-tour one.

Required proof:

```text
persisted activeDeal -> Tour Prep commit -> START -> linked zero-payout obligation exists
same START/replay -> no duplicate
subsequent Gig/arrival signal -> obligation progresses through canonical reducer path
stale sponsor removed before START -> START rejected by loadout validation
```

---

## R7 — Node Intel sources require reducer-side entitlement and real producers

**Replaces:** G1-F3 wording that accepts an arbitrary `source` string and promises unspecified later Social/contact/perk producers.

Add run state:

```ts
export interface ExpeditionIntelGrant {
  id: string
  source: 'social' | 'contact'
  nodeId: string
  targetLevel: 1 | 2
  consumed: boolean
}

// ExpeditionState
intelGrants: ExpeditionIntelGrant[] // sanitize/cap newest 32
scoutReconUsedRouteSteps: number[]
```

Keep one typed reveal action, but include only entitlement inputs/stale guards:

```ts
export interface RevealNodeIntelPayload {
  nodeId: string
  expectedLevel: NodeIntelLevel
  source: 'scout_passive' | 'scout_recon' | 'social' | 'contact' | 'perk'
  expectedRouteStep: number
  grantId?: string
}
```

The reducer derives `nextLevel` and proves entitlement:

```text
scout_passive:
  selected Scout exists in committed loadout
  node is a real structurally visible future node
  current level == 0
  derived next level == 1

scout_recon:
  selected Scout exists
  current routeStep matches expectedRouteStep and is not in scoutReconUsedRouteSteps
  chosen node is a visible future node
  current level == 1
  derived next level == 2
  consume routeStep atomically

perk:
  getExpeditionRuleProfile(state).nodeIntelFloor > current level
  derived next level = min(2, nodeIntelFloor)
  cannot reveal above the owned/selected perk's canonical floor

social/contact:
  grantId identifies an unconsumed matching ExpeditionIntelGrant
  grant source/node match the action
  targetLevel > current level
  reducer applies min(2, targetLevel) and consumes grant atomically
```

Concrete producers:

```text
Scout passive/recon -> G1 map/recon seams
Perk -> START/map materialization applies the selected perk floor through the action/helper
Social -> one G4 social result/event explicitly creates an ExpeditionIntelGrant for a visible future node
Contact -> one G3 relationship/contact event explicitly creates an ExpeditionIntelGrant for a visible future node
```

Grant creation is itself typed/reducer-authoritative: creator may carry a generated grant id and chosen eligible node id; reducer verifies the event/contact result token before storing it. Never mutate `intelByNodeId` directly.

Required hostile tests include forged `source:'perk'` without a qualifying perk, forged Social/contact grant id, duplicate grant replay and stale Scout Recon.

---

## R8 — Pressure Director uses the approved bounded multi-input run context

**Amends:** G4-F2 / the pressure-director task. Heat/Exposure are not the whole Director.

In `src/domain/expedition/pressureDirector.ts` define:

```ts
export interface PressureDirectorContext {
  heat: number
  exposure: number
  cashPressure: number
  technicalConditionPressure: number
  crewStressPressure: number
  obligationPressure: number
  rivalPressure: number
  routeDepthPressure: number
}

export const buildPressureDirectorContext = (
  state: GameState
): PressureDirectorContext
```

Derivation is deterministic and bounded `0..1` for pressure axes:

```ts
cashPressure = clamp((1000 - finiteNumberOr(state.player.money, 0)) / 1000, 0, 1)
technicalConditionPressure = clamp((60 - getAggregateTechnicalCondition(state.expedition.condition)) / 60, 0, 1)
crewStressPressure = clamp((getMaxSelectedCrewStress(state) - 50) / 50, 0, 1)
obligationPressure = clamp(getActiveExpeditionObligations(state).length / 3, 0, 1)
rivalPressure = clamp(getCurrentRivalNemesisLevel(state) / 4, 0, 1)
routeDepthPressure = clamp(state.expedition.routeStep / Math.max(1, getCurrentTourMapDepth(state) - 1), 0, 1)
```

`heat`/`exposure` retain their canonical clamped values for existing eligibility/weight logic.

After existing event conditions/cooldowns have produced the eligible set, apply modest tag/family biases only:

```text
economy/supply-pressure event -> × (1 + 0.50 * cashPressure)
technical/vehicle event       -> × (1 + 0.75 * technicalConditionPressure)
crew event                    -> × (1 + 0.75 * crewStressPressure)
contract/sponsor event        -> × (1 + 0.50 * obligationPressure)
rival event                   -> × (1 + 0.50 * rivalPressure), then canonical Nemesis multiplier
authority/climax event        -> × (1 + 0.25 * routeDepthPressure)
```

The event registry must explicitly map each new Expedition pressure event to one family; unknown/legacy events get identity `1`. The Director never bypasses event `condition`, cooldown, once-only, route eligibility or RNG selection and never forces an outcome.

Required tests hold Heat/Exposure constant while separately changing Condition, Crew Stress, obligation count and route depth, and prove eligible-event weights change while an ineligible event remains absent.

---

## R9 — `ExpeditionRuleProfile` covers every composable live rule axis

**Replaces:** the narrower G5-F1 result shape later in this file.

```ts
export interface ExpeditionRuleProfile {
  startingSpareParts: number
  startingHeat: number
  roadWearMultiplier: number
  technicalWearMultiplier: number
  repairCostMultiplier: number
  gigRewardMultiplier: number
  contractRewardMultiplier: number
  contractPenaltyMultiplier: number
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
  forcedRival: boolean
}

export const getExpeditionRuleProfile = (state: GameState): ExpeditionRuleProfile
```

Compose numeric axes exactly once:

```text
Base -> Region -> Tour Type -> selected Crew aggregate -> Starter Perk -> Tour Pressure -> Nemesis numeric weighting
```

Clamp multiplicative axes `0.25..3`, Heat `0..100`, integer startingSpareParts `>=0`, Intel floor `0..2`.

Canonical consumers:

```text
startingSpareParts             -> START cargo materialization
startingHeat                   -> START Expedition pressure
roadWearMultiplier             -> travel settlement
technicalWearMultiplier        -> technical wear resolver
repairCostMultiplier           -> repair resolver
gigRewardMultiplier            -> post-gig Expedition reward resolver
contractRewardMultiplier       -> obligation/contract reward
contractPenaltyMultiplier      -> obligation/contract penalty
heatGainMultiplier             -> positive Heat deltas
exposureGainMultiplier         -> positive Exposure deltas
crewStressMultiplier           -> G3 crew-stress deltas
extractionRetentionMultiplier  -> voluntary/failure settlement retention, clamped to the tour's allowed max
rareRewardMultiplier           -> rare reward source weighting
completionMultiplier           -> completed settlement positive run earnings only
rivalEventWeightMultiplier     -> Pressure Director eligible Rival weighting
authorityEventWeightMultiplier -> Pressure Director eligible Authority weighting
rivalRewardMultiplier          -> Rival reward resolver
finaleRewardMultiplier         -> non-Legendary Finale reward weighting only
nodeIntelFloor                 -> R7 entitled Intel floor
forcedRival                    -> Rival generation/selection
```

Rule-changing Legendary capabilities are **not** flattened into this numeric profile. They stay in `legendaryRules.ts` and are consumed by their exact G5-F5/00a-C9 owners.

Parity tests must include at minimum Media Frenzy, No Safety Net, Union Trouble, Press Pass and authority weighting and prove both app owner and G6 read the same profile field.

---

## R10 — G6 never models the superseded multiplier-Legendary starter perks

**Amends:** G6-F1 and supersedes any `headliner_pass`, `nemesis_dossier`, `disaster_artist` or `expedition.perk.legendary.*` strategy-profile usage.

`starterPerkId` in v15 strategy profiles is limited to real starter choices:

```text
null
mechanic_kit
press_pass
underground_contact
```

Late-career profiles seed earned Legendary Career unlock markers separately before the run:

```text
expedition.legendary.safe_harbor
expedition.legendary.the_fixer
expedition.legendary.nemesis_key
expedition.legendary.ghost_route
expedition.legendary.salvage_rights
```

A profile may own zero or more of those capabilities, but it still passes the normal production loadout validator; Legendary ownership is never encoded by lying about `starterPerkId`.

G6 telemetry records exact rule activation counters:

```text
safeHarborActivationCount
fixerExcuseCount
nemesisShortcutActivationCount
ghostRouteConversionCount
salvageRightsActivationCount
```

Release evidence is structurally incomplete until deterministic coverage proves all five transforms can activate through their production owners. A zero activation is allowed in a particular strategy, but each transform must activate in at least one dedicated deterministic coverage scenario before G6 passes.

---

## R11 — Meta/Nemesis/unlock timing uses linked Career sequences, not fresh one-run samples

**Adds:** G6-F2.

`runSingleSimulation` remains the run-balance harness. It must not report cross-run metrics from a state that starts with `createInitialState()` and ends after one terminal outcome.

Add a separate deterministic harness:

```ts
export const CAREER_RUNS_PER_SEQUENCE = 6
export const CAREER_SEQUENCES_PER_PROFILE = 1000

export const runCareerSequence = (
  profile: CareerBalanceProfile,
  seed: string,
  runCount = CAREER_RUNS_PER_SEQUENCE
): CareerSequenceResult
```

A Career sequence preserves the production-persistent owners across linked Expeditions:

```text
career ranks/tokens/facilities/unlock sets
unlocks, including earned Legendary capabilities
persistent Rival history/Nemesis
persistent Crew loyalty/relationships/injuries
persistent vehicle condition and other explicitly persistent canonical state
```

It clears only run-scoped Expedition state through the production `PREPARE_NEXT_EXPEDITION`/next-start path.

Between runs the harness must execute the same production loop:

```text
terminal run
-> Run Summary Legendary barrier/career settlement
-> build/resolve all 1–3 Between-Tour decisions through typed actions
-> deterministic meta-purchase policy
-> PREPARE_NEXT_EXPEDITION
-> construct next production-valid loadout
-> validateExpeditionLoadout
-> START_EXPEDITION
```

Deterministic policy, so results are reproducible rather than tuned by hidden simulator logic:

```text
Between-Tour: evaluate displayed decision ids in their canonical order and choose the first option whose production resolver validates; if multiple no-cost valid options exist, lexical option id wins.
Meta purchase: at most one purchase per between-run phase; among currently eligible/affordable facilities or unlock sets choose lowest required-rank, then lowest cost, then lexical id. Use the production purchase actions/journal.
Tour Prep: use the profile's declared strategy while revalidating current unlock/crew/sponsor/cargo availability; never force a locked choice.
```

Use disjoint namespaces:

```text
#roguelite-expedition-v1#career-calibration
#roguelite-expedition-v1#career-holdout
```

No Career seed may appear in both populations. Single-run calibration/holdout and the paired Extraction probe remain separate evidence streams.

Only Career sequences may report:

```text
firstMetaFacilityRun
firstPermanentExpeditionCapabilityRun
run1PermanentCapabilityPurchaseRate
betweenTourDecisionMean
crossTourNemesisEscalationRate
legendaryCapabilityCarryRate
```

Required tests prove deterministic replay, seed disjointness, Career carry-over, decision resolution before Next Tour, at-most-one meta purchase per phase and that every next run still passes production validation.

---

## R12 — Reward security is source-derived; remove the unentitled generic secure action

**Replaces:** G1-F3 Step 4's public `SECURE_EXPEDITION_REWARD` transition.

V1 does **not** expose a generic action that lets a caller flip `secured`. Security is derived when the canonical reward is added from an eligible source.

```ts
export type ExpeditionRewardSourceType =
  | 'route_rare'
  | 'event_rare'
  | 'contract'
  | 'crew_contact'

export interface AddExpeditionRewardPayload {
  id: string
  sourceType: ExpeditionRewardSourceType
  sourceId: string
  expectedRouteStep: number
}

export interface ExpeditionRewardLedgerEntry {
  id: string
  kind: 'module' | 'crew_contact' | 'contract' | 'other'
  sourceType: ExpeditionRewardSourceType
  sourceId: string
  secured: boolean
  earnedAtRouteStep: number
}
```

Reducer proves the source from current canonical state and derives security:

```text
route_rare / event_rare -> unsecured
completed canonical contract reward -> secured
canonical Crew-contact Career reward -> secured
```

The payload never contains `secured`, `kind`, retention rate or settlement values. Unknown/stale/replayed sources are identical-state no-ops. Finale Legendary persistence remains owned by the hardened G5-F5 Run Summary barrier and is not smuggled through this ledger.

There is no `SECURE_EXPEDITION_REWARD` `ActionTypes`/`GameAction` variant in v1. If a later feature wants to secure an already-unsecured reward, it must introduce a named mechanic-specific intent whose reducer proves current entitlement; it may not revive a generic boolean setter.

Settlement divergence is now executable without a forgeable transition:

```text
voluntary extraction/failure -> retain canonically secured contract/contact entries; lose unsecured route/event rare entries
completion -> retain all ledger entries
```

Required tests:

```text
caller cannot submit security/kind
unknown contract/contact source cannot create a secured entry
valid completed contract creates secured entry exactly once
valid route rare creates unsecured entry
extraction/failure loses unsecured but retains secured
completion retains both
replay does not mint/retain a second copy
```

---

# G1-F1 — Full pre-tour build commitment

**Amends:** G1 Tasks 1, 4, 5, 6; later Tour Prep tasks; apply R2.

**Files:**
- Modify: `src/types/expedition.d.ts`
- Create: `src/domain/expedition/buildCommitment.ts`
- Modify: `src/domain/expedition/loadout.ts`
- Modify: `src/context/expeditionActionCreators.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Modify: `src/context/reducers/expeditionSanitizers.ts`
- Modify: `src/context/reducers/gigReducer.ts`
- Modify: `src/context/reducers/assetReducer.ts`
- Modify: `src/context/reducers/bandReducer.ts`
- Modify: `src/scenes/TourPrep.tsx`
- Modify: `src/ui/expedition/TourPrepLoadout.tsx`
- Create: `src/ui/expedition/BuildCommitmentPanel.tsx`
- Test: `tests/node/expeditionLoadout.test.js`
- Test: `tests/node/expeditionReducer.test.js`
- Test: `tests/node/gameReducer.test.js`
- Test: `tests/node/assetReducer.test.js`
- Test: `tests/node/bandReducer.test.js`
- Test: `tests/node/expeditionPlanAuthority.test.js`
- Test: `tests/ui/TourPrep.test.tsx`

- [ ] **Step 1: Extend the canonical loadout**

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

`setlistSongIds` is the normalized current `state.setlist`. `equipment` snapshots each stable band-member id; sort own equipment slot keys lexically, use a non-empty string value or record `.id` as `itemId`, otherwise `null`. `selectedTourbusModuleIds` is re-derived from the selected owned `tourbus_chassis.slots[].installedModuleId` and is never trusted from the caller.

- [ ] **Step 2: Add exact snapshot/validation helpers**

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
):
  | { valid: true; commitment: ExpeditionBuildCommitment }
  | { valid: false; reason: string }
```

Validation proves:

```text
setlist ids: non-empty, unique, exactly match current normalized setlist ids
equipment: exact current normalized member-equipment snapshot
modules: exact installed module ids of selected owned chassis
contraband: own stash key; positive integer stacks <= owned stacks; instanceId matches when present
merch: own inventory key; positive integer quantity <= canonical numeric inventory quantity
sponsorDealId: null or an exact own id currently present in state.social.activeDeals
startingFuelTarget: integer in [current fuel, 100]
cashReserveFloor: integer in [0, current money]
```

Reject prototype keys, duplicate merch/stash selections, missing member ids, stale modules and stale setlist/equipment. Do not call `generateBrandOffers` from validation; `00a/C1` owns Sponsor eligibility.

- [ ] **Step 3: Revalidate and settle start-time fuel in the reducer**

`validateExpeditionLoadout(state, payload.loadout)` calls the build validator again inside the hardened `START_EXPEDITION` reducer. Fuel top-up cost is derived from the source-of-truth fuel price:

```ts
const liters = Math.max(0, payload.loadout.build.startingFuelTarget - currentFuel)
const fuelCost = Math.ceil(liters * EXPENSE_CONSTANTS.TRANSPORT.FUEL_PRICE)
```

Reject start if fuel + insurance + other start-time spend would cross `cashReserveFloor`. On success, update canonical `player.money` and `player.van.fuel` once before materializing Expedition state.

- [ ] **Step 4: Freeze build identity during the run**

`handleSetSetlist` returns the original state when an active Expedition receives a setlist whose ids differ from committed ids. `handleInstallModule` and `handleRemoveModule` reject selected-chassis module identity changes during an active run. Apply **R2** to `handleUpdateBand`: normalized band equipment may not diverge from the committed snapshot while the run is active. Repairs/consumables and unrelated band/member patches remain mutable.

- [ ] **Step 5: Tour Prep exposes every committed axis**

`BuildCommitmentPanel` renders:

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

Setlist/equipment/modules reuse their existing owner UIs; Tour Prep stores only the normalized commitment. Start uses only `validateExpeditionLoadout(state, candidate)`.

- [ ] **Step 6: Test and commit**

Required hostile cases: stale setlist, stale modules, stale/inactive Sponsor, unowned Contraband, merch over ownership, invalid fuel target, reserve-floor violation, active-run setlist change, active selected-chassis module install/remove, active-run equipment replacement, cargo technical-gear slot drift, canonical authority-order mismatch.

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/expeditionLoadout.test.js \
  tests/node/expeditionReducer.test.js \
  tests/node/gameReducer.test.js \
  tests/node/assetReducer.test.js \
  tests/node/bandReducer.test.js \
  tests/node/expeditionPlanAuthority.test.js
pnpm exec vitest run tests/ui/TourPrep.test.tsx
pnpm run typecheck:core
git add docs/superpowers/plans src/types/expedition.d.ts src/domain/expedition/buildCommitment.ts src/domain/expedition/loadout.ts src/context src/scenes/TourPrep.tsx src/ui/expedition tests
git commit -m "feat(expedition): commit complete pre-tour build"
```

---

# G1-F2 — Route-visible Rival and Underground nodes

**Amends:** G1 Tasks 7–8; G5 Task 6; `00a/C2` supplies the exact map type/validator files.

**Files:**
- Modify: `src/types/expedition.d.ts`
- Modify: `src/types/map.d.ts`
- Modify: `src/utils/mapValidation.ts`
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
- Test: existing map-validation test or `tests/node/mapValidation.test.js`
- Test: `tests/ui/MapNode.test.jsx`
- Test: `tests/ui/useArrivalLogic.test.jsx`

- [ ] **Step 1: Use typed Expedition subtypes on structural `SPECIAL` nodes**

```ts
export type ExpeditionRouteNodeSubtype =
  | 'rival_encounter'
  | 'underground_market'

export interface ExpeditionMapNodeMeta {
  subtype: ExpeditionRouteNodeSubtype | null
}
```

`src/types/map.d.ts` is the canonical `MapNode` declaration and `src/utils/mapValidation.ts` validates the optional metadata exactly as `00a/C2` specifies. Do not widen the repository-wide `MapNodeType` union just for Expedition.

- [ ] **Step 2: Extend deterministic generation options**

```ts
nodeTypeWeights?: {
  rest: number
  supply: number
  special: number
  rival: number
  underground: number
}
```

Require non-negative values, `rival + underground <= special`, `rest + supply + special < 0.8`. A SPECIAL roll uses one additional **seeded generator** roll to choose Rival, Underground or ordinary Special. No `Math.random()`.

Eligibility:

```text
Rival: active/persistent rival exists OR tour is rival_hunt
Underground: region is underground OR build carries Contraband OR Black Market capability is unlocked
```

Ineligible subtype probability falls back to ordinary Special.

- [ ] **Step 3: Give each subtype an arrival owner**

`rival_encounter` queues the typed G4-F2 Rival encounter. `underground_market` opens `UndergroundMarketModal`, which reuses the same canonical stash/cargo/purchase actions as Supply Stop; it never writes stash/inventory directly.

- [ ] **Step 4: Fog shows the actual route class**

Level 0 already labels the node `Rival` or `Underground` plus rough danger/reward. Level 1/2 add range/exact intel. Do not show it as generic `Special` after structural visibility.

- [ ] **Step 5: Test and commit**

Pin one deterministic seed for each subtype, repeat generation and assert equality; test strict metadata validation, subtype display and arrival routing.

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/mapGenerator.test.js tests/node/expeditionNodeIntel.test.js tests/node/mapValidation.test.js
pnpm exec vitest run tests/ui/MapNode.test.jsx tests/ui/useArrivalLogic.test.jsx
git add src/types src/utils/mapValidation.ts src/utils/mapGenerator src/context/useMapGeneration.ts src/domain/expedition/nodeIntel.ts src/components src/hooks/useArrivalLogic.ts src/ui/expedition/UndergroundMarketModal.tsx tests
git commit -m "feat(expedition): add rival and underground route nodes"
```

---

# G1-F3 — Authoritative lifecycle, entitled Intel and settlement

**Amends:** G1 Tasks 4, 8–11; G1-A; apply R7 and R12.

**Files:**
- Modify: `src/types/expedition.d.ts`
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/context/expeditionActionCreators.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Modify: `src/context/useExpeditionDispatchActions.ts`
- Modify: `src/domain/expedition/extraction.ts`
- Modify: `src/domain/expedition/nodeIntel.ts`
- Modify: `src/components/MapNodeView.tsx`
- Test: `tests/node/expeditionReducer.test.js`
- Test: `tests/node/expeditionExtraction.test.js`
- Test: `tests/node/expeditionNodeIntel.test.js`
- Test: `tests/ui/MapNode.test.jsx`

- [ ] **Step 1: Finalization carries intent, not outcome**

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

Reducer derives:

```text
voluntary_extract -> extracted only at a canonical/effective extraction window
finale_success -> completed only when current node is FINALE, finaleType is resolved,
                  lastGigStats exists and failed !== true
system_failure -> failed only when the canonical pending failure matches reason
```

No action chooses `completed|extracted|failed` directly.

- [ ] **Step 2: Revalidate every arrival**

```ts
export interface RecordExpeditionArrivalPayload {
  nodeId: string
  expectedRouteStep: number
}
```

Reducer requires active run, `nodeId === state.player.currentNodeId`, real map node, not visited, expected current step, and for non-first arrival a connection from the previous visited node. From G5-F5 onward use `getEffectiveNodeConnections` so Nemesis Key shortcuts are canonical. Fake/disconnected/stale/duplicate arrivals are identical-state no-ops.

- [ ] **Step 3: Implement entitled Intel lifecycle**

Use **R7** as the final action/state contract. Scout, perk, Social and contact sources must all have real producers, and the reducer proves entitlement before raising Intel. A source label alone is never authority.

- [ ] **Step 4: Use source-derived reward security**

Use **R12** as the final ledger contract. Remove the generic public `SECURE_EXPEDITION_REWARD` action from the v1 plan. `ADD_EXPEDITION_REWARD` carries source intent/stale guard only; reducer derives kind/security from a canonical eligible source. Completion keeps all; extraction/failure keep only canonically secured entries.

```ts
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

Completion multiplier applies only to positive run-earned Cash/Fame deltas, never starting principal or losses.

- [ ] **Step 5: Guard Next Tour**

`PREPARE_NEXT_EXPEDITION` requires a non-null finalized outcome. G5-F3 additionally requires every Between-Tour decision resolved.

- [ ] **Step 6: Test and commit**

Required: fake arrival, early extraction, fake completion, system failure without pending failure, early Next Tour, entitled Intel 0→1→2/replay/save and forged-source rejection, source-derived secured/unsecured reward divergence, completion multiplier not refunding losses.

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/expeditionReducer.test.js \
  tests/node/expeditionExtraction.test.js \
  tests/node/expeditionNodeIntel.test.js
pnpm exec vitest run tests/ui/MapNode.test.jsx
git add src/types/expedition.d.ts src/context src/domain/expedition src/components/MapNodeView.tsx tests
git commit -m "feat(expedition): harden lifecycle intel and rewards"
```

---

# G1-F4 — Multi-axis failure and rescue

**Amends:** G1 Task 11; mandatory integration point for G2–G4; apply R4 and `00a/C3`.

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

- [ ] **Step 1: Define failure state**

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

State gets `pendingFailure` and `endingCause`.

- [ ] **Step 2: Add one evaluator**

```ts
export const evaluateExpeditionFailure = (
  state: GameState
): PendingExpeditionFailure | null
```

Rules:

```text
bankruptcy: existing canonical insolvency check
mobility_disabled: van condition <=0 and no ordinary travel can continue; expose repair/cannibalize/failure choices
technical_shutdown: a required current PreGig has any Condition disabled group; apply R4 so recovery/termination is always reachable
band_incapacitated: every member is critical-injured OR every member stamina <=0
crew_collapse: selectedCrewIds.length >0 AND every selected Crew actor is breaking AND no normal recovery option remains
harmony_collapse: harmony <=1 AND a crisis/event explicitly marks the collapse unresolved
                   (harmony is canonically clamped to minimum 1; low Harmony alone is not auto-failure)
authority_crisis: Heat ==100 after an authority encounter and no safe escape remains
critical_contract_breach: template has tourEndingOnFailure:true
```

- [ ] **Step 3: Use intent-only crisis actions**

```ts
OPEN_EXPEDITION_FAILURE_CRISIS { expectedRouteStep }
RESOLVE_EXPEDITION_FAILURE_CRISIS { reason, optionId, expectedRouteStep }
```

Reducer re-runs the evaluator and derives costs/effects from current state. `accept_failure` uses G1-F3 `system_failure`. Later gates register `field_repair/cannibalize` (G2), `rest` (G3), `pay_escape/sacrifice_reward` (G4). `extract_now` is present only when extraction is currently valid.

- [ ] **Step 4: Golden-path causes and commit**

Cover bankruptcy, mobility, technical shutdown, injury/crew, authority and critical contract. Where a rescue exists, crisis opens before terminal settlement; replay cannot settle twice.

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionFailure.test.js tests/node/expeditionReducer.test.js
pnpm exec vitest run tests/ui/FailureCrisisDialog.test.tsx
git add src/types/expedition.d.ts src/domain/expedition/failure.ts src/context src/ui/expedition/FailureCrisisDialog.tsx tests
git commit -m "feat(expedition): add multi-axis failure crises"
```

---

# G2-F1 — Owned-content cargo manifest and consumer boundary

**Amends:** G2 Tasks 1, 3, 4, 11; G2-A Amendment 4; apply R3.

**Files:**
- Modify: `src/types/expedition.d.ts`
- Modify: `src/domain/expedition/cargo.ts`
- Modify: `src/domain/expedition/loadout.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Modify: `src/context/reducers/expeditionSanitizers.ts`
- Modify: `src/ui/expedition/TourPrepLoadout.tsx`
- Modify: `src/ui/SupplyStopModal.tsx`
- Modify: `src/utils/economy/gigLogic/calculators/calculateMerchIncome.ts` and Gig-economy owner
- Modify: `src/hooks/useContrabandStash.ts`
- Modify: `src/context/reducers/bandReducer.ts`
- Modify: `src/hooks/minigames/useRoadieLogic.ts`
- Modify: `src/hooks/useMinigameSceneLogic.ts`
- Modify: `src/utils/eventEngine/eventEffectHandlers.ts`
- Modify: `src/utils/gameState/delta.ts` as scoped by R3
- Test: `tests/node/expeditionCargo.test.js`
- Test: `tests/node/expeditionLoadout.test.js`
- Test: `tests/node/expeditionReducer.test.js`
- Test: `tests/node/economyEngine.merchProfiles.test.js`
- Test: `tests/ui/TourPrep.test.tsx`
- Test: `tests/ui/useContrabandStash.test.jsx`
- Test: `tests/ui/useRoadieLogic.test.jsx`

- [ ] **Step 1: Materialize actual selected content**

```ts
export interface ExpeditionCargoManifest {
  spareParts: number
  supplies: number
  merch: ExpeditionMerchSelection[]
  contraband: ExpeditionContrabandSelection[]
  technicalGearSlots: number
}

export const materializeExpeditionCargo = (
  state: GameState,
  loadout: ExpeditionLoadout
): ExpeditionCargoManifest | null
```

V1 slot costs:

```text
sparePart/supply: 1 each
merch: ceil(quantity / 25) per inventory key
contraband: 1 per selected stack; hiddenContrabandSlots only offsets eligible Contraband slots
technicalGearSlots: 1 per member whose canonical committed equipment object has at least one non-null/non-false own entry
```

Remove caller-entered `merchSlots`/`contrabandSlots` as authority. Start reducer re-derives ownership/capacity from canonical `band.inventory`, `band.stash`, committed member equipment and selected chassis modules.

- [ ] **Step 2: Route every active-run consumer through the manifest view**

Implement **R3**. The manifest is not only a capacity record; it is the active Expedition's allowed cargo view. Post-gig merch, Contraband UI/use, Roadie/minigame selection and Expedition event/confiscation selection must not bypass it. Canonical inventory/stash remain owners of physical content.

- [ ] **Step 3: Keep purchases/consumption authoritative**

Supply purchases mutate manifest through hardened reducer-derived price/capacity actions. Contraband consumption first proves the instance/key is in the active manifest, then uses the canonical `USE_CONTRABAND` effect/removal. Confiscation uses canonical stash removal and synchronizes the manifest entry in the same resolved sequence.

- [ ] **Step 4: Test and commit**

Test omitted merch yields zero Expedition merch revenue, omitted stash item cannot be used/selected/confiscated by Expedition, over-selected stacks/merch reject start, technical gear consumes slots, hidden slots do not create content, Supply Stop cannot overflow, stale purchase/use is no-op.

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/expeditionCargo.test.js \
  tests/node/expeditionLoadout.test.js \
  tests/node/expeditionReducer.test.js \
  tests/node/economyEngine.merchProfiles.test.js
pnpm exec vitest run tests/ui/TourPrep.test.tsx tests/ui/useContrabandStash.test.jsx tests/ui/useRoadieLogic.test.jsx
pnpm run typecheck:core
git add src/types/expedition.d.ts src/domain/expedition/cargo.ts src/domain/expedition/loadout.ts src/context src/ui src/hooks src/utils tests
git commit -m "feat(expedition): bind cargo consumers to tour manifest"
```

---

# G2-F2 — Travel wear, active Condition, defects and insurance

**Amends:** G2 Tasks 2, 5–9; fixes the travel-owner/file drift; apply R4.

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
- Modify: `src/ui/expedition/FailureCrisisDialog.tsx`
- Modify: `src/hooks/rhythmGame/useRhythmGameScoring.ts`
- Modify: `src/hooks/rhythmGame/scoring/useHandleHit.ts`
- Modify: `src/hooks/rhythmGame/scoring/useHandleMiss.ts`
- Test: `tests/node/expeditionCondition.test.js`
- Test: `tests/node/expeditionInsurance.test.js`
- Test: `tests/node/expeditionDefects.test.js`
- Test: `tests/node/minigameReducer.test.js`
- Test: `tests/node/minigameReducer_regression.test.js`
- Test: `tests/ui/PreGig.test.jsx`
- Test: `tests/ui/useRhythmGameScoring.test.jsx`

- [ ] **Step 1: Compose road wear in the actual travel settlement**

`handleCompleteTravelMinigame` in `src/context/reducers/minigameReducer.ts` remains the single owner of committed `player.van.condition`.

```ts
export interface ExpeditionTravelWearInput {
  baseConditionLoss: number
  vehicleMultiplier: number
  crewMultiplier: number
  regionMultiplier: number
  pressureMultiplier: number
}

export const resolveExpeditionTravelWear = (input: ExpeditionTravelWearInput): number =>
  Math.max(0, Math.round(
    input.baseConditionLoss * input.vehicleMultiplier * input.crewMultiplier *
    input.regionMultiplier * input.pressureMultiplier
  ))
```

Use the existing travel result as `baseConditionLoss`; apply the composed Expedition loss exactly once before committing van condition. G5-F1/R9 supplies final profile values; earlier gates use identity `1`.

Insurance is evaluated immediately after a covered canonical mutation computes a transition from `>0` to `0`, including vehicle travel and technical-wear/event damage; it rescues at most once.

- [ ] **Step 2: Condition changes rhythm gameplay and zero cannot softlock**

```ts
export interface ExpeditionConditionGameplayProfile {
  timingWindowMultiplier: number
  scoreMultiplier: number
  crowdDecayMultiplier: number
  disabledGroups: ConditionGroup[]
}
```

Band mapping:

```text
PA:          Good 1.00 | Worn 0.97 | Critical 0.90 | Breaking 0.82
Instruments: Good 1.00 | Worn 0.98 | Critical 0.92 | Breaking 0.85
Stage Gear:  Good 1.00 | Worn 1.05 | Critical 1.15 | Breaking 1.30 crowd-decay
```

`timingWindowMultiplier = clamp(PA * Instruments, 0.65, 1)`. `scoreMultiplier = clamp(Instruments, 0.8, 1)`. In `useHandleHit`, multiply the calculated hit window by timing multiplier and final score by score multiplier. In `useHandleMiss`, multiply active crowd decay by the Condition crowd-decay multiplier. `useRhythmGameScoring` passes the profile down.

At exactly condition `0`, add the group to `disabledGroups`. PreGig disables Start **and applies R4**: the same screen exposes canonical field-repair/cannibalize or deliberate `technical_shutdown` failure. Values 1–19 remain playable.

- [ ] **Step 3: Complete the hidden-defect lifecycle**

```ts
REVEAL_EXPEDITION_DEFECT
TRIGGER_EXPEDITION_DEFECT

interface RevealExpeditionDefectPayload {
  defectId: string
  expectedDiscovered: false
  source: 'technician' | 'inspection' | 'full_service'
}

interface TriggerExpeditionDefectPayload {
  defectId: string
  expectedSeverity: 'minor' | 'major'
  roll: number
}
```

```ts
export const getDefectTriggerRisk = (defect: HiddenDefectState): number =>
  defect.severity === 'major' ? 0.35 : 0.15
```

Technician or `inspectionLevel >=1` Quick Check reveals one deterministic undiscovered defect; Full Service reveals all. At the next gig/travel wear seam, creator stamps one finite roll per eligible defect; reducer revalidates id/severity/risk. Minor trigger adds 5 wear to its group, major 10, then removes the defect. Undiscovered defects never appear in text/ARIA.

- [ ] **Step 4: Test and commit**

Prove vehicle modifier changes real van condition; insurance rescues once; worn/critical Condition changes actual hit/scoring/crowd behavior; 0 at next mandatory Gig always offers recover-or-terminate; defect create→hidden→reveal→trigger/remove works.

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/expeditionCondition.test.js tests/node/expeditionInsurance.test.js tests/node/expeditionDefects.test.js \
  tests/node/minigameReducer.test.js tests/node/minigameReducer_regression.test.js
pnpm exec vitest run tests/ui/PreGig.test.jsx tests/ui/useRhythmGameScoring.test.jsx
pnpm run typecheck:core
git add src/domain/expedition src/context src/hooks src/scenes/PreGig.tsx src/ui/expedition/FailureCrisisDialog.tsx tests
git commit -m "feat(expedition): make condition and defects gameplay relevant"
```

---

# G3-F1 — Production Crew effects, Band↔Crew relationships and persistent consequences

**Amends:** G3 Tasks 4–8, 11–12; apply R5.

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
- Modify: `src/types/career.d.ts`
- Modify: `src/context/careerActionCreators.ts`
- Modify: `src/context/reducers/careerReducer.ts`
- Modify: `src/context/reducers/careerSanitizers.ts`
- Modify: `src/data/events/crew.ts`
- Modify: `src/scenes/RunSummary.tsx`
- Test: `tests/node/expeditionCrewStress.test.js`
- Test: `tests/node/expeditionRelationships.test.js`
- Test: `tests/node/expeditionInjuries.test.js`
- Test: `tests/node/expeditionCareer.test.js`
- Test: `tests/node/saveSliceRoundTrip.test.js`

- [ ] **Step 1: Consume every aggregate role field**

```text
fieldRepairEfficiency -> repairs.ts
technicalWearMultiplier -> condition.ts
roadWearMultiplier -> G2-F2 vehicle/travel wear
contractRewardMultiplier -> contracts.ts
heatGainMultiplier -> pressure.ts positive Heat deltas
scoutIntelBonus -> R7 entitled node-Intel reveal
```

Each gets an app integration assertion before simulator use.

- [ ] **Step 2: Persist run consequences once**

```ts
export interface CrewCareerSettlement {
  crewId: string
  loyaltyDelta: number
  storyStepDelta: number
}

export const buildCrewCareerSettlement = (
  state: GameState,
  crewId: string
): CrewCareerSettlement
```

Rules: completed +5 loyalty; extracted +2; failed +0; ending crew stress >=90 subtracts 3; completed with stress <=39 adds another +2. Serious/critical **band-member** injuries persist at the same stage through a typed Career action derived from finalized Expedition state; strain/light clear between tours. Caller never supplies the next persistent stage.

Use the same `runId`/career-settlement idempotency barrier as Tour Tokens. `PREPARE_NEXT_EXPEDITION` clears run stress/traits but not Career loyalty/relationships/persistent serious injury.

- [ ] **Step 3: Replace Crew-only pair ids with R5 actor references and wire production behavior**

Use `ExpeditionRelationshipActorRef`, `career.expeditionRelationshipByPair` and reducer-derived `toExpeditionRelationshipKey`. At least one validated Crew event changes a Band↔Crew relationship and a later event condition/option reads the tier. Direct pair keys and two-Crew-only payloads from the older child-plan snippet are superseded.

- [ ] **Step 4: Test and commit**

Prove Technician repair effect, Driver road-wear effect, Manager contract effect, Security Heat effect, Scout Intel effect, loyalty once, serious injury persists after next-tour reset, Band↔Crew relationship persists and changes a later event, hostile actor refs are rejected.

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/expeditionCrewStress.test.js tests/node/expeditionRelationships.test.js \
  tests/node/expeditionInjuries.test.js tests/node/expeditionCareer.test.js tests/node/saveSliceRoundTrip.test.js
pnpm run typecheck:core
git add src/domain/expedition src/types/career.d.ts src/context src/data/events/crew.ts src/scenes/RunSummary.tsx tests
git commit -m "feat(expedition): wire crew roles relationships and career consequences"
```

---

# G3-F2 — Production-valid Expedition events

**Amends:** G3 Task 10; G4 Tasks 9, 11.

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

- [ ] **Step 1: Use the repository event contract exactly**

Every event has `id`, valid category/trigger/chance, `title`, `description`, and each option has `label`, `outcomeText`, plus validated effect/skillCheck. Every event `condition` is explicitly `(state: GameState) => boolean`.

Canonical skeleton:

```ts
{
  id: 'expedition_example',
  category: 'band',
  trigger: 'random',
  chance: 0.08,
  title: 'events:expedition_example.title',
  description: 'events:expedition_example.description',
  condition: (state: GameState) => state.expedition.status === 'active',
  options: [{
    id: 'accept',
    label: 'events:expedition_example.accept',
    outcomeText: 'events:expedition_example.acceptOutcome',
    effect: { type: 'expedition', delta: { heat: 3 } }
  }]
}
```

Do not author `resource:'fame'`. Use the existing supported Fame stat/event-delta path. Vehicle damage uses `stat:'van_condition'`; Expedition fields use the single G2/G3 typed Expedition event adapter.

- [ ] **Step 2: End-to-end validate each family**

For Crew, Authority/Pressure and Rival:

```text
validateGameEvent -> resolveEventChoice -> resolveEvent -> gameReducer(actions)
```

Assert both a legacy canonical effect and an Expedition effect commit. Include the R5 relationship producer/consumer and R7 Social/contact Intel-grant event producers in their relevant family tests.

- [ ] **Step 3: Run and commit**

```bash
pnpm run test:node
pnpm run test:additional
git add src/data/events public/locales/en/events.json public/locales/de/events.json tests
git commit -m "fix(events): make expedition events production valid"
```

---

# G4-F1 — Intent-based obligations, committed Sponsor and quest-credit settlement

**Amends:** G4 Tasks 3–6; G4-A Amendment 6; apply R6 and `00a/C4`.

**Files:**
- Modify: `src/types/contracts.d.ts`
- Modify: `src/domain/expedition/contracts.ts`
- Modify: `src/types/social.d.ts`
- Modify: `src/data/brandDeals.ts`
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/context/expeditionActionCreators.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Test: `tests/node/expeditionContracts.test.js`
- Test: `tests/node/expeditionReducer.test.js`
- Test: `tests/node/questSystem.test.js`
- Test: `tests/ui/useDealHandlers.test.jsx`

- [ ] **Step 1: Replace full `next` obligation payloads with signals**

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

Reducer validates the signal against current state and recomputes obligation progress/status with canonical pure helpers. Caller cannot submit progress/status.

- [ ] **Step 2: Materialize the pre-tour Sponsor obligation at START**

Apply **R6**. The hardened START reducer revalidates the persisted active Sponsor deal and derives its zero-payout linked obligation exactly once from `runId + dealId`. Do not wait for the post-START deal-acceptance seam to recreate an already active deal.

- [ ] **Step 3: Preserve canonical income Quest events**

Hardened settlement still derives reward from the obligation template. Use the exact `00a/C4` producer signatures:

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

Emit only for positive corresponding deltas through the existing `QuestEvents.emit`/dispatch path. No direct reward write may omit companion Quest credit.

- [ ] **Step 4: Test and commit**

Forged completion stays active; valid signals complete; committed Sponsor START materializes/progresses once; reward and Quest credit occur once; replay does nothing.

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/expeditionContracts.test.js tests/node/expeditionReducer.test.js tests/node/questSystem.test.js
pnpm exec vitest run tests/ui/useDealHandlers.test.jsx
pnpm run typecheck:core
git add src/types/contracts.d.ts src/types/social.d.ts src/data/brandDeals.ts src/domain/expedition/contracts.ts src/context tests
git commit -m "feat(expedition): derive sponsor obligations from canonical state"
```

---

# G4-F2 — Full Pressure Director, typed Rival outcomes and Nemesis rule escalation

**Amends:** G4 Tasks 8, 10–11; apply R8 and `00a/C5`.

**Files:**
- Modify: `src/types/career.d.ts`
- Modify: `src/domain/expedition/rivals.ts`
- Create: `src/domain/expedition/nemesis.ts`
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/context/careerActionCreators.ts`
- Modify: `src/context/reducers/careerReducer.ts`
- Modify: `src/context/useCareerDispatchActions.ts`
- Modify: `src/domain/expedition/pressureDirector.ts`
- Modify: `src/context/useMapGeneration.ts`
- Modify: `src/domain/expedition/finale.ts`
- Modify: `src/utils/brandDealLogic.ts`
- Test: `tests/node/expeditionRivals.test.js`
- Test: `tests/node/pressureDirector.test.js`
- Test: `tests/utils/brandDealLogic.test.ts`
- Test: `tests/social/extendedSocial.test.js`
- Test: `tests/node/mapGenerator.test.js`

- [ ] **Step 1: Add replay-safe persistent outcome action**

```ts
export interface RecordExpeditionRivalOutcomePayload {
  rivalId: string
  encounterId: string
  outcome: 'hostile_win' | 'hostile_loss' | 'respect' | 'alliance'
  expectedEncounterCount: number
}
```

Creator builds `encounterId = ${runId}:${nodeId}:${rivalId}`. Career stores newest 64 `settledRivalEncounterIds`. Reducer re-derives encounter id from current run/current node/current rival, validates expected count, then calls `applyRivalOutcome`. Unknown/stale/replayed action is identical-state no-op.

- [ ] **Step 2: Restore the multi-input Pressure Director**

Apply **R8**. `buildPressureDirectorContext(state)` derives Cash, aggregate technical Condition, selected Crew Stress, active Obligations, Rival/Nemesis and remaining route depth in addition to canonical Heat/Exposure. The Director applies bounded family multipliers only after normal event eligibility/cooldowns.

- [ ] **Step 3: Define Nemesis rule profile**

```ts
export interface NemesisRuleProfile {
  rivalEventWeightMultiplier: number
  rivalRouteWeight: number
  sponsorOffersBlocked: number
  forceRivalHuntTarget: boolean
  forceRivalFinale: boolean
}
```

```text
Level 0: 1.00 / 0.00 / 0 / false / false
Level 1: 1.25 / 0.08 / 0 / false / false
Level 2: 1.50 / 0.12 / 1 / false / false
Level 3: 1.75 / 0.18 / 1 / true  / false
Level 4: 2.00 / 0.25 / 2 / true  / true
```

Consumers: Rival event weighting after R8; G1-F2 Rival route subtype weight; exact `src/utils/brandDealLogic.ts` interference helper from `00a/C5`; Rival Hunt reuses level>=3 rival; level 4 wins Finale priority as `rival_battle` unless run is already terminal.

- [ ] **Step 4: Cross-run/director test and commit**

Escalate same rival, next tour proves higher Rival route/event opportunity plus sponsor interference. Hold Heat/Exposure constant and separately vary Condition, Crew Stress, Obligations and route depth to prove Director weights change without resurrecting ineligible events. Old encounter replay no-op.

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/expeditionRivals.test.js tests/node/pressureDirector.test.js tests/node/mapGenerator.test.js \
  tests/social/extendedSocial.test.js
pnpm exec vitest run tests/utils/brandDealLogic.test.ts
pnpm run typecheck:core
git add src/types/career.d.ts src/domain/expedition src/context src/utils/brandDealLogic.ts tests
git commit -m "feat(expedition): restore director and nemesis escalation"
```

---

# G4-F3 — Executable contextual finales

**Amends:** G4 Task 12; G4-A Amendment 7; `00a/C6` defines the exact registry/getter.

**Files:**
- Modify: `src/domain/expedition/finale.ts`
- Create: `src/data/expedition/finaleProfiles.ts`
- Modify: `src/context/reducers/gigReducer.ts`
- Modify: `src/hooks/usePreGigLogic.ts`
- Modify: `src/hooks/postGig/handlers/useContinueHandler.ts`
- Test: `tests/node/expeditionFinale.test.js`
- Test: `tests/hooks/preGig/usePreGigHandlers.test.tsx`
- Test: `tests/ui/postGigHandlerLogic.test.jsx`

- [ ] **Step 1: Define exact context and profiles**

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

```text
regional_headliner  55 /1.00/1.00/1.00/+0 /false/1.00
corporate_showcase  70 /1.15/1.05/1.00/+2 /false/1.05
rival_battle        65 /1.05/1.15/1.05/+5 /true /1.15
illegal_show        60 /1.10/1.20/1.10/+10/false/1.20
disaster_gig        50 /1.00/1.10/1.35/+3 /false/1.30
```

`getExpeditionFinaleProfile(type)` returns the exact frozen registry entry defined by `00a/C6`.

- [ ] **Step 2: Consume at existing Gig owners**

PreGig exposes minimum expectation/scoring context; PostGig applies payout/Fame/Heat/wear/rare-reward weights once. `rival_battle` enables Rival scoring. Existing `START_GIG` reset semantics clear transient Finale modifiers; `finaleType` stays in Expedition state for settlement/Legendary mapping.

- [ ] **Step 3: Five end-to-end tests and commit**

Every type differs from Regional Headliner in a player-facing pre/post mechanic; Disaster has highest technical wear; Rival enables Rival scoring; getter returns each frozen entry.

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionFinale.test.js
pnpm exec vitest run tests/hooks/preGig/usePreGigHandlers.test.tsx tests/ui/postGigHandlerLogic.test.jsx
git add src/data/expedition/finaleProfiles.ts src/domain/expedition/finale.ts src/context/reducers/gigReducer.ts src/hooks tests
git commit -m "feat(expedition): make contextual finales mechanically distinct"
```

---

# G5-F1 — Complete production rule composition path

**Amends:** G5 Tasks 5–8; all G6 strategy assumptions; apply R9.

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
- Modify: `src/domain/expedition/crewStress.ts`
- Modify: `src/domain/expedition/nodeIntel.ts`
- Modify: `src/domain/expedition/extraction.ts`
- Modify: `src/domain/expedition/rivals.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Modify: `src/context/useMapGeneration.ts`
- Create: `tests/node/expeditionRuleProfile.test.js`
- Test: `tests/node/expeditionRegionProfile.test.js`

- [ ] **Step 1: Define the complete composed profile**

Use **R9** as the exact result shape. Do not reintroduce the narrower 11-field profile. Compose Base → Region → Tour Type → selected Crew aggregate → Starter Perk → Tour Pressure → Nemesis numeric weighting.

- [ ] **Step 2: One production consumer per field**

Use the R9 consumer table. In particular, Exposure, Crew Stress, extraction retention, contract penalties, Authority weighting, Rival/Finale rewards and Intel floor must have app owners before G6 may model them. Rule-changing Legendary capabilities remain orthogonal production resolvers.

- [ ] **Step 3: App-side profile differences and parity tests**

Prove Industrial changes real road wear/repair; Festival technical wear/gig reward; Corporate contract/Heat; Underground Heat/rare rewards; Rival Hunt actually reuses/selects a Rival. Add explicit parity cases for Media Frenzy, No Safety Net, Union Trouble, Press Pass and Authority weighting.

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionRuleProfile.test.js tests/node/expeditionRegionProfile.test.js
pnpm run typecheck:core
git add src/domain/expedition/ruleProfile.ts src/data/expedition src/domain/expedition src/context tests
git commit -m "feat(expedition): compose every live tour rule through production helpers"
```

---

# G5-F2 — Authoritative Ascension/Tour Pressure

**Amends:** G5 Tasks 8, 11.

**Files:**
- Modify: `src/domain/expedition/loadout.ts`
- Modify: `src/context/reducers/expeditionSanitizers.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Test: `tests/node/expeditionLoadout.test.js`
- Test: `tests/node/expeditionSanitizers.test.js`
- Test: `tests/node/expeditionReducer.test.js`

- [ ] **Step 1: Enforce in canonical validator**

Every `pressureModifierId` must exist, be unique, count <=3, satisfy its unlock requirement, and the list must be empty unless `career.ascensionUnlocked === true`. Reducer start reuses this validator. Sanitizer drops unknown/duplicate ids; malformed saved state never grants Ascension.

- [ ] **Step 2: Simulator profiles seed progression honestly**

Any G6 profile using Pressure sets `career.ascensionUnlocked:true` and required unlock markers **before** production loadout validation. No simulator bypass.

- [ ] **Step 3: Test and commit**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionLoadout.test.js tests/node/expeditionSanitizers.test.js tests/node/expeditionReducer.test.js
git add src/domain/expedition/loadout.ts src/context/reducers tests/node
git commit -m "fix(expedition): enforce ascension pressure at start"
```

---

# G5-F3 — 1–3 consequential between-tour decisions

**Amends:** G5 Task 12; `00a/C7` supplies exact decision ids/effects.

**Files:**
- Modify: `src/types/career.d.ts`
- Create: `src/data/expedition/betweenTourDecisions.ts`
- Create: `src/domain/expedition/betweenTour.ts`
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/context/careerActionCreators.ts`
- Modify: `src/context/reducers/careerReducer.ts`
- Modify: `src/context/useCareerDispatchActions.ts`
- Modify: `src/context/gameReducer.ts` if an atomic Player+Career mutation is required by C7
- Modify: `src/scenes/RunSummary.tsx`
- Create: `src/ui/expedition/BetweenTourDecisions.tsx`
- Test: `tests/node/expeditionBetweenTour.test.js`
- Test: `tests/ui/RunSummary.test.tsx`
- Test: `tests/golden-path/expeditionMetaLoop.test.js`

- [ ] **Step 1: Persist decision set by finalized run id**

```ts
export interface BetweenTourDecisionSet {
  runId: string
  decisionIds: string[]
  resolvedDecisionIds: string[]
}
```

`CareerState.betweenTour: BetweenTourDecisionSet | null`. Apply `00a/C7` for `nextTour` state, exact family eligibility, costs and outcomes.

- [ ] **Step 2: Deterministically choose 1–3**

```ts
export const buildBetweenTourDecisionSet = (state: GameState): BetweenTourDecisionSet
```

Use the exact C7 ids/families: `band_injury_recovery`, `crew_stress_debrief`, `rival_response`, `sponsor_followup`, `starting_condition`, fallback `tour_debrief`. Sort eligible ids by stable hash `${runId}:${decisionId}`, take `min(3, max(1, eligible.length))`.

- [ ] **Step 3: Intent-only resolution**

```ts
RESOLVE_BETWEEN_TOUR_DECISION { runId, decisionId, optionId }
```

Reducer re-evaluates definition/eligibility and derives the exact C7 effects. No payload carries money, loyalty, injury stage, unlock or next-state values.

- [ ] **Step 4: Gate Next Tour and test replay**

`PREPARE_NEXT_EXPEDITION` rejects until all decision ids resolved. Set generation and resolution survive save/reload/StrictMode without duplication.

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionBetweenTour.test.js tests/golden-path/expeditionMetaLoop.test.js
pnpm exec vitest run tests/ui/RunSummary.test.tsx
git add src/types/career.d.ts src/data/expedition/betweenTourDecisions.ts src/domain/expedition/betweenTour.ts src/context src/scenes/RunSummary.tsx src/ui/expedition/BetweenTourDecisions.tsx tests
git commit -m "feat(expedition): add between-tour decisions"
```

---

# G5-F4 — HQ becomes the meta hub instead of a parallel run-1 power shop

**Amends:** G5 Task 9 and the pre-Expedition balance objectives; `00a/C8` supplies exact UI files/tests.

**Files:**
- Modify: `src/data/upgradeCatalog.ts`
- Modify: `src/data/hqItems.ts`
- Modify: `src/ui/bandhq/ExpeditionMetaTab.tsx`
- Modify: `src/ui/bandhq/UpgradesTab.tsx`
- Modify: `src/ui/bandhq/ShopTab.tsx`
- Modify: `src/ui/bandhq/BandHQContentArea.tsx` only if role-filtered catalogs are passed there
- Test: `tests/ui/BandHQ.test.jsx`
- Test: `tests/ui/UpgradesTab.test.jsx`
- Test: `tests/ui/ShopTab.test.jsx`
- Modify: `scripts/game-balance-simulation.mjs`

- [ ] **Step 1: Classify permanent vs tactical catalog roles**

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
canonical chassis/module capability access -> meta progression, selected in Tour Prep
shop consumables/instruments/merch -> run_gear
legacy aliases -> legacy_compatibility, hidden from active purchase catalog
```

Existing saves keep already-owned effects. Fresh Expedition careers cannot buy migrated permanent items as ordinary run-1 Fame purchases; Garage/Workshop facility + unlock-set progression owns new access. Use `getExpeditionVisibleUpgradeCatalog` from C8; do not duplicate ids in React.

- [ ] **Step 2: Keep tactical purchases tactical**

Run-facing Shop/Upgrades can still sell consumable/current-run gear through existing owners. Permanent capability purchase appears in `ExpeditionMetaTab` and uses Tour Tokens/hardened journaled unlock-set purchase.

- [ ] **Step 3: Add balance corridor**

Report through the R11 Career-sequence harness, not `runSingleSimulation`:

```text
firstMetaFacilityRun
firstPermanentExpeditionCapabilityRun
run1PermanentCapabilityPurchaseRate
```

Initial hypotheses: median facility run 2–4; permanent capability run 2–5; run-1 permanent rate <25%.

- [ ] **Step 4: Test and commit**

Fresh career cannot purchase migrated permanent power from old Fame catalog; legacy save retains owned effect; facility/unlock-set path exposes capability.

```bash
pnpm exec vitest run tests/ui/BandHQ.test.jsx tests/ui/UpgradesTab.test.jsx tests/ui/ShopTab.test.jsx
pnpm run typecheck:core
git add src/data/upgradeCatalog.ts src/data/hqItems.ts src/ui/bandhq scripts/game-balance-simulation.mjs tests
git commit -m "feat(expedition): move permanent HQ power into meta progression"
```

---

# G5-F5 — Legendary rewards change rules

**Amends:** G5 Task 4. Numeric starter perks remain allowed; finale-earned Legendary rewards below replace the old multiplier-based Legendary mapping. `00a/C9` owns exact run state/trigger/routing details; R10 owns G6 usage.

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
- Modify: `src/context/reducers/expeditionReducer.ts`
- Test: `tests/node/expeditionLegendaryRules.test.js`
- Test: `tests/node/expeditionExtraction.test.js`
- Test: `tests/node/expeditionContracts.test.js`

- [ ] **Step 1: Map Finale → capability**

```text
regional_headliner -> expedition.legendary.safe_harbor
corporate_showcase -> expedition.legendary.the_fixer
rival_battle -> expedition.legendary.nemesis_key
illegal_show -> expedition.legendary.ghost_route
disaster_gig -> expedition.legendary.salvage_rights
```

Persist with the already hardened unlockManager + `ADD_UNLOCK` Run Summary barrier.

- [ ] **Step 2: Exact rule transforms**

Apply `00a/C9` as the exact contract for run state and triggers:

```text
safe_harbor    -> one additional effective Extraction step after first qualifying major Gig
The Fixer      -> first would-fail obligation becomes terminal excused with no reward/penalty
Nemesis Key    -> Rival Intel floor 2 + once/run effective shortcut edge to nearest reachable Rival node
Ghost Route    -> first eligible authority roadblock can convert to Underground encounter for +5 Heat, no bribe
Salvage Rights -> after insurance, first technical >0 -> 0 becomes 20 + discovered major defect
```

Owning reducer consumes each once-run flag atomically with the transformed rule.

- [ ] **Step 3: Remove Legendary multiplier reward path and test rules**

Old finale reward mapping to `headliner_pass`, `nemesis_dossier`, `disaster_artist` or `expedition.perk.legendary.*` is superseded. Tests assert actual extra extraction, excused contract, Rival Intel/shortcut, roadblock conversion and salvage transform exactly once.

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionLegendaryRules.test.js tests/node/expeditionExtraction.test.js tests/node/expeditionContracts.test.js
pnpm run typecheck:core
git add src/data/expedition src/domain/expedition src/types/expedition.d.ts src/context/reducers/expeditionReducer.ts tests
git commit -m "feat(expedition): make legendary rewards change rules"
```

---

# G6-F1 — Single-run simulator proves shipped run behavior

**Amends:** G6 Tasks 2–14. G6-A/G6-B v15 horizon, disjoint calibration/holdout and paired extraction cohorts remain mandatory. Apply R9/R10; cross-run metrics move to G6-F2/R11.

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

- [ ] **Step 1: Import production helpers**

The simulator builds a production-valid state and uses:

```text
validateExpeditionLoadout
getExpeditionRuleProfile
calculateExpeditionSettlement
evaluateExpeditionFailure
getExpeditionConditionGameplayProfile
resolveExpeditionTravelWear
buildCrewCareerSettlement
getNemesisRuleProfile
resolveExpeditionFinaleType
getExpeditionFinaleProfile
Legendary rule helpers from src/domain/expedition/legendaryRules.ts
```

No duplicate Region/Tour/Crew/Pressure/Condition/Legendary formulas.

- [ ] **Step 2: Full-build strategy profiles without fake Legendary starter ids**

Each of six strategy profiles supplies valid setlist/equipment/module commitment, real manifest-backed cargo/Contraband, Crew, sponsor/contracts, real starter perk or `null`, Fuel target and Cash reserve. Pressure profiles explicitly seed `career.ascensionUnlocked:true` and required unlocks before calling production validation.

Apply **R10**: `starterPerkId` may use only `null`, `mechanic_kit`, `press_pass`, `underground_contact`; late-career Legendary capabilities are seeded as separate `expedition.legendary.*` unlock markers.

- [ ] **Step 3: Add restored-design run metrics**

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
legendaryRuleActivationRate
safeHarborActivationCount
fixerExcuseCount
nemesisShortcutActivationCount
ghostRouteConversionCount
salvageRightsActivationCount
```

Meaningful node choice = at least two reachable connections with different effective route class/subtype or materially different revealed danger/reward tier.

Do **not** emit `firstMetaFacilityRun`, `firstPermanentExpeditionCapabilityRun`, `run1PermanentCapabilityPurchaseRate` or `betweenTourDecisionMean` from the one-run harness.

- [ ] **Step 4: Structural blocking gates**

Block release evidence if:

```text
any strategy bypasses production loadout validation
simulator uses a modifier with no production consumer/app test
Rival Hunt cannot produce Rival route/finale behavior
Underground build cannot produce Underground route option
critical/breaking Condition never changes gameplay or can softlock at zero
Crew role is measured but has no production effect
band↔crew relationship is claimed but has no event producer/consumer
Pressure Director ignores canonical non-Heat/Exposure inputs
failure causes collapse to bankruptcy only across the matrix
between-tour/meta metric is incorrectly sourced from runSingleSimulation
Legendary ownership is encoded as a superseded starterPerkId
any of the five Legendary transforms lacks deterministic production coverage
paired Extract/Continue dominance reproduces in both cohorts
one strategy dominates safety+reward in calibration and holdout
```

- [ ] **Step 5: Report pacing hypotheses**

```text
Standard real run: 20–30 min
meaningful visited nodes: 7–9
travel economic share: 3–6%
no one Crew role in >80% successful builds unless explicitly profile-specific
Extraction chosen in a non-trivial band of paired states rather than 0% or 100%
```

Do not translate duration back into a fake day horizon.

- [ ] **Step 6: Run verification**

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

G6 is not yet complete until G6-F2 also passes.

---

# G6-F2 — Linked Career-sequence evidence for meta progression

**Amends:** G6 metrics/release reporting; apply R11.

**Files:**
- Create: `scripts/utils/expedition-career-simulation.mjs`
- Modify: `scripts/utils/expedition-balance-profiles.mjs`
- Modify: `scripts/utils/expedition-balance-metrics.mjs`
- Modify: `scripts/utils/balance-report-metadata.mjs`
- Modify: `scripts/game-balance-simulation.mjs` only to orchestrate/report the separate cohort
- Create: `tests/node/expedition-career-simulation.test.js`
- Modify: `tests/node/expedition-balance-metrics.test.js`
- Modify: `tests/node/balanceSourceFiles.test.js`

- [ ] **Step 1: Implement `runCareerSequence` exactly as R11**

Use six linked runs, 1,000 sequences/profile and disjoint `#career-calibration` / `#career-holdout` seed namespaces. Preserve only production-persistent state and advance only through production actions/validators.

- [ ] **Step 2: Execute Between-Tour and meta policy through production boundaries**

Resolve all generated 1–3 decisions before Next Tour; apply at most one deterministic eligible/affordable meta purchase per between-run phase; construct every next loadout from currently legal choices and call production validation/START.

- [ ] **Step 3: Report cross-run metrics only from Career sequences**

```text
firstMetaFacilityRun
firstPermanentExpeditionCapabilityRun
run1PermanentCapabilityPurchaseRate
betweenTourDecisionMean
crossTourNemesisEscalationRate
legendaryCapabilityCarryRate
```

Calibration/holdout reports expose both populations separately. Blocking meta claims require reproduction in holdout; never merge seeds and then call the result a holdout.

- [ ] **Step 4: Test and final G6 commit**

Required tests: deterministic replay, disjoint seeds, persistence carry-over, Between-Tour gating, at-most-one meta purchase, next-run production validation, Legendary carry, Nemesis escalation.

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expedition-career-simulation.test.js tests/node/expedition-balance-metrics.test.js
pnpm run test:node
pnpm run test:ui
pnpm run test:additional
pnpm run typecheck:core
pnpm run typecheck
pnpm run deadcode:check
pnpm run simulate:balance
node scripts/game-balance-expedition-probe.mjs
git add scripts reports tests
git commit -m "test(balance): gate shipped expedition run and career design"
```

---

## Final spec-coverage gate

Before G6 is green, every item requires both a named production owner and a test:

```text
[ ] All canonical plan entrypoints expose Spec -> 00a -> 00-spec -> hardening -> master -> G1..G6 in the same order
[ ] Tour Prep commits setlist/equipment/modules/crew/real cargo/Contraband/sponsor/contracts/perk/budget/fuel
[ ] Active-run setlist/modules/band equipment cannot drift from the committed build
[ ] Standard target remains 7–9 meaningful nodes and Rival/Underground are route-visible classes
[ ] Fog has entitled 0→1→2 Scout/Social/contact/perk producers; forged sources cannot reveal nodes
[ ] Reward security is source-derived; extraction/failure loses unsecured rare rewards and keeps canonical secured rewards
[ ] Failure can originate from economy, mobility, technical shutdown, band/crew, authority and high-risk contracts
[ ] Condition 0 always offers a canonical recovery or deliberate terminal path at a required PreGig
[ ] Cargo capacity and every active-run merch/Contraband consumer are bound to owned selected manifest content
[ ] Condition changes active gameplay; Hidden defects create→hide→reveal→trigger/resolve
[ ] Every Crew role changes a production system and persistent consequences survive appropriately
[ ] Relationships support Crew↔Crew and Band↔Crew and change later event eligibility/resolution
[ ] Committed Sponsor obligation exists/progresses from START without a second acceptance event
[ ] Obligations and Rival outcomes use authoritative typed transitions and settlement preserves Quest credit
[ ] Pressure Director consumes bounded Cash/Condition/Crew/Obligation/Rival/route-depth context without forcing ineligible events
[ ] Nemesis levels change opportunities/constraints across tours
[ ] Contextual Finales are mechanically distinct before and after the Gig
[ ] Complete RuleProfile axes have production consumers before simulator use
[ ] Between tours contain 1–3 idempotent consequential decisions
[ ] HQ permanent progression is primarily Meta, not universal run-1 Fame power
[ ] Legendary finale rewards are the five expedition.legendary.* rule transforms, never fake starter-perk multipliers
[ ] Single-run simulator imports shipped run rules and uses disjoint calibration/holdout evidence
[ ] Career-sequence simulator preserves Career across linked runs and is the only owner of meta/Nemesis/unlock timing metrics
[ ] Paired Extraction probe still uses disjoint 2,000-state calibration/holdout populations from the hardening contract
```

A state field, registry value, plan label or report row without a player-facing/production consequence does **not** satisfy the approved design.
