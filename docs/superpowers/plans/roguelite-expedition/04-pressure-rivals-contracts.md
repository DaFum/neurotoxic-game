# Pressure, Sponsors, Contracts, Social, Rivals and Finales Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Expedition pressure layer: deterministic staged Sponsor selection, fully typed native Contracts and Double Down, Social/Crowd Hype, multi-input Pressure Director, Authority risk/opportunity, persistent Rival/Nemesis identity, Expedition quests, contextual Finales and reducer-authoritative run Drafts.

**Architecture:** Existing Brand Deals remain the Sponsor catalog/eligibility/effect source, but Tour Prep stages an offer without applying its side effects. START atomically accepts the staged Sponsor and creates the linked obligation. Native Contracts use explicit template/materialized constraint unions with a hard slot/compatibility contract. Heat/Exposure/Crowd Hype remain distinct run axes. Rival identity persists in Career and Finales adapt the existing gig lifecycle.

**Tech Stack:** TypeScript 6, React 19, current Brand Deal/social/event/rival/gig/quest systems, deterministic RNG, typed actions/reducers, Node/Vitest/Playwright.

---

## Authority and dependencies

```text
approved design spec > master plan > this child plan
G4 depends on G1A + G2 + G3
```

G1B consumes G4 Sponsor/Contract/reward/failure signals. G5 later adds Region/Tour/Fame/Meta/Legendary rules through the typed seams defined here.

---

## File structure

**Create:**

- `src/data/expedition/contracts.ts`
- `src/data/expedition/pressureEvents.ts`
- `src/data/expedition/finales.ts`
- `src/domain/expedition/sponsors.ts`
- `src/domain/expedition/contracts.ts`
- `src/domain/expedition/pressure.ts`
- `src/domain/expedition/crowdHype.ts`
- `src/domain/expedition/rivals.ts`
- `src/domain/expedition/finales.ts`
- `src/domain/expedition/runDrafts.ts`
- `src/quests/producers/expeditionQuestEvents.ts`
- `src/ui/expedition/SponsorPicker.tsx`
- `src/ui/expedition/ContractPicker.tsx`
- `src/ui/expedition/DoubleDownDialog.tsx`
- `src/ui/expedition/PressureStatus.tsx`
- `src/ui/expedition/RivalStatus.tsx`
- `tests/node/expeditionSponsors.test.js`
- `tests/node/expeditionContracts.test.js`
- `tests/node/expeditionDoubleDown.test.js`
- `tests/node/expeditionPressure.test.js`
- `tests/node/expeditionCrowdHype.test.js`
- `tests/node/expeditionRival.test.js`
- `tests/node/expeditionFinale.test.js`
- `tests/node/expeditionRunDraft.test.js`
- `tests/node/expeditionQuestEvents.test.js`

**Modify:**

- `src/types/expedition.d.ts`
- `src/types/career.d.ts`
- `src/types/actions.d.ts`
- `src/context/actionTypes.ts`
- `src/context/GameState.tsx`
- `src/context/expeditionActionCreators.ts`
- `src/context/useExpeditionDispatchActions.ts`
- `src/context/reducers/expeditionReducer.ts`
- `src/context/reducers/expeditionSanitizers.ts`
- `src/context/reducers/careerReducer.ts`
- `src/context/reducers/careerSanitizers.ts`
- `src/domain/expedition/effectiveRules.ts`
- `src/domain/eventResolver.ts`
- `src/utils/eventEngine/eventEffectHandlers.ts`
- `src/utils/brandDealLogic.ts`
- `src/hooks/postGig/handlers/useDealHandlers.ts`
- `src/data/brandDeals.ts`
- current Rival generation/selection owner
- current quest registry/producer registration
- current PreGig/START_GIG/PostGig modifier owners
- `src/hooks/postGig/handlers/useContinueHandler.ts`
- `src/hooks/useArrivalLogic.ts`
- `public/locales/en/ui.json`
- `public/locales/de/ui.json`
- `public/locales/en/events.json`
- `public/locales/de/events.json`

---

## Task 1: Keep Heat, Exposure and Crowd Hype distinct

```ts
export interface ExpeditionPressureState {
  heat: number
  exposure: number
  crowdHype: number
  severeReliefUntilRouteStep: number | null
  lastSevereEventId: string | null
  temporaryRouteOpportunity: ExpeditionTemporaryRouteOpportunity | null
}
```

Clamp all axes `0..100`.

```text
Heat       -> Authority/illegal/controversial risk + Underground opportunity
Exposure   -> visibility/Sponsor/Rival/media/expectation pressure
Crowd Hype -> contextual active-performance combo upside; never a seventh permanent HUD resource
```

