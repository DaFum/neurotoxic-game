# Pressure, Sponsors, Contracts, Social, Rivals, Quests, Finales and Drafts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn successful Expeditions into escalating opportunity and risk through Heat, Exposure, deliberate Sponsor/Contract choices, Social trade-offs, multi-input event pressure, persistent Rival/Nemesis history, Expedition quest chains, contextual finales and occasional rule-changing run drafts.

**Architecture:** Existing Brand Deals keep their current economic owner; Expedition adds obligations without duplicating Sponsor payouts. Heat/Exposure/Obligations live in Expedition run state, while the current single `rivalBand` remains the active run actor and `career` stores persistent Rival/Nemesis history. The existing event and quest pipelines remain the only content engines. Draft candidate generation is deterministic from committed run state and recomputed by the reducer; UI never submits a candidate list.

**Tech Stack:** TypeScript 6, React 19, current Social/Brand Deal/event/quest systems, deterministic RNG, typed reducers/actions, i18next, Node/Vitest/Playwright.

---

## Depends On

- G1A prepared route preview, full loadout, reward ledger and base Intel.
- G2 Condition/Cargo/chassis helpers.
- G3 Crew/Stress/relationships/Contact Intel.

## File Structure

**Create:**

- `src/types/contracts.d.ts`
- `src/data/expedition/contracts.ts`
- `src/domain/expedition/contracts.ts`
- `src/domain/expedition/pressure.ts`
- `src/domain/expedition/pressureDirector.ts`
- `src/domain/expedition/rivals.ts`
- `src/domain/expedition/finale.ts`
- `src/data/expedition/runTraits.ts`
- `src/domain/expedition/runDrafts.ts`
- `src/data/events/pressure.ts`
- `src/data/events/rival.ts`
- `src/data/quests/quest_expedition_run_goal.ts`
- `src/data/quests/quest_expedition_nemesis.ts`
- `src/data/quests/quest_expedition_meta_unlock.ts`
- `src/quests/producers/expeditionQuestEvents.ts`
- `src/ui/expedition/PressurePanel.tsx`
- `src/ui/expedition/ObligationsPanel.tsx`
- `src/ui/expedition/RunDraftModal.tsx`
- `tests/node/expeditionPressure.test.js`
- `tests/node/expeditionContracts.test.js`
- `tests/node/pressureDirector.test.js`
- `tests/node/expeditionRivals.test.js`
- `tests/node/expeditionFinale.test.js`
- `tests/node/expeditionRunDrafts.test.js`
- `tests/node/expeditionQuestProducers.test.js`
- `tests/ui/RunDraftModal.test.tsx`

**Modify:**

- `src/types/expedition.d.ts`
- `src/types/social.d.ts`
- `src/types/actions.d.ts`
- `src/context/actionTypes.ts`
- `src/context/expeditionActionCreators.ts`
- `src/context/reducers/expeditionReducer.ts`
- `src/context/reducers/expeditionSanitizers.ts`
- `src/context/careerActionCreators.ts`
- `src/context/reducers/careerReducer.ts`
- `src/context/reducers/careerSanitizers.ts`
- `src/hooks/postGig/handlers/types.ts`
- `src/hooks/postGig/handlers/useDealHandlers.ts`
- `src/hooks/postGig/handlers/useSocialPostHandler.ts`
- `src/hooks/postGig/handlers/socialPostHandlerUtils.ts`
- `src/hooks/postGig/handlers/useContinueHandler.ts`
- `src/utils/postGig/socialResolution.ts`
- `src/data/postOptions.ts`
- `src/data/brandDeals.ts`
- `src/utils/brandDealLogic.ts`
- `src/utils/eventEngine/types.ts`
- `src/utils/eventEngine/eventSelection.ts`
- `src/utils/eventEngine/eventEffectHandlers.ts`
- `src/domain/eventResolver.ts`
- `src/data/events/index.ts`
- `src/data/quests/index.ts` or the repository's current quest registry owner
- `src/utils/rivalEngine.ts`
- `src/context/reducers/rivalReducer.ts`
- `src/hooks/overworld/useRivalEscalation.ts`
- `src/hooks/useArrivalLogic.ts`
- `src/ui/expedition/ExpeditionStatusStrip.tsx`
- `src/ui/expedition/RunSummaryCard.tsx`
- `public/locales/en/ui.json`
- `public/locales/de/ui.json`
- `public/locales/en/events.json`
- `public/locales/de/events.json`

