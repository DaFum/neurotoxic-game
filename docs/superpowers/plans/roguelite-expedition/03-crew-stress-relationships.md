# Crew, Stress, Relationships and Injuries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a constrained three-slot Crew build change route information, repairs, travel, safety and Sponsor/Contract options while Stress, Band↔Crew relationships and staged injuries create persistent but understandable consequences.

**Architecture:** Static Crew identity/role data lives in `src/data/expedition/crew.ts`; run Stress/status lives in `expedition.crewRunById`; persistent loyalty/story/signature traits and Expedition relationship pairs live in `career`. Persistent Career mutations settle from canonical event/run evidence rather than arbitrary deltas supplied by UI/action callers.

**Tech Stack:** TypeScript 6, React 19, existing event engine/resolver, typed actions/reducers, current band/rhythm state, i18next, Node/Vitest/Playwright.

---

## Depends On

- G1A loadout/lifecycle and prepared run id.
- G2 repair/chassis/Condition helpers.
- G4 later consumes Crew effects for Contract/Authority/Rival logic but is not required to implement G3.

## File Structure

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
- `src/context/careerActionCreators.ts`
- `src/context/expeditionActionCreators.ts`
- `src/context/reducers/careerReducer.ts`
- `src/context/reducers/careerSanitizers.ts`
- `src/context/reducers/expeditionReducer.ts`
- `src/context/reducers/expeditionSanitizers.ts`
- `src/context/useCareerDispatchActions.ts`
- `src/context/useExpeditionDispatchActions.ts`
- `src/utils/eventEngine/eventEffectHandlers.ts`
- `src/domain/eventResolver.ts`
- `src/hooks/travel/useTravelMinigame.ts`
- `src/hooks/postGig/handlers/useContinueHandler.ts`
- `src/hooks/useArrivalLogic.ts`
- `src/hooks/travel/useVanMaintenance.ts`
- active rhythm/gig modifier owners (`useHandleHit` / `useHandleMiss` and stamina drain owner)
- `public/locales/en/ui.json`
- `public/locales/de/ui.json`
- `public/locales/en/events.json`
- `public/locales/de/events.json`

---

## Task 1: Define six Crew roles with real production consumers

- [ ] **Step 1: Create the static registry**

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

Initial actors remain:

```text
crew_mika_tech       -> technician
crew_anja_roadie     -> roadie
crew_tom_driver      -> driver
crew_leyla_manager   -> manager
crew_nico_scout      -> scout
crew_saskia_security -> security
```

- [ ] **Step 2: Fix three Crew slots**

Tour Prep validates unique known Crew ids and at most three selected actors. Baseline availability follows the existing unlock-set plan; G5 upgrades `isCrewAvailable` through the capability resolver without changing this registry.

- [ ] **Step 3: Give every role a consumer**

Use one aggregate selector:

```ts
export interface ExpeditionCrewProfile {
  fieldRepairEfficiency: number
  technicalWearMultiplier: number
  roadWearMultiplier: number
  contractRewardMultiplier: number
  heatGainMultiplier: number
  scoutIntelBonus: 0 | 1
  restRecoveryMultiplier: number
  authorityEscapeBonus: boolean
}

export const getExpeditionCrewProfile = (
  state: GameState
): ExpeditionCrewProfile
```

Consumers:

```text
Technician -> G2 field repair and Crew inspection
Roadie     -> G2 setup protection / technical wear
Driver     -> G2 travel wear/Fuel path
Manager    -> G4 Contract reward/options + Contact Intel event family
Scout      -> G1 node Intel passive/recon
Security   -> G4 Authority safe-exit options / positive Heat gain reduction
```

No role may exist only for a simulator profile.

---

## Task 2: Add contextual Stress, not a permanent six-bar HUD

- [ ] **Step 1: Define run state**

```ts
export type CrewStressStatus = 'calm' | 'strained' | 'critical' | 'breaking'

export interface ExpeditionCrewRunState {
  stress: number
  stressStatus: CrewStressStatus
  runTraitIds: string[]
}
```

