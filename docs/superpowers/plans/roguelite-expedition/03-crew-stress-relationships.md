# Crew, Stress, Relationships and Injuries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a constrained three-slot Crew build change route information, repairs, travel, pressure and recovery while Stress, Band↔Crew relationships, Band injuries and Crew injury/unavailability create understandable run and Career consequences.

**Architecture:** Static Crew identity/role data lives in `src/data/expedition/crew.ts`; run Stress/status lives in `expedition.crewRunById`; persistent loyalty/story/signature traits, Crew recovery debt and Expedition relationship pairs live in Career state. Persistent changes settle only from canonical finalized-run/event evidence.

**Tech Stack:** TypeScript 6, React 19, existing event engine/resolver, typed actions/reducers, current band/rhythm state, i18next, Node/Vitest/Playwright.

---

## Authority and dependencies

```text
approved design spec > master plan > this child plan
```

`00-*` files are NON-NORMATIVE. G3 depends on G1A + G2. G4 consumes G3 effects later; G5 supplies Crew Lounge/Between-Tour acquisition/recovery gates without replacing G3 state/action contracts.

---

## File structure

**Create:**

- `src/data/expedition/crew.ts`
- `src/data/expedition/crewSignatureTraits.ts`
- `src/domain/expedition/crew.ts`
- `src/domain/expedition/crewStress.ts`
- `src/domain/expedition/relationships.ts`
- `src/domain/expedition/injuries.ts`
- `src/data/events/crew.ts`
- `src/ui/expedition/ExpeditionCrewPicker.tsx`
- `src/ui/expedition/ExpeditionCrewStatus.tsx`
- `tests/node/expeditionCrew.test.js`
- `tests/node/expeditionCrewStress.test.js`
- `tests/node/expeditionRelationships.test.js`
- `tests/node/expeditionInjuries.test.js`
- `tests/node/expeditionCrewCareer.test.js`
- `tests/ui/ExpeditionCrewPicker.test.tsx`
- `tests/ui/ExpeditionCrewStatus.test.tsx`

**Modify:**

- `src/types/expedition.d.ts`
- `src/types/career.d.ts`
- `src/types/actions.d.ts`
- `src/context/actionTypes.ts`
- `src/context/GameState.tsx`
- `src/context/careerActionCreators.ts`
- `src/context/expeditionActionCreators.ts`
- `src/context/reducers/careerReducer.ts`
- `src/context/reducers/careerSanitizers.ts`
- `src/context/reducers/expeditionReducer.ts`
- `src/context/reducers/expeditionSanitizers.ts`
- `src/context/useCareerDispatchActions.ts`
- `src/context/useExpeditionDispatchActions.ts`
- `src/domain/expedition/effectiveRules.ts`
- `src/utils/eventEngine/eventEffectHandlers.ts`
- `src/domain/eventResolver.ts`
- `src/hooks/travel/useTravelMinigame.ts`
- `src/hooks/postGig/handlers/useContinueHandler.ts`
- `src/hooks/useArrivalLogic.ts`
- active rhythm/gig hit/miss/stamina owners
- `public/locales/en/ui.json`
- `public/locales/de/ui.json`
- `public/locales/en/events.json`
- `public/locales/de/events.json`

---

## Task 1: Define six Crew roles with exact production contributions

```ts
export type ExpeditionCrewRole =
  | 'technician'
  | 'roadie'
  | 'driver'
  | 'manager'
  | 'scout'
  | 'security'

export interface ExpeditionCrewDefinition {
  id: string
  role: ExpeditionCrewRole
  nameKey: string
  talentKey: string
  traitKey: string
  viceKey: string | null
}
```

Initial actors:

```text
crew_mika_tech       -> technician
crew_anja_roadie     -> roadie
crew_tom_driver      -> driver
crew_leyla_manager   -> manager
crew_nico_scout      -> scout
crew_saskia_security -> security
```

Tour Prep allows at most three unique available Crew ids.

Exact baseline contributions when selected and available:

```text
Technician -> effective fieldRepairEfficiency +0.20; enables crew_inspection
Roadie     -> effective technicalWearMultiplier x0.90; first major-Gig setupProtection +10
Driver     -> effective fuelConsumptionMultiplier x0.90; roadWearMultiplier x0.90
Manager    -> effective contractRewardMultiplier x1.08; enables Manager Contact/Double-Down detail options
Scout      -> G1 passive Intel 0->1 on one deterministic visible future node; Recon entitlement
Security   -> effective authorityEventWeightMultiplier x0.85; retains one safe comply/pay Authority option when otherwise legal
```