---

## Task 1: Make Sponsor selection a real Tour Prep decision through existing Brand Deal ownership

- [ ] **Step 1: Add Sponsor-offer UI to Tour Prep without reducer RNG**

Tour Prep may call existing `generateBrandOffers(...)` through the current Social/Brand Deal orchestration path. A chosen offer is accepted through the existing Brand Deal handler first, so it becomes canonical `state.social.activeDeals` before the Expedition build is committed.

The build may then store only:

```ts
sponsorDealId: string | null
```

and validation remains:

```text
null OR exact own id currently in state.social.activeDeals
```

No reducer generates a Sponsor offer and no loadout accepts a transient offer object.

- [ ] **Step 2: Add optional Expedition obligation metadata to selected real Brand Deals**

```ts
expeditionObligation?: {
  metric: 'goodGigCount' | 'maxHeat' | 'restCount' | 'socialPostCount'
  target: number
  failureHeat: number
}
```

At START, a committed active deal with this metadata materializes one deterministic zero-payout obligation id `${runId}:brand:${dealId}`. Existing Brand Deal money/fame remains the sole Sponsor economic payout owner.

- [ ] **Step 3: Test stale/replay cases**

```text
offer accepted through Brand Deal flow -> appears in activeDeals -> can be committed
transient/unaccepted offer id -> loadout invalid
active deal removed before START -> START invalid
same START/replay -> no duplicate Sponsor obligation
```

---

## Task 2: Define native Contract families with real reward/penalty semantics

```ts
export type ExpeditionContractKind =
  | 'performance'
  | 'behavior'
  | 'route'
  | 'high_risk'

export type ExpeditionContractMetric =
  | 'goodGigCount'
  | 'maxHeat'
  | 'visitedNode'
  | 'restCount'
  | 'finaleCompleted'
  | 'socialPostCount'

export interface ExpeditionContractTemplate {
  id: string
  kind: ExpeditionContractKind
  metric: ExpeditionContractMetric
  target: number
  reward: { money: number; fame: number; rewardMultiplier: number }
  failure: { heat: number; controversy: number }
  tourEndingOnFailure: boolean
  routeTargetRule?: {
    nodeType?: string
    subtype?: 'RIVAL_ENCOUNTER' | 'UNDERGROUND_MARKET' | 'BLACK_MARKET'
  }
}
```

Initial templates:

```text
contract_three_good_gigs -> performance; 3 gigs >=65 accuracy; €1500/+500 Fame; reward x1.00
contract_keep_it_clean   -> behavior; Heat never above 40; €1800/+300; x1.00
contract_route_target    -> route; visit one matching prepared-map node; €1200/+400; x1.00
contract_no_rest_finale  -> high-risk; no Rest before Finale; +1000 Fame; reward x1.20; tourEndingOnFailure false
contract_all_in          -> high-risk; complete Finale with Heat >=60; reward x1.35; tourEndingOnFailure true
```

`rewardMultiplier` is not dead data. Contract settlement uses:

```ts
const stackMultiplier = Math.min(1.4, 1 + Math.max(0, activeConstraintCount - 1) * 0.1)
const finalRewardMultiplier = template.reward.rewardMultiplier * stackMultiplier
```

Apply it to that Contract's positive reward only. G5's global rule profile may further compose a `contractRewardMultiplier`; never multiply the entire run twice.

---

## Task 3: Validate pre-tour Contract targets against the prepared route

Because G1A Tour Prep and Overworld use the same `prep.runSeed`, route contracts can bind to real reachable nodes before START.

`buildContractOffer(state, template, preparedMap)`:

```text
non-route contract -> no targetNodeId
route contract -> choose deterministic reachable future node matching routeTargetRule
no matching reachable node -> contract is not offered
```

The chosen `targetNodeId` is displayed before acceptance and stored in the validated obligation commitment; the reducer rechecks that the node exists in the same prepared map generated from the committed seed.

This removes the old contradiction where a Route Contract expected a target before the map existed.

---

## Task 4: Make obligation actions intent-only and reducer-authoritative

Active state:

```ts
export interface ActiveObligationState {
  id: string
  sourceType: 'native' | 'brandDeal'
  sourceId: string
  targetNodeId: string | null
  progress: number
  status: 'active' | 'completed' | 'failed'
  settled: boolean
  doubledDown: boolean
}
```

Public actions:

```ts
ACCEPT_EXPEDITION_OBLIGATION {
  templateId: string
  targetNodeId: string | null
  expectedRouteStep: number
}

RECORD_EXPEDITION_OBLIGATION_SIGNAL {
  signalType: 'gig' | 'arrival' | 'rest' | 'heat' | 'social_post' | 'finale'
  sourceId: string | null
  expectedRouteStep: number
}

RESOLVE_EXPEDITION_OBLIGATION {
  id: string
  expectedStatus: 'completed' | 'failed'
}
```

The signal action carries **no accuracy, Heat, node result, Finale result or materialized next obligation**. Reducer/domain helper reads the canonical just-settled source:

```text
gig        -> last canonical Gig result/accuracy for current node
arrival    -> current canonical arrived node id
rest       -> canonical Rest transition journal
heat       -> current canonical expedition.pressure.heat after pressure settlement
social_post-> canonical just-resolved post result
finale     -> finalized current Finale result
```

`sourceId` is a stale/replay proof when the owner has an id; reducer requires it to match canonical state. No payload contains money/fame/heat delta or reward multiplier.

Completed native reward applies once through canonical money/fame mutation and emits the real quest producers:

```ts
createMoneyEarnedQuestEvent({ amount, reason })
createFameGainedQuestEvent({ amount, reason })
```

Failed Contract applies its canonical Heat/controversy penalty once. If `tourEndingOnFailure:true`, G1B receives `critical_contract_breach`; ordinary Contract failure never ends the Tour automatically.

---

## Task 5: Add real mid-run Double Down

At route step >=3, an active non-terminal native Contract may receive one deterministic Double Down offer if its current state still permits success.

```ts
export interface ExpeditionDoubleDownOffer {
  id: string
  obligationId: string
  addedConstraint: 'no_more_rest' | 'heat_cap_60' | 'finale_required' | 'social_post_required'
  rewardMultiplier: 1.25 | 1.35
  failureHeatBonus: number
}
```

Action:

```ts
DOUBLE_DOWN_EXPEDITION_OBLIGATION {
  obligationId: string
  offerId: string
  expectedRouteStep: number
}
```

Reducer recomputes the deterministic eligible offer from `runSeed + obligationId + routeStep`, validates `offerId`, and stores only the chosen rule marker. UI never submits constraint/reward values.

A doubled Contract raises upside and creates a real extra restriction. Manager signature `signature_dealmaker` from G3 reveals exact failure penalty before acceptance; otherwise UI shows qualitative penalty tier.

---

## Task 6: Keep Heat and Exposure distinct and make Social strategically multi-purpose

`pressure.ts` owns clamped 0..100 Heat/Exposure and canonical positive-gain multipliers from G5 effective rules.

Gig pressure remains performance-sensitive:

```text
successful/difficult/high-profile gig -> Exposure
controversial/illegal/aggressive behavior -> Heat
```

Selected Social results must offer different strategic uses of a viral moment:

```text
push        -> Fame + Exposure; some Heat
monetize    -> Cash + moderate Exposure
suppress    -> lower Heat/Exposure; lower immediate upside
weaponize   -> requires active Rival; source-bound Rival pressure/outcome effect + Heat
```

Do not reduce Social integration to flat Heat/Exposure deltas only. At least one Social result also influences Sponsor interest, one grants Intel and one affects Rival behavior/event eligibility.