`START_EXPEDITION` materializes state only for selected Crew ids.

- [ ] **Step 2: Add source-verifiable stress intent**

```ts
ADJUST_EXPEDITION_CREW_STRESS {
  crewId: string
  reason: 'travel' | 'gig' | 'rest' | 'condition' | 'commitment' | 'conflict' | 'heat_event'
  sourceId: string | null
  expectedRouteStep: number
}
```

The reducer derives the delta from reason/current canonical state plus `getEffectiveExpeditionRules(state)` once G5 exists. Callers never submit the numeric next Stress value.

`sourceId` rules:

```text
travel/rest/gig/condition -> null; reducer validates the canonical just-settled route/gig state
commitment                -> matching G4 obligation id in failed/violated canonical state
conflict/heat_event       -> matching validated G3/G4 event id + resolved option journal entry
```

Initial canonical deltas:

```text
travel completed                 -> +4, composed with chassis/Crew rule multipliers
Rest Stop arrival                -> -15
confirmed Rest in Van            -> -25
post-gig technical Condition <40 -> +10
other successful gig             -> +6
G4 violated commitment           -> +8
G3 conflict event                -> event-registry derived +10..20
G4 high-Heat Crew event          -> event-registry derived +8
```

Clamp 0..100; status thresholds are derived selectors. Replay of the same source evidence is rejected by the same one-shot journal/route-step guard that owns the triggering transition.

- [ ] **Step 3: Keep the main HUD compact**

`ExpeditionStatusStrip` does not add one bar per Crew member. Contextual Crew status opens only when at least one selected actor is `strained` or worse or when the user opens Crew detail.

---

## Task 3: Turn high Stress into recoverable Crew crises

Create validated Crew events in `src/data/events/crew.ts` using the existing event schema/effect pipeline:

```text
expedition_crew_burnout
expedition_crew_conflict
expedition_crew_contact_tip
```

A breaking actor opens a decision, never an automatic quit:

```text
pay_bonus       -> spend Expedition Cash; reduce Stress; small Loyalty gain
rest_detour     -> consume route/time opportunity; larger Stress relief
mediate         -> requires Manager or favorable Band↔Crew relationship; no Cash
push_on         -> no immediate spend; relationship/stress consequence and visible later risk
```

At least one expensive/safe option remains while resources permit. Repeated same crisis uses the existing event cooldown plus G4 severe-event relief when applicable.

---

## Task 4: Replace Crew-only pair keys with Crew↔Crew and Band↔Crew relationships

- [ ] **Step 1: Define actor refs**

```ts
export type ExpeditionRelationshipActorRef =
  | { kind: 'crew'; id: string }
  | { kind: 'band'; id: string }

export type CrewRelationshipTier = 'hostile' | 'tense' | 'neutral' | 'bonded'
```

Persistent state:

```ts
career.expeditionRelationshipByPair: Record<string, CrewRelationshipTier>
```

Key builder:

```ts
export const toExpeditionRelationshipKey = (
  a: ExpeditionRelationshipActorRef,
  b: ExpeditionRelationshipActorRef
): string =>
  [`${a.kind}:${a.id}`, `${b.kind}:${b.id}`].sort().join('::')
```

- [ ] **Step 2: Use source-bound relationship intent**

Do **not** expose a generic public action that accepts arbitrary actor refs plus a tier delta. Event resolution emits:

```ts
APPLY_EXPEDITION_RELATIONSHIP_OUTCOME {
  eventId: string
  optionId: string
  firstActor: ExpeditionRelationshipActorRef
  secondActor: ExpeditionRelationshipActorRef
  expectedRouteStep: number
}
```

Reducer verifies the event/option exists in the validated Crew event registry, that the pair is eligible for that option, and derives the tier shift from the canonical option definition.

Validation:

```text
Crew id -> own key in EXPEDITION_CREW_BY_ID
Band id -> stable current state.band.members id
same actor -> reject
Band↔Band -> reject; existing band relationship system remains owner
Crew↔Crew / Band↔Crew -> allowed
```