Positive Heat/Exposure gains use `getEffectiveExpeditionRules(state)` multipliers exactly once. Negative deltas are unmultiplied unless a named rule says otherwise.

---

## Task 2: Stage Sponsor offers deterministically without accepting them before START

The existing `generateBrandOffers(gameState, rng)` is retained as eligibility/catalog logic, but Tour Prep must pass a deterministic seeded RNG derived from root `state.runSeed`. Never call the default `secureRandom` path for Expedition offers.

```ts
export interface ExpeditionPreparedSponsorOffer {
  offerId: string
  dealId: string
  runSeed: number
  canonicalTermsHash: string
}
```

Extend prepared Expedition state with:

```ts
preparedSponsorOffers: ExpeditionPreparedSponsorOffer[]
```

Pure helper:

```ts
buildPreparedExpeditionSponsorOffers(state): ExpeditionPreparedSponsorOffer[]
```

Rules:

```text
seed = hash(state.runSeed, 'expedition-sponsor-offers')
call existing generateBrandOffers(state, seededRng)
normalize max 3 offers
stable offerId = hash(runSeed, dealId, canonical terms)
no Money/item/Social/Quest mutation
same prepared state -> identical offers/order
```

Action:

```ts
PREPARE_EXPEDITION_SPONSOR_OFFERS { expectedRunSeed: number }
```

Reducer recomputes the pure offer snapshot from canonical state; caller does not submit generated offers.

G1 build commits `sponsorOfferId`, not an already accepted deal id.

### Extract one reusable acceptance owner

Move the effectful core of current `handleAcceptDeal` into a pure/shared resolver used by both existing post-gig UI and Expedition START:

```ts
resolveBrandDealAcceptance(state, dealId): BrandDealAcceptanceResult
```

It derives canonical:

```text
Money delta
item/band update
Social activeDeals/reputation update
Money/Fame/Brand Quest events
```

`useDealHandlers.handleAcceptDeal` calls this shared resolver and applies the result exactly as today.

At `START_EXPEDITION`, G4:

```text
1. verifies committed sponsorOfferId exists in persisted preparedSponsorOffers
2. verifies root runSeed and canonicalTermsHash still match
3. invokes resolveBrandDealAcceptance exactly once
4. applies Money/item/Social/Quest effects in the same root transaction
5. materializes one zero-native-payout linked Sponsor obligation by runId+dealId
6. clears preparedSponsorOffers after successful START
```

If START fails validation, no Sponsor effect occurs. Replaying START cannot pay/award twice.

Required tests:

```text
Tour Prep offer generation is deterministic
Tour Prep selection causes zero Money/item/Social/Quest mutation
START accepts exact staged offer and emits canonical effects once
START replay does not pay twice
stale runSeed/terms hash rejects
existing post-gig accept behavior remains unchanged
G6 uses seeded prepared offer path, never default generateBrandOffers RNG
```

---

## Task 3: Define complete native Contract template/materialized schemas

Hard limit:

```ts
export const MAX_NATIVE_EXPEDITION_CONTRACTS = 2 as const
```

Template constraints are distinct from active materialized constraints:

```ts
export type ExpeditionContractConstraintTemplate =
  | { id: string; kind: 'gig_accuracy_count'; minAccuracy: number; requiredCount: number }
  | { id: string; kind: 'max_heat'; maxHeat: number }
  | {
      id: string
      kind: 'visit_matching_node'
      routeTargetRule: {
        nodeType?: string
        subtype?: 'RIVAL_ENCOUNTER' | 'UNDERGROUND_MARKET' | 'BLACK_MARKET'
      }
    }
  | { id: string; kind: 'no_rest_before_finale' }
  | { id: string; kind: 'finale_completed'; minHeatAtFinale: number | null }
  | { id: string; kind: 'social_post_count'; requiredCount: number }
  | { id: string; kind: 'special_finale'; profileId: ExpeditionContractSpecialFinaleProfileId }

export type ExpeditionContractConstraint =
  | Exclude<ExpeditionContractConstraintTemplate, { kind: 'visit_matching_node' }>
  | { id: string; kind: 'visit_node'; targetNodeId: string }

export type ExpeditionContractSpecialFinaleProfileId = 'all_in_showcase'

export interface ExpeditionContractTemplate {
  id: string
  kind: 'performance' | 'behavior' | 'route' | 'high_risk'
  constraints: ExpeditionContractConstraintTemplate[]
  reward: { money: number; fame: number; rewardMultiplier: number }
  failure: { heat: number; controversy: number }
  tourEndingOnFailure: boolean
}
```