Extend the existing G2 `getEffectiveExpeditionRules(state)` in place with these contributions. Do not expose a second `getCrewAggregateEffects` path for production/simulator semantics.

Tests prove each role changes its named real consumer and no role exists only in G6.

---

## Task 2: Add contextual Crew run state and source-bound Stress

```ts
export interface ExpeditionCrewRunState {
  stress: number
  status: 'available' | 'strained' | 'injured' | 'unavailable'
  crisisId: string | null
}
```

Stress is contextual, not a seventh permanent HUD bar.

Action:

```ts
ADJUST_EXPEDITION_CREW_STRESS {
  crewId: string
  reason:
    | 'travel'
    | 'rest'
    | 'high_heat_event'
    | 'commitment_pressure'
    | 'relationship_event'
    | 'gig_recovery'
  sourceId: string
  expectedRouteStep: number
}
```

Reducer validates Crew id with `Object.hasOwn`, Crew is selected/currently available, source id is canonical for the reason and route step matches. It derives the delta from the owning source, applies `getEffectiveExpeditionRules(state).numeric.crewStressMultiplier` to positive gains only and clamps `0..100`.

Initial source deltas before multiplier:

```text
travel poor-road/long segment +6
rest                      -12
high_heat_event            +10
commitment_pressure        +8
relationship_event         ±8 according to canonical option
post-good-gig recovery     -5
```

Replay/stale/forged sources are identical-state no-ops.

---

## Task 3: Turn high Stress into a telegraphed crisis, not random unavoidable failure

Stress bands:

```text
0..39   stable
40..69  strained
70..89  high
90..100 crisis-eligible
```

At `>=90`, create at most one deterministic Crew crisis per route step if no crisis is already pending. Crisis events expose at least two legal paths when resources/state allow:

```text
rest / route opportunity cost
spend supplies or Cash
relationship/support option
accept consequence
```

A crisis may create an explicit Harmony-crisis signal only after the player resolves/declines available recovery and the event definition marks the unresolved outcome as Harmony-threatening. Low Harmony alone never creates `harmony_collapse`.

Export:

```ts
getUnresolvedHarmonyCrisisSignal(state): ExpeditionFailureSignal | null
```

G1B consumes this exact source.

---

## Task 4: Model Crew↔Crew and Band↔Crew relationships with source-derived event outcomes

```ts
export type ExpeditionRelationshipActorRef =
  | { kind: 'crew'; id: string }
  | { kind: 'band'; id: string }

export type ExpeditionRelationshipTier = -2 | -1 | 0 | 1 | 2

export interface ExpeditionRelationshipState {
  tier: ExpeditionRelationshipTier
  lastSourceId: string | null
}
```

Validation:

```text
Crew id -> Object.hasOwn(EXPEDITION_CREW_BY_ID, id)
Band id -> exact stable current state.band.members id
same actor -> reject
Band↔Band -> reject; existing band relationship owner remains canonical
Crew↔Crew or Band↔Crew -> allowed
```

Action:

```ts
APPLY_EXPEDITION_RELATIONSHIP_OUTCOME {
  eventId: string
  optionId: string
  first: ExpeditionRelationshipActorRef
  second: ExpeditionRelationshipActorRef
  expectedRouteStep: number
}
```

Reducer proves event/option just resolved, actors match the event definition and derives tier shift from canonical event data. Caller never submits `tierDelta` or pair key.

Required producer/consumer:

```text
producer: expedition_crew_conflict_mika_tom (includes at least one Band↔Crew option)
consumer: expedition_crew_contact_tip or burnout resolution changes option eligibility based on stored tier
```

Golden test: event changes relationship -> save/reload -> later event eligibility differs.

---

## Task 5: Keep staged Band-member injuries as active-performance consequences

```ts
export type BandInjuryStage = 'none' | 'strain' | 'light' | 'serious' | 'critical'

// ExpeditionState
memberInjuriesById: Record<string, BandInjuryStage>
```

Action intent:

```ts
ADVANCE_EXPEDITION_BAND_INJURY {
  memberId: string
  source: 'post_gig_exhaustion' | 'dangerous_event'
  sourceId: string | null
  expectedStage: BandInjuryStage
  expectedRouteStep: number
}
```

For post-gig exhaustion, deterministic run RNG/current stamina decides whether the action creator emits intent; reducer proves canonical post-Gig evidence and advances exactly one stage. Dangerous events require just-resolved event/option proof.

Post-gig risk:

```text
stamina >=35 -> no roll
20..34       -> 10%
<20          -> 25%
```

Active performance profile:

```ts
export interface ExpeditionMemberPerformanceConstraint {
  staminaDrainMultiplier: number
  timingWindowMultiplier: number
  missPenaltyMultiplier: number
  cannotPerform: boolean
}
```

```text
none     1.00 / 1.00 / 1.00 / false
strain   1.10 / 1.00 / 1.00 / false
light    1.20 / 0.97 / 1.05 / false
serious  1.35 / 0.93 / 1.10 / false
critical 1.50 / 0.90 / 1.15 / true for injured required role
```

PreGig surfaces exact warnings; hit/miss/stamina owners consume the profile. Critical blocks only if current set cannot be staffed by a legal substitute/recovery route.

---

## Task 6: Add bounded Crew injuries and persistent unavailability instead of replacing them with Stress

This closes the 2026-09-04 fidelity gap. Crew actors use a **smaller** injury model than performing Band members because their role effect, not rhythm execution, is what becomes unavailable.

```ts
export type ExpeditionCrewInjuryStage = 'none' | 'light' | 'serious'

// run state
crewInjuryById: Record<string, ExpeditionCrewInjuryStage>

// Career state
crewRecoveryDebtById: Record<string, 0 | 1>
```

Sources:

```text
dangerous travel/repair event
Authority/Contraband confrontation
Crew crisis option explicitly marked injuryRisk
```

Action:

```ts
ADVANCE_EXPEDITION_CREW_INJURY {
  crewId: string
  sourceType: 'event' | 'travel' | 'repair'
  sourceId: string
  expectedStage: ExpeditionCrewInjuryStage
  expectedRouteStep: number
}
```

Reducer proves the canonical source, uses deterministic source-bound roll stored/derivable from run seed, advances at most one stage and updates status:

```text
light   -> role contribution x0.50 for remainder of run
serious -> role contribution disabled for remainder of run; no instant run failure
```

On finalized run, serious Crew injury yields `crewRecoveryDebtById[crewId] = 1` unless G5 Between-Tour `injury_rehab` clears it. A Crew with recovery debt is unavailable for the next Tour Prep; after one skipped/recovered tour the debt settles to 0 through the canonical Between-Tour/run-settlement path.

No Crew death/permadeath is introduced.

Tests:

```text
Technician serious injury removes repair contribution but repair remains possible through other legal paths
Driver serious injury changes next travel cost through the same effective rules
serious injury -> finalized run -> Career recovery debt -> next Tour Prep unavailable
rehab choice clears debt exactly once
save/reload preserves run injury and Career debt
```

---

## Task 7: Add treatment/recovery choices for Band and Crew injury

At Rest/Supply/PreGig or relevant Between-Tour contexts:

```text
Band strain/light: rest -> one stage recovery
Band serious: treatment -> spend Expedition Cash + supplies -> one stage recovery
Band critical: treatment/route change/extract/accept failure when performance cannot proceed
Crew light: rest/supplies -> return contribution toward normal according to canonical action
Crew serious: no mid-run instant full heal; may stabilize but stays unavailable this run; persistent rehab handled Between Tours
```

All prices/resources/results are reducer-derived. UI sends only actor/source/choice intent.

Export:

```ts
getBandIncapacitationSignal(state): ExpeditionFailureSignal | null
```

It returns a signal only when required performance cannot be staffed/recovered and the player accepts failure/exhausts legal alternatives.

---

## Task 8: Settle Crew Career from finalized evidence only

No generic `UPDATE_CREW_CAREER` action exists.

```ts
export interface ExpeditionCrewCareerSettlement {
  crewId: string
  loyaltyDelta: -2 | -1 | 0 | 1 | 2
  storyProgressDelta: 0 | 1
  recoveryDebt: 0 | 1
}
```

At finalization, derive settlement from canonical run evidence:

```text
selected + low final Stress + positive relationship outcome -> Loyalty +1
selected + crisis resolved supportively               -> Loyalty +1, Story +1
abandoned/betrayed canonical Crew event               -> Loyalty -1/-2 according to event definition
serious Crew injury                                    -> recoveryDebt 1
```

Store settlement in finalized outcome snapshot.

Persistent action:

```ts
SETTLE_EXPEDITION_CREW_CAREER { runId: string }
```

Reducer requires finalized matching run, refuses already-settled run ids, loads the stored settlement and applies it once. Loyalty clamps `0..100`; story progress is non-negative integer; ids must be registry-owned.

---

## Task 9: Define six concrete signature traits and a real source-derived acquisition path

Registry:

```text
signature_field_engineer -> Technician: first field repair/run ignores hidden-defect creation
signature_stage_sense    -> Roadie: first critical Stage Gear warning gains +1 Intel detail
signature_long_haul      -> Driver: first poor-road segment/run ignores road-wear multiplier
signature_dealmaker      -> Manager: first G4 Double Down reveals exact upside and failure penalty
signature_foresight      -> Scout: one extra Recon use after route step 4
signature_crowd_control  -> Security: first Authority crisis retains comply/pay safe option when resource requirement is met
```

Eligibility:

```text
Crew loyalty >=60
storyProgress >=3
G5 Crew Lounge L1 capability owned
trait not already owned
Crew not carrying unresolved recovery debt at acquisition time
```

### Acquisition boundary

Eligibility alone is not ownership. Add:

```ts
ACQUIRE_EXPEDITION_CREW_SIGNATURE {
  runId: string
  crewId: string
  expectedTraitId: string
}
```

Allowed source is a G5 Between-Tour `crew_debrief` option `develop_signature` generated only after a finalized run that contains at least one eligible selected Crew member. Reducer:

```text
proves run is finalized and Between-Tour decision/option is canonical and unresolved
looks up Crew registry
recomputes eligibility from current Career state
recomputes exact trait id from Crew role registry
requires it equals expectedTraitId as stale guard
writes trait once
marks the decision option consumed in the same reducer transaction or through the G5 canonical decision resolver
```

Caller never supplies an arbitrary trait id that can be stored unchecked.

Required tests for all six traits:

```text
ineligible -> no acquisition
eligible + canonical decision -> exact registered trait acquired
forged trait id -> no-op
replay -> no duplicate
save/reload -> trait persists
production consumer activates exactly once as specified
```

G6 may report `signatureTraitUnlockRun` only from this production acquisition transition.

---

## Task 10: Add source-proven Contact Intel

Concrete event: `expedition_crew_contact_tip`.

Eligibility:

```text
selected Manager OR relevant bonded Band↔Crew relationship
visible reachable future node
current Intel < event option target level
```

Action:

```ts
CREATE_CONTACT_INTEL_GRANT {
  eventId: 'expedition_crew_contact_tip'
  optionId: string
  nodeId: string
  expectedRouteStep: number
}
```

Reducer proves just-resolved event/option, node entitlement and route step, derives target level and deterministic grant id, appends once. G1 later consumes the grant with `REVEAL_EXPEDITION_NODE_INTEL`.

Forged/replayed event ids or unreachable node ids are no-ops.

---

## Task 11: Register validated Crew events through the real event pipeline

Every new event uses the production schema:

```text
title
 description
 conditions with explicit (state: GameState) => annotations
 options[].label
 options[].outcomeText
 supported effect keys only
```

Register one `type:'expedition'` effect handler in the real `eventEffectHandlers.ts`; extend `EventDelta.expedition` once and route through typed Expedition actions. Do not mutate Expedition state through generic object spreads.

Required families:

```text
expedition_crew_conflict_mika_tom
expedition_crew_contact_tip
expedition_crew_burnout
expedition_crew_injury_risk
```

End-to-end tests run:

```text
validateGameEvent -> resolveEventChoice -> resolveEvent -> gameReducer
```

and prove Stress/relationship/injury/contact outcomes actually reach state.

---

## Task 12: UI and simulator handoff

`ExpeditionCrewPicker` shows role trade-offs and next-run unavailability before START. `ExpeditionCrewStatus` shows contextual Stress, relationships, current injury/unavailability and signature trait; it is not a permanent HUD resource.

G6 imports only production helpers:

```text
getEffectiveExpeditionRules
getBandMemberPerformanceConstraint
getBandIncapacitationSignal
getUnresolvedHarmonyCrisisSignal
Crew Career settlement/acquisition telemetry
```

Required focused verification:

```bash
pnpm run test:node
pnpm run test:ui
pnpm run typecheck:core
pnpm run deadcode:check
```

Expected: PASS.

---

## G3 Exit criteria

- Three Crew slots select from six concrete roles and every role changes an app mechanic.
- Stress mutations are source-bound/reducer-derived and crises are telegraphed.
- Band↔Crew and Crew↔Crew relationships have a real producer and later consumer.
- Band injuries visibly affect active gig execution.
- Crew injuries/unavailability exist as a bounded distinct mechanic; serious Crew injury can persist into next-tour availability and recovery.
- G1 failure consumes explicit incapacity/Harmony signals, never raw thresholds alone.
- Crew Career loyalty/story/recovery settles once from finalized run evidence.
- Signature traits have both eligibility and a real Between-Tour acquisition action; all six traits persist and have production consumers.
- Contact Intel is source-proven and replay-safe.
- New Crew events validate and resolve through the existing event pipeline.