- [ ] **Step 3: Prove producer and consumer**

`expedition_crew_conflict` must contain a Band↔Crew option that changes the tier. A later `expedition_crew_contact_tip`/burnout option must read that tier to unlock/disable a resolution. Save/reload preserves it.

---

## Task 5: Add staged Band-member injuries

- [ ] **Step 1: Define one injury owner**

```ts
export type InjuryStage = 'none' | 'strain' | 'light' | 'serious' | 'critical'

// ExpeditionState
memberInjuriesById: Record<string, InjuryStage>
```

The Crew actors themselves do not need a second injury ladder in v1; Crew Stress/crises cover Crew risk. Band-member injuries drive active performance and `band_incapacitated` failure.

- [ ] **Step 2: Derive injury chance outside reducer, derive stage inside reducer**

Action intent:

```ts
ADVANCE_EXPEDITION_INJURY {
  memberId: string
  source: 'post_gig_exhaustion' | 'dangerous_event'
  sourceId: string | null
  expectedStage: InjuryStage
  expectedRouteStep: number
}
```

For post-gig exhaustion, the action creator uses deterministic run RNG and current stamina to decide whether an intent exists; the reducer validates current stage and canonical post-Gig evidence. For dangerous events, `sourceId` must match the validated event/option resolution. Reducer advances exactly one step. No payload carries `nextStage`.

Risk bands:

```text
stamina >=35 -> no post-gig injury roll
20..34       -> 10%
<20          -> 25%
```

A single event cannot skip stages.

---

## Task 6: Make injury change active gameplay, visibly

Add:

```ts
export interface ExpeditionMemberPerformanceConstraint {
  staminaDrainMultiplier: number
  timingWindowMultiplier: number
  missPenaltyMultiplier: number
  cannotPerform: boolean
}
```

Initial semantics:

```text
none:     1.00 / 1.00 / 1.00 / false
strain:   1.10 / 1.00 / 1.00 / false
light:    1.20 / 0.97 / 1.05 / false
serious:  1.35 / 0.93 / 1.10 / false
critical: 1.50 / 0.90 / 1.15 / true for the injured member's required performance role
```

PreGig surfaces the exact semantic warning before Start. Critical injury blocks Start only when the current required set cannot be performed by any legal available member/substitute; the same screen then exposes Rest/treatment/route-change/extract/failure choices rather than silently ending the run.

Wire the multipliers through the existing stamina/hit/miss ownership seams, not a parallel score engine.

G6 later branches identical management snapshots with different performance outcomes and verifies skilled play can reduce downstream injury/resource burden.

---

## Task 7: Add treatment and injury recovery choices

At Rest Stop / supported Supply/PreGig contexts:

```text
rest            -> one stage recovery for strain/light; route opportunity cost
treatment       -> spend Expedition Cash + supplies; one stage recovery up to serious
risk_acceptance -> continue with visible modifier if not critical-blocking
critical rehab  -> G5 Between-Tour persistent consequence; not an instant random permadeath
```

No random permanent Crew/Band death is introduced.

---

## Task 8: Replace forgeable generic Crew Career mutation with run-source settlement

The old generic Career payload that lets callers submit loyalty/story/trait deltas is forbidden.

- [ ] **Step 1: Add finalized Crew settlement draft**

When the run finalizes, G3 derives:

```ts
export interface ExpeditionCrewCareerSettlement {
  crewId: string
  loyaltyDelta: -2 | -1 | 0 | 1 | 2
  storyProgressDelta: 0 | 1
  seriousConsequence: 'none' | 'unavailable_next_tour'
}
```

The draft is derived from canonical run events/relationship/stress outcome and stored inside the finalized Expedition outcome snapshot. Callers do not provide deltas.

- [ ] **Step 2: Add one persistent settlement action**

```ts
SETTLE_EXPEDITION_CREW_CAREER { runId: string }
```

Reducer requires finalized outcome with matching `runId`, rejects already settled run ids and applies only the stored canonical settlement once.