Initial registry is complete and numeric:

```text
contract_three_good_gigs
  constraints: accuracy >=65 for 3 gigs
  reward: €1500, +500 Fame, x1.00
  failure: +8 Heat, +3 controversy
  tourEnding false

contract_keep_it_clean
  constraints: max Heat 40
  reward: €1800, +300 Fame, x1.00
  failure: +10 Heat, +5 controversy
  tourEnding false

contract_route_target
  constraints: visit one prepared reachable matching node
  reward: €1200, +400 Fame, x1.00
  failure: +8 Heat, +3 controversy
  tourEnding false

contract_no_rest_finale
  constraints: no Rest before Finale + Finale completed
  reward: €0, +1000 Fame, x1.20
  failure: +15 Heat, +8 controversy
  tourEnding false

contract_all_in
  constraints: Finale completed with Heat >=60 + special_finale(all_in_showcase)
  reward: €2500, +800 Fame, x1.35
  failure: +30 Heat, +20 controversy
  tourEnding true
```

Compatibility rules:

```text
no duplicate template id
max 2 native Contracts
contract_keep_it_clean is incompatible with contract_all_in
only one active visit_matching_node Contract
all other initial pairings legal
```

`areExpeditionContractsCompatible(ids)` and the canonical loadout validator enforce the same rules.

`materializeContractConstraints(template, preparedMap)` deterministically replaces `visit_matching_node` with exact reachable `visit_node.targetNodeId`; if no match exists, template is not offered.

G1 stores `{templateId,targetNodeId}` and START materializes exactly that target.

Tests iterate every template through one generic evaluator and fail if evaluator branches on a concrete template id.

---

## Task 4: Make active obligations reducer-authoritative and constraint-complete

```ts
export interface ExpeditionConstraintProgress {
  constraintId: string
  value: number
  satisfied: boolean
  failed: boolean
}

export interface ExpeditionDoubleDownState {
  acceptedOfferId: string
  derivationKey: string
  addedConstraint: ExpeditionDoubleDownConstraint
  rewardMultiplier: 1.25 | 1.35
  failureHeatBonus: number
  acceptedAtRouteStep: number
}

export interface ActiveObligationState {
  id: string
  sourceType: 'native' | 'brandDeal'
  sourceId: string
  constraints: ExpeditionContractConstraint[]
  progressByConstraintId: Record<string, ExpeditionConstraintProgress>
  status: 'active' | 'completed' | 'failed'
  settled: boolean
  doubleDown: ExpeditionDoubleDownState | null
}
```

Public signal intent:

```ts
RECORD_EXPEDITION_OBLIGATION_SIGNAL {
  signalType: 'gig' | 'arrival' | 'rest' | 'heat' | 'social_post' | 'finale'
  sourceId: string | null
  expectedRouteStep: number
}
```

Payload contains no accuracy/Heat/progress/result. Reducer reads canonical just-settled state and updates every applicable constraint.

Settlement:

```ts
stackMultiplier = Math.min(1.4, 1 + Math.max(0, activeConstraintCount - 1) * 0.1)
finalRewardMultiplier =
  template.reward.rewardMultiplier
  * stackMultiplier
  * (obligation.doubleDown?.rewardMultiplier ?? 1)
  * getEffectiveExpeditionRules(state).numeric.contractRewardMultiplier
```

Only positive Contract reward is multiplied. Failure penalty uses `contractPenaltyMultiplier` once. Direct Money/Fame income emits existing Money/Fame quest events.

---

## Task 5: Persist the exact Double-Down rule

```ts
export type ExpeditionDoubleDownConstraint =
  | { kind: 'no_more_rest' }
  | { kind: 'heat_cap'; maxHeat: 60 }
  | { kind: 'finale_required' }
  | { kind: 'social_silence'; maxPosts: 0 }
```

```ts
DOUBLE_DOWN_EXPEDITION_OBLIGATION {
  obligationId: string
  offerId: string
  expectedRouteStep: number
}
```

Reducer recomputes offer from `state.runSeed + obligationId + expectedRouteStep + current constraints`, verifies id, then stores full normalized Double-Down substate. LOAD revalidates derivation. Later progress/settlement reads the stored rule; it is never re-derived from the current step.

Manager `signature_dealmaker` reveals exact upside/penalty before accept; others see qualitative tiers.

---

## Task 6: Restore Crowd Hype as the Social -> active-skill bridge

