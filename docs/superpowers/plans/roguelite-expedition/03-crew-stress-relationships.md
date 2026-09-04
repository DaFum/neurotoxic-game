# Crew, Stress, Relationships and Injury Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent Career/Crew layer with six distinct Crew roles, bounded Stress, source-proven relationships, Band and Crew injuries, cross-run Crew progression and signature-trait eligibility without depending on later G5 Between-Tour producers.

**Architecture:** G3 first establishes the missing `CareerState` owner and persistence boundary, then adds Crew mechanics. Run-local Crew state lives under `GameState.expedition`; persistent loyalty/story/relationships/recovery debt/signature traits live under `GameState.career`. G5 later consumes G3 eligibility/recovery APIs for Between-Tour choices but does not own G3 state transitions required for this gate to pass.

**Tech Stack:** TypeScript 6, React 19, existing context/reducer/persistence architecture, deterministic event resolver, Node/Vitest/Playwright.

---

## Authority and dependencies

```text
approved design spec > master plan > this child plan
G3 depends only on G1A + G2
```

G4 may consume G3 effects. G5 may invoke G3 public recovery/acquisition APIs **after G3 is already green**. No G3 exit test may require a G5 decision type/action.

---

## File structure

**Create:**

- `src/types/career.d.ts`
- `src/data/expedition/crew.ts`
- `src/data/expedition/crewSignatureTraits.ts`
- `src/domain/expedition/career.ts`
- `src/domain/expedition/crew.ts`
- `src/domain/expedition/crewStress.ts`
- `src/domain/expedition/relationships.ts`
- `src/domain/expedition/injuries.ts`
- `src/data/events/crew.ts`
- `src/context/careerActionCreators.ts`
- `src/context/useCareerDispatchActions.ts`
- `src/context/reducers/careerReducer.ts`
- `src/context/reducers/careerSanitizers.ts`
- `src/ui/expedition/ExpeditionCrewPicker.tsx`
- `src/ui/expedition/ExpeditionCrewStatus.tsx`
- `tests/node/expeditionCareerState.test.js`
- `tests/node/expeditionCrew.test.js`
- `tests/node/expeditionCrewStress.test.js`
- `tests/node/expeditionRelationships.test.js`
- `tests/node/expeditionInjuries.test.js`
- `tests/node/expeditionCrewCareer.test.js`
- `tests/ui/ExpeditionCrewPicker.test.tsx`
- `tests/ui/ExpeditionCrewStatus.test.tsx`

**Modify:**

- `src/types/index.ts`
- `src/types/game.d.ts`
- `src/types/actions.d.ts`
- `src/context/actionTypes.ts`
- `src/context/initialState.ts`
- `src/context/GameState.tsx`
- `src/context/useGameDispatchActions.ts`
- `src/context/reducers/systemReducer.ts`
- `src/context/gameReducer.ts`
- `src/context/usePersistence.ts`
- `src/context/expeditionActionCreators.ts`
- `src/context/useExpeditionDispatchActions.ts`
- `src/context/reducers/expeditionReducer.ts`
- `src/context/reducers/expeditionSanitizers.ts`
- `src/domain/expedition/effectiveRules.ts`
- `src/utils/eventEngine/eventEffectHandlers.ts`
- `src/domain/eventResolver.ts`
- `src/hooks/useArrivalLogic.ts`
- `src/hooks/postGig/handlers/useContinueHandler.ts`
- active rhythm/gig hit/miss/stamina owners
- `.claude/skills/playwright-screenshot/scripts/screenshot-state-inject.js`
- `tests/node/playwright-screenshot-fixture-validation.test.js`
- `tests/node/saveSliceRoundTrip.test.js`
- `public/locales/en/ui.json`
- `public/locales/de/ui.json`
- `public/locales/en/events.json`
- `public/locales/de/events.json`

---

## Task 0: Create the persistent Career owner before any G3 mutation

G3 is the first gate that requires persistent Expedition Career state, so G3 must create it rather than pretending the files already exist.

```ts
export interface CrewCareerState {
  loyalty: number
  storyProgress: number
  signatureTraitId: string | null
  unavailableUntilCompletedRunCount: number
}

export interface CrewRecoveryDebt {
  crewId: string
  createdFromRunId: string
  severity: 'serious'
  toursRemaining: 1
}

export interface CareerState {
  crewById: Record<string, CrewCareerState>
  expeditionRelationshipByPair: Record<string, ExpeditionRelationshipTier>
  crewRecoveryDebtById: Record<string, CrewRecoveryDebt>
  settledCrewRunIds: string[]

  // G4/G5 append their own persistent fields later:
  rivalsById: Record<string, never>
  betweenTourByRunId: Record<string, never>
  tourTokens: number
  finalizedExpeditionRuns: number
  completedExpeditionRuns: number
  completedExpeditionRegionIds: string[]
  hqFacilityLevels: Record<string, number>
  ascensionUnlocked: boolean
}
```