---

## Task 7: Add a reducer-proven Social Intel producer

A validated Social result can create one grant for a visible future node:

```ts
CREATE_SOCIAL_INTEL_GRANT {
  postOptionId: string
  resultId: string
  nodeId: string
  expectedRouteStep: number
}
```

Reducer verifies that the current canonical resolved Social result contains the `expeditionIntel` effect, verifies the node is future/reachable and stores deterministic grant id:

```text
${runId}:social:${postOptionId}:${resultId}:${routeStep}:${nodeId}
```

Replay or forged result ids are no-ops. G1B consumes the grant via the base Intel action.

---

## Task 8: Implement the full multi-input Pressure Director

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
  severeReliefActive: boolean
}
```

Derive bounded 0..1 pressures from canonical state:

```ts
cashPressure = clamp((1000 - getExpeditionSpendableCash(state)) / 1000, 0, 1)
technicalConditionPressure = clamp((60 - getAggregateTechnicalCondition(state)) / 60, 0, 1)
crewStressPressure = clamp((getMaxSelectedCrewStress(state) - 50) / 50, 0, 1)
obligationPressure = clamp(getActiveObligations(state).length / 3, 0, 1)
rivalPressure = clamp(getCurrentRivalNemesisLevel(state) / 4, 0, 1)
routeDepthPressure = clamp(routeStep / max(1, mapDepth - 1), 0, 1)
```

After existing eligibility/cooldowns:

```text
economy/supply    -> x (1 + .50 * cashPressure)
technical/vehicle -> x (1 + .75 * technicalConditionPressure)
crew              -> x (1 + .75 * crewStressPressure)
contract/sponsor  -> x (1 + .50 * obligationPressure)
rival             -> x (1 + .50 * rivalPressure) * G5 Rival weighting
authority/climax  -> x (1 + .25 * routeDepthPressure) * G5 Authority weighting
```

Unknown/legacy events get identity 1. Director never forces outcomes or bypasses event conditions/cooldowns.

---

## Task 9: Add cross-family severe-event anti-frustration

Expedition state adds:

```ts
severeReliefUntilRouteStep: number
```

Every new Expedition event carries:

```ts
severity?: 'normal' | 'severe'
pressureFamily?: 'economy' | 'technical' | 'crew' | 'contract' | 'rival' | 'authority' | 'media'
```

After a severe negative event resolves, reducer sets:

```ts
severeReliefUntilRouteStep = routeStep + 2
```

While active, eligible **severe** events from any other family receive weight x0.35. Same-event ordinary cooldown still applies separately.

Opt-out exists only when the player deliberately remains in explicit extreme-risk state:

```text
Heat >=90
OR G5 No Safety Net-like modifier explicitly sets severeReliefBypass true
```

Tests hold all other state constant and prove a severe Authority event temporarily lowers severe Rival/Crew/Contract event weights without removing normal events.

---

## Task 10: Add telegraphed Authority and Underground opportunity encounters

Create validated events:

```text
expedition_authority_roadblock
expedition_media_frenzy
expedition_underground_invite
```

Roadblock option families:

```text
comply/pay          -> always available when Cash is spendable
Manager/Security    -> Crew-gated safer outcome
hidden compartment -> G2 chassis/module gated
surrender cargo     -> manifest-derived eligible Contraband/rare cargo only
route detour        -> Fuel/vehicle cost
future obligation   -> when a compatible Contract slot is available
```

At least one safe exit remains when the player has the required resource. If no safe exit exists and Heat reaches 100 from this encounter, emit G1B `authority_crisis` failure signal.

The UI explains why the event occurred: Heat band, Contraband exposure, route/Pressure context.

### High Heat creates opportunity, not only punishment

`expedition_underground_invite` becomes eligible at Heat >=60. Accepting it records one run-scoped `temporaryRouteOpportunity` whose deterministic target is a currently reachable/future `SPECIAL` node. `getEffectiveNodeConnections` exposes one temporary edge/subtype conversion to `UNDERGROUND_MARKET` or `BLACK_MARKET` until used; declining leaves the route unchanged. This is consumed once and never mutates the base map.

Thus a deliberate High-Heat build can convert pressure into an Underground route opportunity with higher rare-reward potential, while Authority risk remains visible.

---

## Task 11: Persist Rival/Nemesis history and change rules across runs

Keep one `state.rivalBand` active-run actor. Persistent Career state:

```ts
export interface CareerRivalHistory {
  relationship: 'unknown' | 'competitive' | 'rival' | 'nemesis' | 'respect' | 'alliance'
  nemesisLevel: 0 | 1 | 2 | 3 | 4
  encounterCount: number
  lastOutcome: 'hostile_win' | 'hostile_loss' | 'respect' | 'alliance' | null
}
```

Use a source-bound action:

```ts
APPLY_EXPEDITION_RIVAL_OUTCOME {
  rivalId: string
  sourceType: 'rival_event' | 'rival_gig' | 'rival_finale' | 'social_weaponize'
  sourceId: string
  expectedRouteStep: number
}
```

Reducer verifies the matching canonical just-resolved source, derives `hostile_win`/`hostile_loss`/`respect`/`alliance` from that source and applies the transition. Payload never supplies relationship or Nemesis level.

Nemesis levels unlock rule changes:

```text
L1 -> increased eligible Rival-event weight
L2 -> deterministic Rival route-node insertion opportunity
L3 -> existing generateBrandOffers pipeline loses one eligible Sponsor offer through applyNemesisSponsorInterference
L4 -> Rival Hunt Finale priority + dedicated shortcut/Legendary interactions
```

Respect/Alliance decisions may reduce hostile weighting or unlock cooperative Gig variants.

---

## Task 12: Add dedicated Expedition quest paths

Use existing `src/data/quests/*`, quest registry and producer architecture. Add three concrete quest families:

### `quest_expedition_run_goal`

```text
kind: repeatable/per-run
progress sources: expedition.nodeResolved, expedition.extracted, expedition.finaleCompleted
example objective: resolve 3 meaningful nodes and extract/complete
reward: quest/milestone progress; no duplicate run reward settlement
```

### `quest_expedition_nemesis`

```text
kind: story
activation: persistent Rival reaches relationship=rival
steps: encounter -> choose response -> win/resolve Rival challenge -> Nemesis outcome
progress sources: expedition.rivalEncountered / expedition.rivalOutcome / expedition.finaleCompleted
```

### `quest_expedition_meta_unlock`

```text
kind: story/challenge
activation: G5 rank/facility requirement
objective: complete a Region/Tour/Contract achievement
reward: G5 namespaced capability/unlock-set eligibility, never raw universal stat power
```

Create `src/quests/producers/expeditionQuestEvents.ts` with typed producers:

```ts
createExpeditionNodeResolvedQuestEvent(...)
createExpeditionExtractionQuestEvent(...)
createExpeditionRivalOutcomeQuestEvent(...)
createExpeditionFinaleQuestEvent(...)
```

Existing Money/Fame quest producers remain used for economic deltas. G6 Career sequences must prove Nemesis/meta quest progression persists across runs.

---

## Task 13: Resolve contextual and Contract-defined finales

Finale families:

```ts
export type ExpeditionFinaleType =
  | 'regional_headliner'
  | 'corporate_showcase'
  | 'rival_battle'
  | 'illegal_show'
  | 'disaster_gig'
  | 'contract_special'
```

Priority is deterministic:

```text
explicit active special Contract finale requirement -> contract_special
Nemesis/Rival Hunt context -> rival_battle
aggregate technical Condition <25 -> disaster_gig
Heat >=75 -> illegal_show
Exposure >=60 + Sponsor obligation -> corporate_showcase
otherwise -> region-specific headliner
```

`getExpeditionFinaleProfile(state)` returns the exact existing-Gig modifiers/reward context. It does not generate a second finale node or score engine.

Each Finale type has a production test showing a distinct rule consequence, not only a label. Legendary rewards remain G5-owned.

---

## Task 14: Make temporary drafts reducer-authoritative

Run traits remain occasional and Standard accepts at most two.

Sources:

```ts
export type RunDraftSource = 'major_gig' | 'rare_event' | 'rival' | 'supply' | 'crew'
```

Initial traits:

```text
road_warrior      -> road wear x0.70
field_engineer    -> field repair creates no hidden defect; minimum restore 55
crew_mediator     -> positive Crew Stress gains x0.70
backchannel       -> node Intel floor 1
cold_trail        -> Authority event weight x0.50
reckless_encore   -> Finale reward x1.20; voluntary extraction retention x0.85
```

These are run-only and feed G5's single effective-rules composition path.

### Intent-only offer action

```ts
OFFER_EXPEDITION_DRAFT {
  sourceType: RunDraftSource
  sourceKey: string
  expectedRouteStep: number
}
```

The payload **does not** contain `candidateTraitIds`.

Reducer verifies:

```text
active run
no pending draft
fewer than two accepted traits
sourceKey not previously used
sourceType/sourceKey corresponds to canonical just-settled source
```

Then reducer calls the pure deterministic `buildRunDraft({runSeed, sourceType, sourceKey, ownedTraitIds})` and stores the resulting three ids. Direct dispatch cannot choose the candidate set.

Selection action contains only `traitId`; reducer accepts it only when present in the pending canonical candidate list.

High-value triggers:

```text
major/high-accuracy Gig after route step 2
rare event resolution
won Rival encounter
paid premium Supply repair/action
successful Crew development/crisis resolution
```

No draft on every Gig/travel/random event.

---

## Task 15: Build compact Pressure/Obligation/Draft UI

Main HUD keeps only Heat from Pressure. `PressurePanel` detail shows Heat + Exposure; `ObligationsPanel` shows active/completed/failed obligations and Double Down status; Draft modal is blocking only while a pending draft exists.

Obligation rows show:

```text
current condition/progress
reward upside
failure consequence tier/exact value when known by build
whether failure is Tour-ending
Double Down constraint
```

No hidden Contract rule after acceptance.

---

## Task 16: Export final G4 failure/reward/Intel signals for G1B

`getPressureFailureSignal(state)` owns:

```text
authority_crisis
critical_contract_breach
```

and returns legal rescue options based on the just-settled Authority/Contract state.

G4 adds to G1 reward proof:

```text
event_rare
contract
finale_nonlegendary
```

G4 Social Intel grants are consumed by the G1 base Intel reducer path.

Run G1B integration tests after these exports exist.

---

## Task 17: G4 verification and simulator handoff

Export production helpers for G6:

```text
buildPressureDirectorContext
getPressureEventChanceMultiplier
progressObligations
getObligationSettlement
source-bound Rival transition helper
getExpeditionFinaleProfile
buildRunDraft
getRunTraitRules (consumed only through G5 getEffectiveExpeditionRules)
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

## G4 Exit Criteria

- Sponsor choice is deliberate and flows through existing Brand Deal ownership.
- Native Route Contracts bind to real prepared-map targets before acceptance.
- Contract progress/settlement is reducer-derived from canonical source state; rewardMultiplier and stacking are actually consumed.
- Mid-run Double Down increases both constraint and upside.
- Social supports push/monetize/suppress/weaponize plus Sponsor/Rival/Intel consequences.
- Pressure Director uses Cash, Condition, Crew Stress, Obligations, Rival and route depth in addition to Heat/Exposure.
- Severe-event relief works across families, not only same-event cooldown.
- High Heat can intentionally open an Underground route opportunity rather than acting only as punishment.
- Authority events are telegraphed decision encounters with safe but costly exits where resources permit.
- Nemesis changes Sponsor/route/finale behavior and has a dedicated quest chain.
- Quests own run goals, Rival chains and meta unlock objectives in addition to Money/Fame credit.
- `contract_special` Finale exists for explicit Contract-defined finales.
- Draft candidate lists cannot be forged by direct action payloads.