```text
push       +15 Hype, Fame, Exposure, some Heat
monetize    +5 Hype, Cash, moderate Exposure
suppress   -10 Hype, lower Heat/Exposure
weaponize  +10 Hype, requires active Rival, affects Rival pressure + Heat
```

Exact Money/Fame/Heat/Exposure results live in one Social result registry and are reducer-derived.

Major/high-profile successful Gig may add +10 Hype; poor Gig may subtract 10.

```ts
getExpeditionCrowdHypeProfile(hype).comboBonusMultiplier =
  hype >= 90 ? 1.25 :
  hype >= 70 ? 1.18 :
  hype >= 40 ? 1.10 : 1.00
```

Apply only to combo-derived bonus after successful hits. Never widen timing, raise base accuracy, prevent misses or auto-award score.

---

## Task 7: Source-prove Social Intel and strategic consequences

At least one validated Social result must influence each:

```text
Sponsor interest/eligibility
Rival behavior/event eligibility
Intel
Crowd Hype
```

```ts
CREATE_SOCIAL_INTEL_GRANT {
  postOptionId: string
  resultId: string
  nodeId: string
  expectedRouteStep: number
}
```

Reducer proves the canonical settled Social result owns the target-level rule, then creates one G1 grant. Forged/replayed results are no-ops.

---

## Task 8: Implement the full Pressure Director and anti-frustration

```ts
export interface PressureDirectorContext {
  heat: number
  exposure: number
  fameExpectationPressure: number
  cashPressure: number
  technicalConditionPressure: number
  crewStressPressure: number
  activeObligationPressure: number
  rivalPressure: number
  routeDepthPressure: number
}
```

G5 supplies `fameExpectationPressure`; before G5 it is neutral 0.

Events declare:

```ts
severity: 'normal' | 'severe'
pressureFamily: 'authority' | 'crew' | 'contract' | 'rival' | 'social' | 'technical'
```

Director:

```text
filter normal eligibility/conditions/cooldowns
derive bounded context
apply family-specific weights
apply same-id repeat protection
if severe relief active, other severe families x0.35
bypass relief only Heat >=90 or explicit G5 severeReliefBypass
sample deterministically from root runSeed-derived stream
```

A severe negative event creates relief through the next two route steps.

---

## Task 9: Add Authority safe exits and high-Heat opportunity

Authority options may include:

```text
comply/pay          -> G1 spendable Cash
Manager/Security    -> selected Crew gate
hidden compartment -> G2 chassis/module gate
surrender cargo     -> G2 manifest only
route detour        -> Fuel/vehicle cost
future obligation   -> only if Contract slot/compatibility permits
```

If no legal safe exit remains and canonical crisis threshold is reached, export source-derived `getAuthorityCrisisSignal(state)` for G1B.

At Heat >=60, `expedition_underground_invite` may create one deterministic run-scoped Underground/Black-Market route opportunity. Base map stays immutable; effective edge/subtype overlay carries the opportunity.

---

## Task 10: Persist/reactivate the same Rival identity across runs

```ts
export interface CareerRivalSnapshot {
  id: string
  name: string
  style: string
  preferredRegionId: string
  signatureBehavior: 'aggressive' | 'showboat' | 'saboteur' | 'dealbreaker'
  seed: number
}

export interface CareerRivalHistory {
  relationship: 'unknown' | 'competitive' | 'rival' | 'nemesis' | 'respect' | 'alliance'
  nemesisLevel: 0 | 1 | 2 | 3 | 4
  encounterCount: number
  lastOutcome: 'hostile_win' | 'hostile_loss' | 'respect' | 'alliance' | null
  lastSeenRunId: string | null
}

export interface CareerRivalRecord {
  snapshot: CareerRivalSnapshot
  history: CareerRivalHistory
}
```

G4 replaces G3's placeholder `career.rivalsById` type with `Record<string,CareerRivalRecord>` and sanitizer.

`selectExpeditionRivalForRun(state, preparedMap, routeProfile)`:

```text
choose eligible persistent record first
sort by nemesisLevel desc, encounterCount desc, id lexical
rehydrate state.rivalBand from stored snapshot without generateRivalBand()
only if no existing eligible record may current generator create a new Rival
snapshot new Rival once
```

Nemesis:

```text
L1 -> Rival event weight up
L2 -> Rival route node/shortcut opportunity
L3 -> Sponsor offer interference through staged Sponsor pipeline
L4 -> Rival Hunt/Finale priority + quest/Legendary interactions
```

Respect/Alliance reduce hostile weighting and permit cooperative variants.

---

## Task 11: Add Expedition quests through existing quest owners

Typed producers:

```text
createExpeditionNodeResolvedQuestEvent
createExpeditionExtractionQuestEvent
createExpeditionRivalOutcomeQuestEvent
createExpeditionFinaleQuestEvent
```

Families:

```text
quest_expedition_run_goal
quest_expedition_nemesis
quest_expedition_meta_unlock
```

Do not duplicate Money/Fame reward events.

---

## Task 12: Define mechanically executable contextual Finales

```ts
export type ExpeditionFinaleType =
  | 'regional_headliner'
  | 'corporate_showcase'
  | 'rival_battle'
  | 'illegal_show'
  | 'disaster_gig'
  | 'contract_special'

export interface ExpeditionFinaleProfile {
  timingWindowMultiplier: number
  missPenaltyMultiplier: number
  staminaDrainMultiplier: number
  comboBonusMultiplier: number
  technicalWearMultiplier: number
  crowdHypeStartBonus: number
  rewardMultiplier: number
  heatOnSuccess: number
  requiresRival: boolean
}
```

Registry:

```text
regional_headliner   timing 1.00 | miss 1.00 | stamina 1.00 | combo 1.10 | wear 1.00 | Hype +10 | reward 1.15 | Heat +0  | Rival false
corporate_showcase   timing 0.97 | miss 1.10 | stamina 1.05 | combo 1.00 | wear 1.05 | Hype +0  | reward 1.20 | Heat +0  | Rival false
rival_battle         timing 0.96 | miss 1.10 | stamina 1.05 | combo 1.20 | wear 1.00 | Hype +5  | reward 1.25 | Heat +5  | Rival true
illegal_show         timing 0.98 | miss 1.10 | stamina 1.10 | combo 1.10 | wear 1.10 | Hype +10 | reward 1.30 | Heat +12 | Rival false
disaster_gig         timing 0.94 | miss 1.15 | stamina 1.15 | combo 1.00 | wear 1.35 | Hype +0  | reward 1.25 | Heat +5  | Rival false
contract_special     timing 0.95 | miss 1.15 | stamina 1.10 | combo 1.15 | wear 1.10 | Hype +5  | reward 1.35 | Heat +8  | Rival false
```

Priority:

```text
required special_finale Contract
Nemesis L4/Rival Hunt
technical Condition aggregate <25
Heat >=75
Exposure >=60 + Sponsor obligation
otherwise regional_headliner
```

Adapter: PreGig preview -> START_GIG composed modifiers -> PostGig wear/reward/Heat -> gig reset clears Finale-only state.

---

## Task 13: Keep temporary Run Drafts reducer-authoritative

Initial traits:

```text
road_warrior      road wear x0.70
field_engineer    no hidden Field-Repair defect; minimum restore 55
crew_mediator     positive Crew Stress x0.70
backchannel       node Intel floor 1
cold_trail        Authority event weight x0.50
reckless_encore   Finale reward x1.20; voluntary extraction retention x0.85
```

```ts
OFFER_EXPEDITION_DRAFT {
  sourceType: 'major_gig' | 'rare_event' | 'rival' | 'supply' | 'crew'
  sourceKey: string
  expectedRouteStep: number
}
```

Reducer proves trigger and recomputes three candidates from root runSeed + source key + owned traits. SELECT may choose only stored candidates. Standard accepts at most two traits. Every source has at least three candidates after filtering by using a deterministic global fallback pool.

---

## Task 14: Verification

Required telemetry only after canonical transitions:

```text
Heat/Exposure/Hype deltas
Sponsor staged/accepted/rejected/replayed
Contract constraint progress/failure/settlement
Double Down accepted/violated/completed
Director family/severity/context bands
same Rival id/Nemesis level per run
Finale type/profile/result
Draft offer/choice
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

## G4 exit criteria

- Sponsor choice is deterministic and side-effect-free until START; START reuses the canonical Brand Deal acceptance semantics once.
- Native Contract template/materialized constraint types are complete, max native slots are exactly 2 and contradictory combinations are rejected.
- Every initial Contract has all required reward/failure values and no template-id evaluator branch.
- Double Down persists the actual accepted rule.
- Social has Sponsor/Rival/Intel/Crowd-Hype consequences.
- Crowd Hype rewards active execution without auto-winning.
- Pressure Director includes Heat, Exposure, Fame expectation, Cash, Condition, Crew Stress, obligations, Rival and route depth plus cross-family relief.
- High Heat can create a real Underground opportunity.
- Persistent Rival reuses the same identity across runs and Nemesis levels change real rules.
- Expedition quests use existing quest owners.
- Every Finale type has a concrete production profile.
- Run Draft offers are source-proven/reducer-generated.