Use safe empty/default placeholders only for fields explicitly extended by later gates; later sanitizers replace the `never` placeholders with their final typed contracts.

- [ ] **Step 1: Write failing Career-state boundary tests**

```text
GameState requires career
createInitialState returns fresh career objects/maps
screenshot BASE_STATE mirrors career
save/reload defaults missing legacy career safely
unknown/prototype keys dropped
non-finite numeric fields rejected/defaulted
useGameActions exposes named Career methods after they exist
```

- [ ] **Step 2: Wire the real boundaries**

```text
src/types/game.d.ts                -> required career: CareerState
src/context/initialState.ts        -> fresh createInitialCareerState()
src/context/usePersistence.ts      -> PERSISTED_FIELDS.career
systemReducer LOAD_GAME            -> sanitizeCareerState
GameStateProvider/dispatchValue    -> named Career actions
Playwright BASE_STATE              -> career default
saveSliceRoundTrip                 -> career round trip
```

Every action creator returns `Extract<GameAction, { type: typeof ActionTypes.X }>`. Reducers validate direct/malformed actions independently of creators.

- [ ] **Step 3: Verify foundation**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionCareerState.test.js tests/node/saveSliceRoundTrip.test.js tests/node/playwright-screenshot-fixture-validation.test.js
pnpm run typecheck:core
```

Expected: PASS before Task 1 starts.

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
  displayNameKey: string
}
```

Initial role rule contributions:

```text
Technician
  fieldRepairEfficiency +0.20
  technicalWearMultiplier x0.90

Roadie
  technicalWearMultiplier x0.92
  crewStressMultiplier x0.95

Driver
  fuelConsumptionMultiplier x0.90
  roadWearMultiplier x0.90

Manager
  contractRewardMultiplier x1.10
  exposureGainMultiplier x0.95

Scout
  enables G1 Scout passive/recon entitlement
  nodeIntelFloor remains unchanged unless a signature/perk later modifies it

Security
  authorityEventWeightMultiplier x0.85
  positive Heat gain from Authority outcomes x0.90 where the source permits mitigation
```

`getCrewRuleContribution(state)` reads only selected, currently available, non-seriously-injured Crew and feeds G2's single `getEffectiveExpeditionRules(state)` path. No production code reads a second aggregate profile.

Light Crew injury halves that Crew member's numeric contribution before composition; serious injury contributes nothing for the rest of the run.

Tests compare identical management state with/without each role and prove the named production consumer changes.

---

## Task 2: Persist selected Crew and validate availability

G1 loadout owns selected `crewIds`. G3 provides:

```ts
isCrewAvailable(state, crewId): boolean
validateExpeditionCrewSelection(state, crewIds): CrewSelectionDecision
```

Rules:

```text
maximum 3 selected Crew
unique known ids only
baseline Crew available by registry rule
set-derived Crew capabilities are resolved through G5's isExpeditionCapabilityUnlocked once G5 exists
persistent unavailableUntilCompletedRunCount / recovery debt blocks selection
no unknown/prototype ids
```

During G3-only tests, fixtures use baseline Crew only; G5 owns tests for set-gated Crew.

---

## Task 3: Add bounded Crew Stress with source-derived mutation

```ts
export interface ExpeditionCrewRunState {
  stressByCrewId: Record<string, number>
  injuryByCrewId: Record<string, 'none' | 'light' | 'serious'>
}
```

Stress is clamped `0..100`.

Public intent:

```ts
RECORD_EXPEDITION_CREW_STRESS_SOURCE {
  crewId: string
  sourceType:
    | 'travel'
    | 'poor_gig'
    | 'crew_event'
    | 'authority_event'
    | 'rest'
    | 'successful_gig'
  sourceId: string
  expectedRouteStep: number
}
```

Reducer proves the canonical just-resolved source, derives the signed base delta and applies `getEffectiveExpeditionRules(state).numeric.crewStressMultiplier` only to positive Stress gains.

Initial source values:

```text
travel             +5
poor_gig           +10
crew_event         registry-defined +8..+20
authority_event    +12
rest               -15
successful_gig     -5
```

No caller supplies Stress delta.

Stress bands:

```text
0..39   stable
40..69  tense
70..89  crisis-eligible
90..100 severe crisis/injury eligible
```

---

## Task 4: Implement Crew↔Crew and Band↔Crew relationships through typed actors

```ts
export type ExpeditionRelationshipActorRef =
  | { kind: 'crew'; id: string }
  | { kind: 'band'; id: string }

export type ExpeditionRelationshipTier = -2 | -1 | 0 | 1 | 2
```

Band ids must be validated against stable existing band-member ids from canonical state; Crew ids against `EXPEDITION_CREW_BY_ID` with `Object.hasOwn`.

```ts
RECORD_EXPEDITION_RELATIONSHIP_OUTCOME {
  first: ExpeditionRelationshipActorRef
  second: ExpeditionRelationshipActorRef
  sourceType: 'crew_event' | 'travel_event' | 'gig_result' | 'rival_event'
  sourceId: string
  expectedRouteStep: number
}
```

Reducer proves source and derives `tierDelta` from the event/result registry. It canonicalizes the pair key itself. Caller never submits pair key or delta.

Required production chain:

```text
real Crew event resolves
-> relationship transition persisted
-> save/reload
-> later Crew event condition/option changes because of tier
```

At least one initial event must exercise Band↔Crew, not only Crew↔Crew.

---

## Task 5: Add staged Band injuries that affect active performance

```ts
export type ExpeditionBandInjuryStage = 'none' | 'light' | 'serious' | 'critical'

export interface ExpeditionInjuryPerformanceProfile {
  staminaDrainMultiplier: number
  timingWindowMultiplier: number
  missPenaltyMultiplier: number
  cannotPerform: boolean
}
```

Initial bounded profile:

```text
none      stamina x1.00 | timing x1.00 | miss x1.00 | cannotPerform false
light     stamina x1.08 | timing x0.99 | miss x1.05 | false
serious   stamina x1.18 | timing x0.97 | miss x1.12 | false
critical  stamina x1.30 | timing x0.94 | miss x1.20 | true only when the injured member is required by the selected performance path
```

PreGig displays the exact injury consequence. Existing active hit/miss/stamina owners consume the profile exactly once. Skill remains decisive; injuries never directly award/fail score.

Injury advancement intent contains only canonical source evidence. Reducer derives next stage and refuses forged/replayed progression.

If critical injury blocks the required set path, PreGig exposes canonical recovery/reroute/extract/failure options instead of deadlocking.

---

## Task 6: Add Crew injury/unavailability without depending on G5 rehab

```ts
export type ExpeditionCrewInjuryStage = 'none' | 'light' | 'serious'
```

Rules:

```text
light    -> current-run role contribution x0.50
serious  -> current-run role contribution x0; creates persistent CrewRecoveryDebt at Crew Career settlement
```

G3 must provide the public recovery API that G5 can call later:

```ts
export const canResolveCrewRecoveryDebt = (
  career: CareerState,
  crewId: string
): boolean

export const resolveCrewRecoveryDebt = (
  career: CareerState,
  crewId: string,
  source: 'rehab' | 'served_unavailable_tour'
): CareerState
```

This is a pure domain helper used by the Career reducer; G3 tests it directly with canonical source fixtures. **G3 does not require `injury_rehab` or any G5 action to exist.**

A serious debt starts with `toursRemaining:1`. G5 later records either paid rehab or the fact that the Crew actually sat out one finalized Tour. The latter source decrements to zero and clears the debt. G3 owns the deterministic helper and tests both source kinds; G5 owns the UI/decision integration.

---

## Task 7: Build Crew events through the real event pipeline

Use the current validated game-event schema, including required event/option text keys and supported effect types.

Create `EXPEDITION_CREW_EVENTS` with at least:

```text
expedition_crew_conflict_mika_tom
expedition_crew_band_tension
expedition_crew_breakthrough
expedition_crew_injury_scare
```

Register `type:'expedition'` through `src/utils/eventEngine/eventEffectHandlers.ts`; do not rely on `eventResolver.ts` alone.

`EventDelta.expedition` supports only sanitized intent/result identifiers. Sensitive Stress/relationship/injury numbers are derived later from the canonical event/result registry.

End-to-end test each family through:

```text
validateGameEvent
-> resolveEventChoice
-> resolveEvent
-> gameReducer
```

---

## Task 8: Settle persistent Crew Career state once per finalized run

```ts
SETTLE_EXPEDITION_CREW_CAREER {
  runId: string
}
```

Reducer requires matching finalized G1 outcome and rejects ids in `career.settledCrewRunIds`.