Persistent Career state uses safe known Crew ids and clamps Loyalty 0..100.

---

## Task 9: Define concrete signature traits and eligibility

Create `EXPEDITION_CREW_SIGNATURE_TRAITS`:

```text
signature_field_engineer -> Technician: one field repair per run ignores hidden-defect creation
signature_stage_sense    -> Roadie: first critical Stage Gear warning gains +1 Intel detail
signature_long_haul      -> Driver: first poor-road segment per run ignores road-wear multiplier
signature_dealmaker      -> Manager: first G4 Double Down reveals both upside and exact failure penalty
signature_foresight      -> Scout: one extra Recon use after route step 4
signature_crowd_control  -> Security: first Authority crisis always retains the comply/pay safe option
```

Eligibility is derived, not caller-selected:

```text
Crew loyalty >=60
storyProgress >=3
Crew Lounge capability from G5
trait not already owned
```

G5's Crew Lounge and unlock-set plan must make this progression available immediately; no facility may sell a “future” capability.

---

## Task 10: Add a reducer-proven Contact Intel producer

`expedition_crew_contact_tip` may create one Contact Intel grant for a visible future node when:

```text
selected Manager OR bonded relevant Band↔Crew relationship
node is reachable future content
current Intel < target level
```

Event option definition owns target level and relationship requirements. The event resolver emits:

```ts
CREATE_CONTACT_INTEL_GRANT {
  eventId: 'expedition_crew_contact_tip'
  optionId: string
  nodeId: string
  expectedRouteStep: number
}
```

Reducer validates current event/option eligibility and stores one `ExpeditionIntelGrant` with deterministic id `${runId}:contact:${eventId}:${routeStep}:${nodeId}`. Replay is a no-op. G1B consumes it through `REVEAL_EXPEDITION_NODE_INTEL`.

---

## Task 11: Validate the full Crew event pipeline

Every G3 event must pass the repository's `validateGameEvent`/event registry tests and the single existing event effect/resolution pipeline. Do not introduce a second “Expedition event engine”.

Add end-to-end tests:

```text
selected Crew -> event eligible
choose option -> Stress/relationship/contact intent derived
root reducers apply canonical changes once
save/reload -> persistent relationship/Career state survives
legacy non-Expedition event semantics unchanged
```

---

## Task 12: UI and simulator handoff

Crew UI shows:

```text
role
trait/vice text
semantic Stress
current injury only when relevant
Loyalty/relationship detail
signature trait when unlocked
```

No six new permanent HUD bars.

Export production helpers for G6:

```text
getExpeditionCrewProfile
getCrewStressStatus
getExpeditionRelationshipTier
getExpeditionMemberPerformanceConstraint
getCrewFailureSignal
```

`getCrewFailureSignal` returns:

```text
band_incapacitated -> every required performing member is critical/unavailable OR every member stamina <=0
crew_collapse      -> selected Crew exists, every selected actor is breaking, and no Rest/mediation/payment rescue is legal
harmony_collapse   -> harmony ==1 AND a validated G3 crisis has explicit unresolved-collapse marker
```

Run:

```bash
pnpm run test:node
pnpm run test:ui
pnpm run test:additional
pnpm run typecheck:core
pnpm run deadcode:check
```

Expected: PASS.

---

## G3 Exit Criteria

- Exactly three Crew slots force role trade-offs.
- Every Crew role has a production consumer.
- Stress is contextual and event-producing, not just a passive debuff.
- Stress/injury event effects are source-verifiable and cannot be forged by caller-supplied deltas.
- Band↔Crew relationships have both a real producer and a later event consumer.
- Injuries escalate one stage at a time and materially affect active performance.
- Critical injury produces a visible response decision rather than opaque instant failure.
- Persistent Crew Career changes settle exactly once from finalized run evidence; arbitrary deltas/trait ids are not public inputs.
- Signature traits are concrete rule changes and immediately reachable through G5 Crew Lounge progression.
- Contact Intel is source-proven and replay-safe.