For each selected Crew, derive from canonical run evidence:

```text
Loyalty
  completed +3
  extracted +2
  failed -2
  severe unresolved Crew crisis -2 additional
  clamp 0..100

Story progress
  +1 if Crew participated in a finalized run
  +1 additional if a source-owned personal Crew event resolved for them

Serious Crew injury
  create CrewRecoveryDebt(toursRemaining=1)
```

Caller supplies no loyalty/story/injury delta.

Tests cover extracted/completed/failed, replay, save/reload and direct forged run id.

---

## Task 9: Define signature traits and a G3-owned acquisition contract

Initial one-per-role registry:

```text
Technician -> signature_field_surgeon
Roadie     -> signature_load_master
Driver     -> signature_night_driver
Manager    -> signature_dealmaker
Scout      -> signature_pathfinder
Security   -> signature_cool_head
```

Eligibility:

```text
loyalty >= 60
storyProgress >= 3
Crew Lounge capability enabled by G5 when present
trait not already owned
no active Crew recovery debt
```

G3 exposes:

```ts
getEligibleCrewSignatureTrait(state, crewId): string | null
```

and the source-derived action:

```ts
ACQUIRE_EXPEDITION_CREW_SIGNATURE {
  crewId: string
  expectedTraitId: string
  sourceType: 'career_development'
  sourceId: string
}
```

For **G3 gate tests**, `sourceId` is a canonical G3 Career-development fixture token produced by `createCrewDevelopmentEligibilityProof` after a finalized Crew settlement. Reducer recomputes eligibility/trait id; `expectedTraitId` is only a stale guard.

When G5 exists, its `crew_debrief -> develop_signature` option creates the same `career_development` proof and calls this exact action. G5 owns that integration test. G3 is already green before G5.

Each signature has one concrete production consumer:

```text
field_surgeon -> field repair minimum/defect rule
load_master   -> cargo/technical setup protection
night_driver  -> travel Fuel/road-wear rule
dealmaker     -> reveals exact Double-Down upside/penalty
pathfinder    -> one bounded extra Scout Intel entitlement per run
cool_head     -> one bounded Authority/Crew-Stress mitigation rule
```

---

## Task 10: Add Contact Intel grant producer

```ts
CREATE_CONTACT_INTEL_GRANT {
  eventId: string
  optionId: string
  nodeId: string
  expectedRouteStep: number
}
```

Reducer proves the just-resolved Contact/Crew event owns the grant, target is a visible/reachable future node and current Intel is below target. It creates one deterministic G1 `ExpeditionIntelGrant` and rejects forged/replayed source evidence.

---

## Task 11: Verify G3 independently of G5

Required G3 exit scenarios:

```text
Career state defaults/persists/rehydrates safely
all six Crew roles change their named production rule
Stress sources are reducer-derived and bounded
Band↔Crew and Crew↔Crew relationship changes alter later event eligibility
Band injuries alter active performance without auto-deciding score
Crew light/serious injury alters role contribution
serious injury creates one recovery debt
pure G3 recovery helper clears debt for canonical rehab or served-unavailable-tour proof
Crew Career settlement is once-only
signature eligibility/acquisition works through G3 career-development proof
Contact Intel grant is source-proven
```

Explicitly forbidden G3 exit dependencies:

```text
RESOLVE_EXPEDITION_BETWEEN_TOUR_DECISION
BetweenTourDecisionType
injury_rehab UI
crew_debrief UI
G5 facility purchase action
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

## G5 integration handoff

G5 must later add tests for:

```text
Crew Lounge capability -> G3 signature eligibility
crew_debrief/develop_signature -> G3 career_development proof -> ACQUIRE action
injury_rehab/pay_rehab -> G3 resolveCrewRecoveryDebt(..., 'rehab')
accept_unavailability -> Crew omitted from next finalized Tour -> G3 resolveCrewRecoveryDebt(..., 'served_unavailable_tour')
```

These are G5 tests, not G3 gate requirements.

---

## G3 exit criteria

- `GameState.career` exists as a real required/persisted/sanitized/provider-wired owner before any Crew Career mutation.
- G3 depends only on G1A + G2 and can pass without G5 types/actions/UI.
- Six Crew roles have exact production consumers through the single effective-rules path.
- Crew Stress, relationships and injuries are source-derived/replay-safe.
- Band injuries affect active gameplay; Crew injuries affect Crew availability/contribution.
- Persistent recovery debt has a complete deterministic lifecycle API.
- Signature traits have G3-owned eligibility/acquisition mechanics and real production consumers; G5 only supplies one later acquisition source.
