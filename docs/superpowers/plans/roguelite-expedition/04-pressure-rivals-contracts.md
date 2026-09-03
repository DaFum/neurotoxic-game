# Pressure, Rivals, Contracts, Social, and Contextual Finales Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make successful Expedition runs create escalating strategic pressure through Heat, Exposure, voluntary Obligations, persistent rival history, sponsor-linked contracts, Social choices, and context-sensitive finales while preserving the current event, Brand Deal, and rival ownership boundaries.

**Architecture:** `expedition.pressure` continues to own Heat/Exposure and `expedition.activeObligations` owns run contracts. New contract templates and pressure helpers are pure domain/data modules. Existing Brand Deals retain their current upfront/per-gig payouts; accepting a deal may attach a zero-payout obligation that evaluates behavior but never duplicates economic settlement. The existing event selection engine receives a deterministic pressure multiplier based on explicit `pressureTags`, and the existing single active `rivalBand` remains the current-run actor while `career.rivalHistoryById` records persistent rivalry.

**Tech Stack:** TypeScript 6, React 19, existing event engine and post-gig social/deal flow, current RivalBand reducer/hooks, typed reducers/action creators, i18next, deterministic RNG, Node/Vitest tests, balance simulator.

---

## Depends On

- G2 Condition/Cargo merged.
- G3 Crew/Stress/Relationships merged.
- EventDelta Expedition branch exists.
- `career.rivalHistoryById` persists safely.

## File Structure

**Create:**

- `src/types/contracts.d.ts`
- `src/data/expedition/contracts.ts`
- `src/domain/expedition/pressure.ts`
- `src/domain/expedition/contracts.ts`
- `src/domain/expedition/pressureDirector.ts`
- `src/domain/expedition/rivals.ts`
- `src/domain/expedition/finale.ts`
- `src/data/expedition/runTraits.ts`
- `src/domain/expedition/runDrafts.ts`
- `src/data/events/pressure.ts`
- `src/data/events/rival.ts`
- `src/ui/expedition/PressurePanel.tsx`
- `src/ui/expedition/ObligationsPanel.tsx`
- `src/ui/expedition/RivalEncounterCard.tsx`
- `src/ui/expedition/RunDraftModal.tsx`
- `tests/node/expeditionPressure.test.js`
- `tests/node/expeditionContracts.test.js`
- `tests/node/pressureDirector.test.js`
- `tests/node/expeditionRivals.test.js`
- `tests/node/expeditionFinale.test.js`
- `tests/node/expeditionRunDrafts.test.js`
- `tests/ui/ExpeditionPressurePanel.test.tsx`
- `tests/ui/ExpeditionObligations.test.tsx`
- `tests/ui/RunDraftModal.test.tsx`

**Modify:**

- `src/types/index.ts`
- `src/types/expedition.d.ts`
- `src/types/social.d.ts`
- `src/utils/eventEngine/types.ts`
- `src/utils/eventEngine/eventSelection.ts`
- `src/context/actionTypes.ts`
- `src/types/actions.d.ts`
- `src/context/expeditionActionCreators.ts`
- `src/context/careerActionCreators.ts`
- `src/context/reducers/expeditionReducer.ts`
- `src/context/reducers/careerReducer.ts`
- `src/context/reducers/expeditionSanitizers.ts`
- `src/context/reducers/careerSanitizers.ts`
- `src/context/useExpeditionDispatchActions.ts`
- `src/context/useCareerDispatchActions.ts`
- `src/utils/rivalEngine.ts`
- `src/context/reducers/rivalReducer.ts`
- `src/hooks/overworld/useRivalEscalation.ts`
- `src/hooks/postGig/handlers/types.ts`
- `src/hooks/postGig/handlers/useDealHandlers.ts`
- `src/hooks/postGig/handlers/socialPostHandlerUtils.ts`
- `src/hooks/postGig/handlers/useSocialPostHandler.ts`
- `src/hooks/postGig/handlers/useContinueHandler.ts`
- `src/utils/postGig/socialResolution.ts`
- `src/data/postOptions.ts`
- `src/data/events/index.ts`
- `src/hooks/useArrivalLogic.ts`
- `src/ui/expedition/ExpeditionStatusStrip.tsx`
- `src/ui/expedition/RunSummaryCard.tsx`
- `public/locales/en/ui.json`
- `public/locales/de/ui.json`
- `public/locales/en/events.json`
- `public/locales/de/events.json`
- `scripts/game-balance-simulation.mjs`
- balance source fingerprint list
- relevant social/rival/event/post-gig tests

---

### Task 1: Define Heat and Exposure Semantics and Typed Pressure Actions

**Files:**
- Create: `src/domain/expedition/pressure.ts`
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/context/expeditionActionCreators.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Test: `tests/node/expeditionPressure.test.js`

- [ ] **Step 1: Write failing pressure tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getHeatBand,
  getExposureBand,
  applyPressureDelta
} from '../../src/domain/expedition/pressure.ts'

test('heat bands match the approved pressure model', () => {
  assert.equal(getHeatBand(0), 'low_profile')
  assert.equal(getHeatBand(25), 'noticed')
  assert.equal(getHeatBand(50), 'wanted_attention')
  assert.equal(getHeatBand(75), 'critical')
  assert.equal(getHeatBand(100), 'crisis')
})

test('pressure clamps independently to zero through one hundred', () => {
  assert.deepEqual(
    applyPressureDelta({ heat: 95, exposure: 4 }, { heat: 20, exposure: -9 }),
    { heat: 100, exposure: 0 }
  )
})
```

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionPressure.test.js
```

Expected: FAIL because pressure domain is missing.

- [ ] **Step 3: Implement exact helpers**

```ts
export type HeatBand =
  | 'low_profile'
  | 'noticed'
  | 'wanted_attention'
  | 'critical'
  | 'crisis'

export type ExposureBand = 'local' | 'regional' | 'national' | 'headline'

const clampPressure = (value: number): number => Math.max(0, Math.min(100, value))

export const getHeatBand = (heat: number): HeatBand => {
  if (heat >= 100) return 'crisis'
  if (heat >= 75) return 'critical'
  if (heat >= 50) return 'wanted_attention'
  if (heat >= 25) return 'noticed'
  return 'low_profile'
}

export const getExposureBand = (exposure: number): ExposureBand => {
  if (exposure >= 75) return 'headline'
  if (exposure >= 50) return 'national'
  if (exposure >= 25) return 'regional'
  return 'local'
}

export const applyPressureDelta = (
  current: { heat: number; exposure: number },
  delta: { heat: number; exposure: number }
): { heat: number; exposure: number } => ({
  heat: clampPressure(current.heat + delta.heat),
  exposure: clampPressure(current.exposure + delta.exposure)
})
```

- [ ] **Step 4: Add `APPLY_EXPEDITION_PRESSURE`**

```ts
export interface ApplyExpeditionPressurePayload {
  heat: number
  exposure: number
  reason: 'gig' | 'social' | 'event' | 'contract' | 'rival' | 'authority'
}
```

Action creator accepts only finite deltas in `-100..100`. Reducer applies only during active Expedition and clamps through `applyPressureDelta`.

- [ ] **Step 5: Run action/reducer tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionPressure.test.js tests/node/expeditionReducer.test.js tests/node/actionCreatorSerialization.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/expedition/pressure.ts src/context/actionTypes.ts src/types/actions.d.ts src/context/expeditionActionCreators.ts src/context/reducers/expeditionReducer.ts tests/node/expeditionPressure.test.js tests/node/expeditionReducer.test.js
git commit -m "feat(expedition): add heat and exposure pressure"
```

---

### Task 2: Derive Gig-Driven Exposure and Heat Without Replacing Controversy

**Files:**
- Modify: `src/domain/expedition/pressure.ts`
- Modify: `src/hooks/postGig/handlers/useContinueHandler.ts`
- Test: `tests/ui/postGigHandlerLogic.test.jsx`

- [ ] **Step 1: Add failing calculation tests**

```js
test('successful difficult gigs raise exposure', () => {
  assert.deepEqual(
    calculateGigPressureDelta({ difficulty: 4, accuracy: 82, controversy: 10 }),
    { heat: 0, exposure: 8 }
  )
})

test('controversial poor gigs can raise heat without increasing exposure much', () => {
  assert.deepEqual(
    calculateGigPressureDelta({ difficulty: 3, accuracy: 45, controversy: 70 }),
    { heat: 4, exposure: 1 }
  )
})
```

- [ ] **Step 2: Implement exact initial formula**

```ts
export const calculateGigPressureDelta = ({
  difficulty,
  accuracy,
  controversy
}: {
  difficulty: number
  accuracy: number
  controversy: number
}): { heat: number; exposure: number } => {
  const diff = Math.max(1, Math.min(5, Math.trunc(difficulty)))
  const exposure = Math.max(0, diff + (accuracy >= 70 ? 4 : accuracy >= 50 ? 2 : -2))
  const heat = controversy >= 60 ? (accuracy < 50 ? 4 : 2) : controversy >= 40 ? 1 : 0
  return { heat, exposure }
}
```

- [ ] **Step 3: Dispatch inside the existing continuation guard**

After the canonical gig result exists:

```ts
applyExpeditionPressure({
  ...calculateGigPressureDelta({
    difficulty: finiteNumberOr(currentGig?.diff, 1),
    accuracy: finiteNumberOr(lastGigStats?.accuracy, 0),
    controversy: finiteNumberOr(social.controversyLevel, 0)
  }),
  reason: 'gig'
})
```

Do not write to `social.controversyLevel`; Heat and controversy remain distinct.

- [ ] **Step 4: Run post-gig tests**

```bash
pnpm exec vitest run tests/ui/postGigHandlerLogic.test.jsx
pnpm run typecheck:core
```

Expected: PASS; pressure applies once.

- [ ] **Step 5: Commit**

```bash
git add src/domain/expedition/pressure.ts src/hooks/postGig/handlers/useContinueHandler.ts tests/ui/postGigHandlerLogic.test.jsx
git commit -m "feat(expedition): raise pressure from gigs"
```

---

### Task 3: Define Obligation Templates and Runtime Contract State

**Files:**
- Create: `src/types/contracts.d.ts`
- Create: `src/data/expedition/contracts.ts`
- Create: `src/domain/expedition/contracts.ts`
- Modify: `src/types/index.ts`
- Modify: `src/types/expedition.d.ts`
- Test: `tests/node/expeditionContracts.test.js`

- [ ] **Step 1: Write failing template tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  EXPEDITION_CONTRACTS,
  EXPEDITION_CONTRACT_BY_ID
} from '../../src/data/expedition/contracts.ts'

test('initial native contracts cover performance, behavior, route and high-risk families', () => {
  assert.deepEqual(
    EXPEDITION_CONTRACTS.map(c => c.kind),
    ['performance', 'behavior', 'route', 'high_risk']
  )
  assert.ok(EXPEDITION_CONTRACT_BY_ID.contract_three_good_gigs)
})
```

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionContracts.test.js
```

Expected: FAIL because contracts are missing.

- [ ] **Step 3: Add exact contract type**

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

export interface ExpeditionContractTemplate {
  id: string
  kind: ExpeditionContractKind
  titleKey: string
  descriptionKey: string
  metric: ExpeditionContractMetric
  target: number
  reward: { money: number; fame: number; rewardMultiplier: number }
  failure: { heat: number; controversy: number }
}
```

- [ ] **Step 4: Add exact initial templates**

```ts
export const EXPEDITION_CONTRACTS = Object.freeze([
  {
    id: 'contract_three_good_gigs',
    kind: 'performance',
    titleKey: 'ui:expedition.contracts.threeGoodGigs.title',
    descriptionKey: 'ui:expedition.contracts.threeGoodGigs.description',
    metric: 'goodGigCount',
    target: 3,
    reward: { money: 1500, fame: 500, rewardMultiplier: 1 },
    failure: { heat: 0, controversy: 3 }
  },
  {
    id: 'contract_keep_it_clean',
    kind: 'behavior',
    titleKey: 'ui:expedition.contracts.keepItClean.title',
    descriptionKey: 'ui:expedition.contracts.keepItClean.description',
    metric: 'maxHeat',
    target: 40,
    reward: { money: 1800, fame: 300, rewardMultiplier: 1 },
    failure: { heat: 5, controversy: 5 }
  },
  {
    id: 'contract_route_target',
    kind: 'route',
    titleKey: 'ui:expedition.contracts.routeTarget.title',
    descriptionKey: 'ui:expedition.contracts.routeTarget.description',
    metric: 'visitedNode',
    target: 1,
    reward: { money: 1200, fame: 400, rewardMultiplier: 1 },
    failure: { heat: 0, controversy: 2 }
  },
  {
    id: 'contract_no_rest_finale',
    kind: 'high_risk',
    titleKey: 'ui:expedition.contracts.noRestFinale.title',
    descriptionKey: 'ui:expedition.contracts.noRestFinale.description',
    metric: 'restCount',
    target: 0,
    reward: { money: 0, fame: 1000, rewardMultiplier: 1.2 },
    failure: { heat: 3, controversy: 4 }
  }
] as const satisfies readonly ExpeditionContractTemplate[])
```

Route contract runtime state must also carry `targetNodeId: string | null`; the action creator chooses a reachable future node from the already-generated map. Never offer a route contract without a concrete reachable target.

- [ ] **Step 5: Add pure evaluators**

Public contract:

```ts
export const createObligationFromTemplate = (
  template: ExpeditionContractTemplate,
  targetNodeId: string | null
): ActiveObligationState

export const recordObligationGig = (
  obligation: ActiveObligationState,
  accuracy: number
): ActiveObligationState

export const recordObligationArrival = (
  obligation: ActiveObligationState,
  nodeId: string
): ActiveObligationState

export const evaluateObligationAtFinale = (
  obligation: ActiveObligationState,
  context: { heat: number; restCount: number; finaleCompleted: boolean }
): ActiveObligationState
```

`goodGigCount` increments only at accuracy `>=65`. `maxHeat` fails immediately if Heat exceeds target. `visitedNode` completes on exact target id. `restCount` fails if count becomes `>0`.

- [ ] **Step 6: Run contract tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionContracts.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/types/contracts.d.ts src/types/index.ts src/types/expedition.d.ts src/data/expedition/contracts.ts src/domain/expedition/contracts.ts tests/node/expeditionContracts.test.js
git commit -m "feat(expedition): define run obligations"
```

---

### Task 4: Add Accept/Progress/Resolve Obligation Actions With Idempotent Rewards

**Files:**
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/context/expeditionActionCreators.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Modify: `src/context/useExpeditionDispatchActions.ts`
- Test: `tests/node/expeditionReducer.test.js`
- Test: `tests/node/expeditionContracts.test.js`

- [ ] **Step 1: Add failing idempotence tests**

Assert idempotence and canonical reward ownership with concrete reducer calls:

```js
const accepted = gameReducer(active, createAcceptExpeditionObligationAction(active, 'contract_three_good_gigs'))
const acceptedReplay = gameReducer(accepted, createAcceptExpeditionObligationAction(accepted, 'contract_three_good_gigs'))
assert.equal(accepted.expedition.activeObligations.length, 1)
assert.deepEqual(acceptedReplay.expedition.activeObligations, accepted.expedition.activeObligations)

const completed = withObligationStatus(accepted, 'contract_three_good_gigs', 'completed')
const paid = gameReducer(completed, createResolveExpeditionObligationAction(completed, 'contract_three_good_gigs'))
const replay = gameReducer(paid, createResolveExpeditionObligationAction(paid, 'contract_three_good_gigs'))
assert.equal(paid.player.money - completed.player.money, 1500)
assert.equal(replay.player.money, paid.player.money)
assert.equal(replay.expedition.activeObligations[0].settled, true)
```

Add a failed-obligation case asserting no positive money/fame delta and an action-creator hostile-input case asserting non-finite reward values are never caller-controlled.

- [ ] **Step 2: Add exact actions**

```ts
ACCEPT_EXPEDITION_OBLIGATION
UPDATE_EXPEDITION_OBLIGATION
RESOLVE_EXPEDITION_OBLIGATION
```

Payloads:

```ts
export interface AcceptExpeditionObligationPayload {
  obligation: ActiveObligationState
}

export interface UpdateExpeditionObligationPayload {
  id: string
  expectedStatus: ObligationStatus
  next: ActiveObligationState
}

export interface ResolveExpeditionObligationPayload {
  id: string
  expectedStatus: 'completed' | 'failed'
  moneyDelta: number
  fameDelta: number
  heatDelta: number
  controversyDelta: number
}
```

`createResolveExpeditionObligationAction(state,id)` derives deltas from the canonical template or linked Brand Deal metadata; UI cannot supply reward amounts.

- [ ] **Step 3: Reducer settles canonical resources once**

Completed native obligation:

```ts
player.money += moneyDelta
player.fame += fameDelta
```

Failure:

```ts
expedition.pressure.heat += heatDelta
social.controversyLevel += controversyDelta
```

Mark obligation with a new terminal flag `settled: true`; sanitizer defaults it to false for old saves. A settled obligation cannot be processed again.

- [ ] **Step 4: Run reducer/security tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionReducer.test.js tests/node/expeditionContracts.test.js tests/node/actionCreatorSerialization.test.js
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/context src/types/actions.d.ts src/types/expedition.d.ts src/domain/expedition/contracts.ts tests/node/expeditionReducer.test.js tests/node/expeditionContracts.test.js
git commit -m "feat(expedition): settle run obligations safely"
```

---

### Task 5: Progress Obligations From Existing Gig, Arrival, Rest, and Finale Seams

**Files:**
- Modify: `src/hooks/postGig/handlers/useContinueHandler.ts`
- Modify: `src/hooks/useArrivalLogic.ts`
- Modify: `src/hooks/travel/useVanMaintenance.ts`
- Modify: `src/domain/expedition/contracts.ts`
- Test: `tests/ui/postGigHandlerLogic.test.jsx`
- Test: `tests/ui/useArrivalLogic.test.jsx`
- relevant rest tests

- [ ] **Step 1: Add failing integration tests**

Assert exactly one progress dispatch at each accepted seam:

```jsx
const updateObligation = vi.fn()
await continuePostGig({ accuracy: 70, updateObligation })
expect(updateObligation).toHaveBeenCalledTimes(1)
expect(updateObligation.mock.calls[0][0].next.progress).toBe(1)

updateObligation.mockClear()
await handleArrival({ nodeId: 'node_4_1', targetNodeId: 'node_4_1', updateObligation })
expect(updateObligation.mock.calls[0][0].next.status).toBe('completed')

updateObligation.mockClear()
await handleRestInVan({ updateObligation })
expect(updateObligation.mock.calls[0][0].next.status).toBe('failed')
```

Add corresponding Heat-threshold and Finale cases; replay the same callback once and assert the existing one-shot guard keeps each update at one dispatch.

- [ ] **Step 2: Verify failures**

```bash
pnpm exec vitest run tests/ui/postGigHandlerLogic.test.jsx tests/ui/useArrivalLogic.test.jsx
```

Expected: new obligation assertions FAIL.

- [ ] **Step 3: Add one orchestration helper**

```ts
export const progressObligations = (
  obligations: readonly ActiveObligationState[],
  signal:
    | { type: 'gig'; accuracy: number }
    | { type: 'arrival'; nodeId: string }
    | { type: 'rest' }
    | { type: 'heat'; heat: number }
    | { type: 'finale'; heat: number; finaleCompleted: boolean }
): ActiveObligationState[]
```

The helper returns updated records; caller dispatches only records that changed.

- [ ] **Step 4: Integrate only inside existing replay guards**

Do not add a global watcher. Inside each existing one-shot seam, derive changed records and dispatch only those:

```ts
const nextObligations = progressObligations(state.expedition.activeObligations, signal)
for (let i = 0; i < nextObligations.length; i += 1) {
  const previous = state.expedition.activeObligations[i]
  const next = nextObligations[i]
  if (previous && next && next !== previous) updateExpeditionObligation(previous, next)
}
```

Settlement stays in the same guarded completion flow, so React re-renders cannot advance progress twice.

- [ ] **Step 5: Run integration tests**

```bash
pnpm run test:ui
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/hooks src/domain/expedition/contracts.ts tests
git commit -m "feat(expedition): progress obligations from tour actions"
```

---

### Task 6: Link Accepted Brand Deals to Obligations Without Duplicating Payouts

**Files:**
- Modify: `src/hooks/postGig/handlers/types.ts`
- Modify: `src/hooks/postGig/handlers/useDealHandlers.ts`
- Modify: `src/domain/expedition/contracts.ts`
- Modify: `src/types/social.d.ts`
- Test: `tests/ui/useDealHandlers.test.jsx`
- Test: `tests/ui/postGigHandlerLogic.test.jsx`
- Test: `tests/node/expeditionContracts.test.js`

- [ ] **Step 1: Add failing linked-deal test**

Accept `energy_drink_cx` during active Expedition and pin the existing payout plus zero-payout linked obligation:

```jsx
const acceptObligation = vi.fn()
const { result } = renderHook(() => useDealHandlers(makeProps({ expeditionActive: true, acceptObligation })))
act(() => result.current.handleAcceptDeal(BRAND_DEALS.energy_drink_cx))
expect(updatePlayer).toHaveBeenCalledTimes(1)
expect(updateSocial).toHaveBeenCalledWith(expect.objectContaining({ activeDeals: expect.any(Array) }))
expect(acceptObligation).toHaveBeenCalledWith(expect.objectContaining({
  sourceType: 'brandDeal',
  sourceId: 'energy_drink_cx'
}))
const linked = acceptObligation.mock.calls[0][0]
expect(getObligationSettlement(linked, 'completed').moneyDelta).toBe(0)
```

- [ ] **Step 2: Add optional obligation metadata to BrandDeal**

```ts
expeditionObligation?: {
  metric: 'goodGigCount' | 'maxHeat' | 'restCount'
  target: number
  failureHeat: number
}
```

Add metadata only to selected existing templates in the first release:

```ts
// energy_drink_cx
expeditionObligation: { metric: 'goodGigCount', target: 3, failureHeat: 5 }

// corp_fast_food
expeditionObligation: { metric: 'maxHeat', target: 40, failureHeat: 3 }

// indie_label_void
expeditionObligation: { metric: 'restCount', target: 0, failureHeat: 2 }
```

- [ ] **Step 3: Add dispatcher to deal handlers**

Extend `HandlerDispatchers` with:

```ts
acceptExpeditionObligation: (obligation: ActiveObligationState) => void
```

Only after existing deal updates succeed, if Expedition active and metadata exists, build the linked obligation and dispatch it. The economic reward fields for this obligation are zero.

- [ ] **Step 4: Run deal/post-gig tests**

```bash
pnpm exec vitest run tests/ui/useDealHandlers.test.jsx tests/ui/postGigHandlerLogic.test.jsx
pnpm run typecheck:core
```


Expected: PASS; no payout duplication.

- [ ] **Step 5: Commit**

```bash
git add src/types/social.d.ts src/data/brandDeals.ts src/domain/expedition/contracts.ts src/hooks/postGig/handlers tests
git commit -m "feat(expedition): link brand deals to obligations"
```

---

### Task 7: Make Social Posts Drive Exposure/Heat Strategically

**Files:**
- Modify: `src/types/social.d.ts`
- Modify: `src/data/postOptions.ts`
- Modify: `src/hooks/postGig/handlers/types.ts`
- Modify: `src/hooks/postGig/handlers/socialPostHandlerUtils.ts`
- Modify: `src/hooks/postGig/handlers/useSocialPostHandler.ts`
- Test: `tests/ui/useSocialPostHandler.test.jsx`, `tests/node/socialEngine.test.js`

- [ ] **Step 1: Add failing social-pressure test**

For an active Expedition, resolve a post result containing:

```js
expeditionEffect: { heat: 5, exposure: 12 }
```

and assert the social result applies its existing follower/controversy update and dispatches one pressure action. In legacy mode, pressure dispatcher is not called.

- [ ] **Step 2: Extend shared PostResult contract**

```ts
export interface PostResult {
  // existing fields
  expeditionEffect?: { heat?: number; exposure?: number }
}
```

- [ ] **Step 3: Add explicit effects to a small initial subset**

Add to resolved results, not conditions:

```text
radicalize_fans -> heat +8, exposure +10
recovery_apology_tour_promo -> heat -8, exposure +6
recovery_leaked_good_deed success -> heat -5, exposure +12
recovery_leaked_good_deed fail -> heat +6, exposure +8
comm_loyalty_merch_drive -> heat 0, exposure +3
```

- [ ] **Step 4: Extend dispatcher plumbing**

`HandlerDispatchers` receives:

```ts
applyExpeditionPressure: (payload: ApplyExpeditionPressurePayload) => void
```

`applySocialPostResult` sanitizes finite fields from `finalResult.expeditionEffect` and dispatches reason `social` only when Expedition is active in the injected context.

- [ ] **Step 5: Run social tests**

```bash
pnpm run test:ui
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/types/social.d.ts src/data/postOptions.ts src/hooks/postGig/handlers tests
git commit -m "feat(expedition): connect social choices to pressure"
```

---

### Task 8: Add Pressure-Tagged Event Weighting to Existing Event Selection

**Files:**
- Create: `src/domain/expedition/pressureDirector.ts`
- Modify: `src/utils/eventEngine/types.ts`
- Modify: `src/utils/eventEngine/eventSelection.ts`
- Test: `tests/node/pressureDirector.test.js`
- Test: `tests/node/eventEngine.test.js`, `tests/node/eventEngine_resolver.test.js`

- [ ] **Step 1: Write failing multiplier tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { getPressureEventChanceMultiplier } from '../../src/domain/expedition/pressureDirector.ts'

test('high heat favors authority/underground events without forcing them', () => {
  assert.equal(
    getPressureEventChanceMultiplier({ heat: 80, exposure: 30 }, ['authority']),
    1.8
  )
  assert.equal(
    getPressureEventChanceMultiplier({ heat: 80, exposure: 30 }, ['clean']),
    0.6
  )
})

test('high exposure favors sponsor/rival/media events', () => {
  assert.equal(
    getPressureEventChanceMultiplier({ heat: 10, exposure: 80 }, ['rival']),
    1.5
  )
})
```

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/pressureDirector.test.js
```

Expected: FAIL.

- [ ] **Step 3: Implement bounded multiplier**

```ts
export type PressureEventTag =
  | 'authority'
  | 'underground'
  | 'clean'
  | 'sponsor'
  | 'rival'
  | 'media'

export const getPressureEventChanceMultiplier = (
  pressure: { heat: number; exposure: number },
  tags: readonly string[]
): number => {
  let factor = 1
  if (pressure.heat >= 75 && (tags.includes('authority') || tags.includes('underground'))) factor *= 1.8
  if (pressure.heat >= 75 && tags.includes('clean')) factor *= 0.6
  if (pressure.exposure >= 75 && (tags.includes('sponsor') || tags.includes('rival') || tags.includes('media'))) factor *= 1.5
  if (pressure.exposure < 25 && tags.includes('media')) factor *= 0.75
  return Math.max(0.4, Math.min(2, factor))
}
```

- [ ] **Step 4: Extend event engine type and weighted chance only**

Add:

```ts
pressureTags?: string[]
```

to `EngineEvent`. In `eventSelection.ts`, after existing flag/harmony/module/breakdown modifiers and before chance clamp:

```ts
if (gameState.expedition?.status === 'active' && event.pressureTags?.length) {
  chance *= getPressureEventChanceMultiplier(
    gameState.expedition.pressure,
    event.pressureTags
  )
}
```

The Director never creates an event, bypasses conditions/cooldowns, or changes outcomes.

- [ ] **Step 5: Run event-selection statistical/determinism tests**

```bash
pnpm run test:node
pnpm run typecheck:core
```

Expected: existing event selection semantics remain green; new pressure factors are covered.

- [ ] **Step 6: Commit**

```bash
git add src/domain/expedition/pressureDirector.ts src/utils/eventEngine/types.ts src/utils/eventEngine/eventSelection.ts tests/node/pressureDirector.test.js tests
git commit -m "feat(events): bias eligible events by expedition pressure"
```

---

### Task 9: Add Authority and Pressure Events With Telegraphing and Safe Escape

**Files:**
- Create: `src/data/events/pressure.ts`
- Modify: `src/data/events/index.ts`
- Modify: `public/locales/en/events.json`
- Modify: `public/locales/de/events.json`
- Test: `tests/data/events/validation.test.js`, `tests/node/eventValidator.test.js`, `tests/ui/events.data.test.jsx`

- [ ] **Step 1: Add failing event id assertions**

Require:

```js
[
  'expedition_authority_roadblock',
  'expedition_media_frenzy',
  'expedition_underground_invite'
]
```

- [ ] **Step 2: Add exact events**

Define the events using the existing `effect` schema plus the Expedition resolver added in G3. The roadblock demonstrates the complete shape:

```ts
export const PRESSURE_EVENTS = [
  {
    id: 'expedition_authority_roadblock', category: 'transport', trigger: 'travel', chance: 0.12, pressureTags: ['authority'],
    condition: state => state.expedition?.status === 'active' && (state.expedition.pressure?.heat ?? 0) >= 50,
    options: [
      { id: 'pay', label: 'events:expedition_authority_roadblock.pay', effect: { type: 'composite', effects: [
        { type: 'resource', resource: 'money', value: -1500 },
        { type: 'expedition', delta: { heat: -5 } },
        { type: 'cooldown', eventId: 'expedition_authority_roadblock', value: 2 }
      ] } },
      { id: 'security', label: 'events:expedition_authority_roadblock.security', condition: state => state.expedition.loadout.crewIds.includes('crew_saskia_security'), effect: { type: 'composite', effects: [
        { type: 'expedition', delta: { heat: -10 } },
        { type: 'cooldown', eventId: 'expedition_authority_roadblock', value: 2 }
      ] } },
      { id: 'hidden_compartment', label: 'events:expedition_authority_roadblock.hidden', condition: state => getExpeditionVehicleProfile(state).hiddenContrabandSlots > 0, effect: { type: 'composite', effects: [
        { type: 'expedition', delta: { heat: -3 } },
        { type: 'cooldown', eventId: 'expedition_authority_roadblock', value: 2 }
      ] } },
      { id: 'detour', label: 'events:expedition_authority_roadblock.detour', effect: { type: 'composite', effects: [
        { type: 'stat', stat: 'fuel', value: -15 },
        { type: 'expedition', delta: { heat: -8 } },
        { type: 'cooldown', eventId: 'expedition_authority_roadblock', value: 2 }
      ] } }
    ]
  },
  { id: 'expedition_media_frenzy', category: 'special', trigger: 'random', chance: 0.1, pressureTags: ['media'], condition: state => state.expedition?.status === 'active' && (state.expedition.pressure?.exposure ?? 0) >= 50, options: [
    { id: 'push', effect: { type: 'composite', effects: [{ type: 'resource', resource: 'fame', value: 500 }, { type: 'expedition', delta: { heat: 4, exposure: 10 } }] } },
    { id: 'monetize', effect: { type: 'composite', effects: [{ type: 'resource', resource: 'money', value: 800 }, { type: 'expedition', delta: { exposure: 5 } }] } },
    { id: 'quiet', effect: { type: 'expedition', delta: { exposure: -10 } } }
  ] },
  { id: 'expedition_underground_invite', category: 'special', trigger: 'random', chance: 0.08, pressureTags: ['underground'], condition: state => state.expedition?.status === 'active' && (state.expedition.pressure?.heat ?? 0) >= 60, options: [
    { id: 'accept', effect: { type: 'composite', effects: [{ type: 'resource', resource: 'fame', value: 700 }, { type: 'expedition', delta: { heat: 5 } }, { type: 'chain', eventId: 'expedition_underground_followup' }] } },
    { id: 'decline', effect: { type: 'expedition', delta: { heat: -3 } } }
  ] }
]
```

For the detour's vehicle damage, use the already-supported event stat key `{ type: 'stat', stat: 'van_condition', value: -5 }`. `src/utils/eventEngine/eventEffectHandlers.ts` maps `van_condition` into `delta.player.van.condition`, so this path reuses the canonical event delta instead of adding a second damage action.

- [ ] **Step 3: Add severe-event repeat protection**

Each roadblock branch includes the existing cooldown effect:

```ts
{ type: 'cooldown', eventId: 'expedition_authority_roadblock', value: 2 }
```

Add a resolver test asserting an event on day 5 writes `expedition_authority_roadblock:7` and event selection excludes it until expiry.

- [ ] **Step 4: Run event/i18n tests**

```bash
pnpm run test:node
pnpm run test:additional
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/events/pressure.ts src/data/events/index.ts public/locales/en/events.json public/locales/de/events.json tests
git commit -m "feat(events): add pressure and authority encounters"
```

---

### Task 10: Turn the Existing Active Rival Into a Persistent Nemesis Thread

**Files:**
- Create: `src/domain/expedition/rivals.ts`
- Modify: `src/utils/rivalEngine.ts`
- Modify: `src/hooks/overworld/useRivalEscalation.ts`
- Modify: `src/context/careerActionCreators.ts`
- Modify: `src/context/reducers/careerReducer.ts`
- Test: `tests/node/expeditionRivals.test.js`
- Test: `tests/node/rivalEngine.test.js`, `tests/node/rivalReducer.test.js`

- [ ] **Step 1: Write failing relationship progression tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { applyRivalOutcome } from '../../src/domain/expedition/rivals.ts'

test('repeated hostile outcomes escalate to rival then nemesis', () => {
  let history = { relationship: 'unknown', nemesisLevel: 0, encounterCount: 0, lastOutcome: null }
  history = applyRivalOutcome(history, 'hostile_win')
  assert.equal(history.relationship, 'competitive')
  history = applyRivalOutcome(history, 'hostile_win')
  assert.equal(history.relationship, 'rival')
  history = applyRivalOutcome(history, 'hostile_win')
  assert.equal(history.relationship, 'nemesis')
  assert.equal(history.nemesisLevel, 1)
})

test('respect choices can move competitive rival toward respect', () => {
  const next = applyRivalOutcome(
    { relationship: 'competitive', nemesisLevel: 0, encounterCount: 2, lastOutcome: null },
    'respect'
  )
  assert.equal(next.relationship, 'respect')
})
```

- [ ] **Step 2: Verify failure**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionRivals.test.js
```

Expected: FAIL.

- [ ] **Step 3: Implement persistent history transition**

```ts
export type RivalOutcome = 'hostile_win' | 'hostile_loss' | 'respect' | 'alliance'

export const applyRivalOutcome = (
  history: CareerRivalHistory,
  outcome: RivalOutcome
): CareerRivalHistory => {
  const encounterCount = history.encounterCount + 1
  let relationship = history.relationship
  let nemesisLevel = history.nemesisLevel
  if (outcome === 'alliance') relationship = 'alliance'
  else if (outcome === 'respect') relationship = 'respect'
  else if (outcome === 'hostile_win' || outcome === 'hostile_loss') {
    if (relationship === 'unknown') relationship = 'competitive'
    else if (relationship === 'competitive') relationship = 'rival'
    else if (relationship === 'rival') {
      relationship = 'nemesis'
      nemesisLevel = Math.max(1, nemesisLevel)
    } else if (relationship === 'nemesis') {
      nemesisLevel = Math.min(4, nemesisLevel + 1)
    }
  }
  return { relationship, nemesisLevel, encounterCount, lastOutcome: outcome }
}
```

- [ ] **Step 4: Keep one active run rival**

Do not replace `state.rivalBand` with a collection. At Expedition start, `generateRivalBand` may reuse a known persistent rival identity when the tour type/region requests it; otherwise current generation continues. `useRivalEscalation` retains its replay guard but delegates persistent result updates to an explicit encounter resolution, not mere co-location.

- [ ] **Step 5: Run rival regression tests**

```bash
pnpm run test:node
pnpm run test:ui
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/expedition/rivals.ts src/utils/rivalEngine.ts src/hooks/overworld/useRivalEscalation.ts src/context/careerActionCreators.ts src/context/reducers/careerReducer.ts tests/node/expeditionRivals.test.js tests
git commit -m "feat(expedition): persist rival nemesis progression"
```

---

### Task 11: Replace the Rival Toast-Only Encounter With Explicit Choices

**Files:**
- Create: `src/data/events/rival.ts`
- Create: `src/ui/expedition/RivalEncounterCard.tsx`
- Modify: `src/data/events/index.ts`
- Modify: `src/context/reducers/rivalReducer.ts`
- Modify: `src/hooks/overworld/useRivalEscalation.ts`
- Modify: `public/locales/en/events.json`, `public/locales/de/events.json`
- Test: `tests/node/rivalEngine.test.js`, `tests/ui/EventModal.test.jsx`, `tests/ui/events.data.test.jsx`

- [ ] **Step 1: Add failing encounter test**

When active rival and player share a node, pin one queued encounter and replay protection:

```js
const first = handleCheckRivalEncounter(activeCoLocatedState)
assert.equal(first.pendingEvents.filter(id => id === 'expedition_rival_double_booked').length, 1)
const replay = handleCheckRivalEncounter(first)
assert.equal(replay.pendingEvents.filter(id => id === 'expedition_rival_double_booked').length, 1)
```

- [ ] **Step 2: Add `expedition_rival_double_booked` event**

Add one ordinary event and map only the battle choice into typed Expedition intent; the generic event engine still owns display/choice resolution:

```ts
export const RIVAL_EVENTS = [{
  id: 'expedition_rival_double_booked', category: 'band', trigger: 'random', chance: 0, pressureTags: ['rival'],
  options: [
    { id: 'battle', effect: { type: 'expedition', delta: { heat: 3 } } },
    { id: 'split_bill', effect: { type: 'resource', resource: 'money', value: -500 } },
    { id: 'sabotage', effect: { type: 'expedition', delta: { heat: 25, condition: { pa: 5 } } } },
    { id: 'withdraw', effect: { type: 'resource', resource: 'fame', value: -300 } }
  ]
}]
```

Add `rivalBattlePending: boolean` to run state (default/sanitizer included). The event-resolution callback dispatches `setRivalBattlePending(true)` only for choice `battle`. The existing pre-gig path consumes that flag into a rival gig modifier; guarded post-gig resolution records the rival outcome and clears the flag. Split/Sabotage/Withdraw dispatch the corresponding persistent rival outcome once. No second modal/event engine is introduced.

- [ ] **Step 3: Remove duplicate toast-only semantics for Expedition**

`handleCheckRivalEncounter` keeps existing toast behavior for legacy runs. For active Expedition it should not both queue a rival event and emit the old warning toast repeatedly.

- [ ] **Step 4: Run tests**

```bash
pnpm run test:node
pnpm run test:ui
pnpm run test:additional
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/events/rival.ts src/data/events/index.ts src/ui/expedition/RivalEncounterCard.tsx src/context/reducers/rivalReducer.ts src/hooks/overworld/useRivalEscalation.ts public/locales tests
git commit -m "feat(expedition): add rival encounter choices"
```

---

### Task 12: Resolve a Context-Sensitive Finale Without Rebuilding the Map

**Files:**
- Create: `src/domain/expedition/finale.ts`
- Modify: `src/types/expedition.d.ts`
- Modify: `src/domain/expedition/defaults.ts`
- Modify: `src/context/reducers/expeditionSanitizers.ts`
- Modify: `src/context/expeditionActionCreators.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Modify: `src/hooks/useArrivalLogic.ts`
- Modify: `src/context/useGameDispatchActions.ts`, `src/context/reducers/gigReducer.ts`
- Test: `tests/node/expeditionFinale.test.js`
- Test: `tests/ui/useArrivalLogic.test.jsx`, `tests/hooks/preGig/usePreGigHandlers.test.tsx`, `tests/ui/PreGig.test.jsx`

- [ ] **Step 1: Write failing finale resolver tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveExpeditionFinaleType } from '../../src/domain/expedition/finale.ts'

test('nemesis state wins finale priority over general pressure', () => {
  assert.equal(resolveExpeditionFinaleType({
    heat: 90,
    exposure: 90,
    activeRivalRelationship: 'nemesis',
    activeSponsorObligations: 2,
    aggregateCondition: 80
  }), 'rival_battle')
})

test('high heat produces illegal show when no nemesis dominates', () => {
  assert.equal(resolveExpeditionFinaleType({
    heat: 90,
    exposure: 40,
    activeRivalRelationship: 'unknown',
    activeSponsorObligations: 0,
    aggregateCondition: 80
  }), 'illegal_show')
})
```

- [ ] **Step 2: Implement exact priority**

```ts
export type ExpeditionFinaleType =
  | 'regional_headliner'
  | 'corporate_showcase'
  | 'rival_battle'
  | 'illegal_show'
  | 'disaster_gig'

export const resolveExpeditionFinaleType = (ctx: {
  heat: number
  exposure: number
  activeRivalRelationship: string
  activeSponsorObligations: number
  aggregateCondition: number
}): ExpeditionFinaleType => {
  if (ctx.activeRivalRelationship === 'nemesis') return 'rival_battle'
  if (ctx.aggregateCondition < 25) return 'disaster_gig'
  if (ctx.heat >= 75) return 'illegal_show'
  if (ctx.exposure >= 60 && ctx.activeSponsorObligations > 0) return 'corporate_showcase'
  return 'regional_headliner'
}
```

- [ ] **Step 3: Persist only the resolved finale type in run state**

Add `finaleType: ExpeditionFinaleType | null` with replay-safe action/reducer:

```ts
export const createResolveExpeditionFinaleAction = (
  state: GameState
): Extract<GameAction, { type: typeof ActionTypes.RESOLVE_EXPEDITION_FINALE }> | null => {
  if (state.expedition.status !== 'active' || state.expedition.finaleType) return null
  return {
    type: ActionTypes.RESOLVE_EXPEDITION_FINALE,
    payload: { finaleType: resolveExpeditionFinaleType(buildFinaleContext(state)) }
  }
}

export const handleResolveExpeditionFinale = (state, payload) =>
  state.expedition.finaleType
    ? state
    : { ...state, expedition: { ...state.expedition, finaleType: payload.finaleType } }
```

- [ ] **Step 4: Translate finale type into existing gig modifiers**

Do not generate a second finale node. Apply a bounded modifier object before starting the existing Finale gig:

```text
regional_headliner: no extra modifier
corporate_showcase: higher minimum expectation, contract bonus
rival_battle: rival scoring context enabled
illegal_show: higher Heat consequence, higher Fame reward
 disaster_gig: technical hazard enabled, higher rare-reward chance if won
```

Use existing gig modifier/reset conventions; `START_GIG` remains the reset owner.

- [ ] **Step 5: Run finale/arrival tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/expeditionFinale.test.js
pnpm exec vitest run tests/ui/useArrivalLogic.test.jsx tests/ui/postGigHandlerLogic.test.jsx
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/expedition/finale.ts src/types/expedition.d.ts src/domain/expedition/defaults.ts src/context/reducers/expeditionSanitizers.ts src/context/expeditionActionCreators.ts src/context/reducers/expeditionReducer.ts src/hooks/useArrivalLogic.ts src tests
git commit -m "feat(expedition): add context-sensitive finales"
```

---

### Task 13: Implement Targeted Hybrid Run Drafts

**Files:**
- Create: `src/data/expedition/runTraits.ts`
- Create: `src/domain/expedition/runDrafts.ts`
- Create: `src/ui/expedition/RunDraftModal.tsx`
- Modify: `src/types/expedition.d.ts`
- Modify: `src/domain/expedition/defaults.ts`
- Modify: `src/context/actionTypes.ts`
- Modify: `src/types/actions.d.ts`
- Modify: `src/context/expeditionActionCreators.ts`
- Modify: `src/context/useExpeditionDispatchActions.ts`
- Modify: `src/context/reducers/expeditionReducer.ts`
- Modify: `src/context/reducers/expeditionSanitizers.ts`
- Modify: `src/hooks/postGig/handlers/useContinueHandler.ts`
- Modify: `src/hooks/useArrivalLogic.ts`
- Modify: `src/domain/expedition/rivals.ts`
- Modify: `src/domain/expedition/condition.ts`
- Modify: `src/domain/expedition/crewStress.ts`
- Modify: `src/domain/expedition/nodeIntel.ts`
- Modify: `src/domain/expedition/pressureDirector.ts`
- Modify: `src/domain/expedition/extraction.ts`
- Modify: `public/locales/en/ui.json`
- Modify: `public/locales/de/ui.json`
- Test: `tests/node/expeditionRunDrafts.test.js`
- Test: `tests/ui/RunDraftModal.test.tsx`
- Test: `tests/ui/postGigHandlerLogic.test.jsx`
- Test: `tests/ui/useArrivalLogic.test.jsx`

The approved design calls for a strong pre-tour build plus **occasional** 1-of-3 run drafts after meaningful moments. This task deliberately caps standard runs at two accepted drafts so the 20–30 minute loop is not interrupted constantly.

- [ ] **Step 1: Write failing deterministic draft tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { EXPEDITION_RUN_TRAITS } from '../../src/data/expedition/runTraits.ts'
import {
  buildRunDraft,
  getRunTraitProfile
} from '../../src/domain/expedition/runDrafts.ts'

test('same seed/source produces the same three unique candidates', () => {
  const a = buildRunDraft({
    runSeed: 12345,
    sourceKey: 'major_gig:node_3_1',
    sourceType: 'major_gig',
    ownedTraitIds: []
  })
  const b = buildRunDraft({
    runSeed: 12345,
    sourceKey: 'major_gig:node_3_1',
    sourceType: 'major_gig',
    ownedTraitIds: []
  })
  assert.ok(a)
  assert.deepEqual(a, b)
  assert.equal(new Set(a.candidateTraitIds).size, 3)
})

test('every approved source can produce three candidates in a fresh run', () => {
  for (const sourceType of ['major_gig', 'rival', 'supply', 'crew']) {
    const draft = buildRunDraft({
      runSeed: 12345,
      sourceKey: `${sourceType}:test`,
      sourceType,
      ownedTraitIds: []
    })
    assert.ok(draft, sourceType)
    assert.equal(new Set(draft.candidateTraitIds).size, 3, sourceType)
  }
})

test('source-local shortages fall back deterministically without offering owned traits', () => {
  const draft = buildRunDraft({
    runSeed: 12345,
    sourceKey: 'rival:rival_dead_circuits',
    sourceType: 'rival',
    ownedTraitIds: ['backchannel']
  })
  assert.ok(draft)
  assert.equal(draft.candidateTraitIds.includes('backchannel'), false)
  assert.equal(new Set(draft.candidateTraitIds).size, 3)
})

test('an exhausted global pool returns null instead of throwing', () => {
  const owned = Object.keys(EXPEDITION_RUN_TRAITS).slice(0, 4)
  assert.equal(buildRunDraft({
    runSeed: 12345,
    sourceKey: 'crew:exhausted',
    sourceType: 'crew',
    ownedTraitIds: owned
  }), null)
})

test('run trait profile composes the approved rule changes', () => {
  const profile = getRunTraitProfile(['road_warrior', 'backchannel'])
  assert.equal(profile.roadWearMultiplier, 0.7)
  assert.equal(profile.nodeIntelFloor, 1)
})
```

- [ ] **Step 2: Define six initial temporary run traits**

`src/data/expedition/runTraits.ts` owns the pool:

```ts
export type RunDraftSource = 'major_gig' | 'rival' | 'supply' | 'crew'

export interface ExpeditionRunTraitDefinition {
  id: string
  nameKey: string
  descriptionKey: string
  sources: readonly RunDraftSource[]
}

export const EXPEDITION_RUN_TRAITS = Object.freeze({
  road_warrior: {
    id: 'road_warrior',
    nameKey: 'ui:expedition.runTrait.roadWarrior.name',
    descriptionKey: 'ui:expedition.runTrait.roadWarrior.desc',
    sources: ['major_gig', 'supply']
  },
  field_engineer: {
    id: 'field_engineer',
    nameKey: 'ui:expedition.runTrait.fieldEngineer.name',
    descriptionKey: 'ui:expedition.runTrait.fieldEngineer.desc',
    sources: ['supply', 'crew']
  },
  crew_mediator: {
    id: 'crew_mediator',
    nameKey: 'ui:expedition.runTrait.crewMediator.name',
    descriptionKey: 'ui:expedition.runTrait.crewMediator.desc',
    sources: ['crew', 'major_gig']
  },
  backchannel: {
    id: 'backchannel',
    nameKey: 'ui:expedition.runTrait.backchannel.name',
    descriptionKey: 'ui:expedition.runTrait.backchannel.desc',
    sources: ['rival', 'major_gig']
  },
  cold_trail: {
    id: 'cold_trail',
    nameKey: 'ui:expedition.runTrait.coldTrail.name',
    descriptionKey: 'ui:expedition.runTrait.coldTrail.desc',
    sources: ['rival', 'supply']
  },
  reckless_encore: {
    id: 'reckless_encore',
    nameKey: 'ui:expedition.runTrait.recklessEncore.name',
    descriptionKey: 'ui:expedition.runTrait.recklessEncore.desc',
    sources: ['major_gig', 'rival']
  }
} satisfies Record<string, ExpeditionRunTraitDefinition>)
```

Semantics are fixed for v1:

```text
road_warrior: road travel wear x0.70
field_engineer: field repairs do not create a hidden defect and restore at least 55 condition
crew_mediator: positive crew-stress gains x0.70
backchannel: structurally visible nodes have intel floor 1
cold_trail: authority-tag event weight x0.50
reckless_encore: finale completion reward x1.20, voluntary extraction retention x0.85
```

These traits are run-only. They never write to `career` or `state.unlocks`.

- [ ] **Step 3: Add pending-draft state and deterministic candidate generation**

Extend `ExpeditionState`:

```ts
export interface PendingExpeditionDraft {
  sourceKey: string
  sourceType: RunDraftSource
  candidateTraitIds: string[]
}

pendingDraft: PendingExpeditionDraft | null
draftSourceKeysSeen: string[]
```

Default both to `null` / `[]`; sanitizer accepts only known source types, known trait ids, unique candidates, and at most 16 remembered source keys.

Use existing deterministic helpers outside reducers:

```ts
import { createRngStream } from '../../utils/seededRng'
import { hashString } from '../../utils/stringUtils'

export const buildRunDraft = (
  input: BuildRunDraftInput
): PendingExpeditionDraft | null => {
  const owned = new Set(input.ownedTraitIds)
  const eligible = Object.values(EXPEDITION_RUN_TRAITS)
    .filter(trait => !owned.has(trait.id))
    .sort((a, b) => a.id.localeCompare(b.id))

  if (eligible.length < 3) return null

  const seed = (input.runSeed ^ hashString(input.sourceKey)) >>> 0
  const rolls = createRngStream(seed, eligible.length)
  const ranked = eligible
    .map((trait, index) => ({
      trait,
      sourcePriority: trait.sources.includes(input.sourceType) ? 0 : 1,
      roll: rolls[index] ?? 0
    }))
    .sort(
      (a, b) =>
        a.sourcePriority - b.sourcePriority ||
        a.roll - b.roll ||
        a.trait.id.localeCompare(b.trait.id)
    )

  return {
    sourceKey: input.sourceKey,
    sourceType: input.sourceType,
    candidateTraitIds: ranked.slice(0, 3).map(item => item.trait.id)
  }
}
```

- [ ] **Step 4: Add replay-safe offer/select actions**

```ts
export const createOfferExpeditionDraftAction = (
  state: GameState,
  sourceType: RunDraftSource,
  sourceKey: string
): Extract<GameAction, { type: typeof ActionTypes.OFFER_EXPEDITION_DRAFT }> | null => {
  if (state.expedition.status !== 'active') return null
  if (state.expedition.pendingDraft) return null
  if (state.expedition.draftTraitIds.length >= 2) return null
  if (state.expedition.draftSourceKeysSeen.includes(sourceKey)) return null
  const draft = buildRunDraft({
    runSeed: state.runSeed,
    sourceType,
    sourceKey,
    ownedTraitIds: state.expedition.draftTraitIds
  })
  if (!draft) return null
  return { type: ActionTypes.OFFER_EXPEDITION_DRAFT, payload: draft }
}

export const createSelectExpeditionDraftAction = (
  traitId: unknown
): Extract<GameAction, { type: typeof ActionTypes.SELECT_EXPEDITION_DRAFT }> => {
  if (typeof traitId !== 'string' || !Object.hasOwn(EXPEDITION_RUN_TRAITS, traitId)) {
    throw new TypeError('unknown run trait')
  }
  return { type: ActionTypes.SELECT_EXPEDITION_DRAFT, payload: { traitId } }
}
```

The reducer accepts `OFFER` only when its `sourceKey` was not seen, records that source key immediately, and accepts `SELECT` only when the id is one of `pendingDraft.candidateTraitIds`; selection appends it once to `draftTraitIds` and clears `pendingDraft`. Because a standard run accepts at most two traits, the six-trait global pool always has at least four unowned entries when a second offer is eligible; source-local pools are preferences, not hard failure boundaries. If future content exhausts the global pool below three, the offer creator returns `null` rather than throwing or opening a broken draft UI.

- [ ] **Step 5: Trigger drafts only at approved high-value seams**

Use exact source keys so rerenders cannot offer twice:

```ts
// post-gig: successful, accuracy >= 70, route step >= 2
if (!failed && accuracy >= 70 && expedition.routeStep >= 2) {
  offerExpeditionDraft('major_gig', `major_gig:${currentGig.id}:${expedition.routeStep}`)
}

// rival resolution: only on a won rival encounter
offerExpeditionDraft('rival', `rival:${rivalBand.id}:${expedition.routeStep}`)

// Supply Stop: after the player completes one paid repair/supply interaction
offerExpeditionDraft('supply', `supply:${currentNode.id}`)

// crew crisis: only after a successful non-hostile resolution
offerExpeditionDraft('crew', `crew:${event.id}:${expedition.routeStep}`)
```

A standard run can therefore receive at most two accepted drafts. Do not offer a draft on every gig, travel hop, or random event.

- [ ] **Step 6: Apply trait effects through one pure profile**

```ts
export interface ExpeditionRunTraitProfile {
  roadWearMultiplier: number
  fieldRepairNoHiddenDefect: boolean
  fieldRepairMinimumCondition: number | null
  positiveCrewStressMultiplier: number
  nodeIntelFloor: NodeIntelLevel
  authorityEventWeightMultiplier: number
  finaleRewardMultiplier: number
  voluntaryRetentionMultiplier: number
}

export const getRunTraitProfile = (
  traitIds: readonly string[]
): ExpeditionRunTraitProfile => ({
  roadWearMultiplier: traitIds.includes('road_warrior') ? 0.7 : 1,
  fieldRepairNoHiddenDefect: traitIds.includes('field_engineer'),
  fieldRepairMinimumCondition: traitIds.includes('field_engineer') ? 55 : null,
  positiveCrewStressMultiplier: traitIds.includes('crew_mediator') ? 0.7 : 1,
  nodeIntelFloor: traitIds.includes('backchannel') ? 1 : 0,
  authorityEventWeightMultiplier: traitIds.includes('cold_trail') ? 0.5 : 1,
  finaleRewardMultiplier: traitIds.includes('reckless_encore') ? 1.2 : 1,
  voluntaryRetentionMultiplier: traitIds.includes('reckless_encore') ? 0.85 : 1
})
```

Compose this profile at the owning G2/G3/G4 helpers: condition wear, field repair result, positive crew stress, node intel selector, authority-tag director weight, finale reward, and voluntary extraction retention. Do not make reducers inspect trait ids directly.

- [ ] **Step 7: Build the 1-of-3 modal**

```tsx
export const RunDraftModal = ({ draft, onSelect }: Props) => (
  <section role='dialog' aria-labelledby='run-draft-title'>
    <h2 id='run-draft-title'>{t('ui:expedition.runDraft.title')}</h2>
    {draft.candidateTraitIds.map(id => {
      const trait = EXPEDITION_RUN_TRAITS[id]
      return (
        <button key={id} type='button' onClick={() => onSelect(id)}>
          <strong>{t(trait.nameKey)}</strong>
          <span>{t(trait.descriptionKey)}</span>
        </button>
      )
    })}
  </section>
)
```

Render it as a blocking run decision only while `pendingDraft !== null`; active game input behind the modal is disabled through the same modal/input-gating convention as existing events. Add exact EN/DE names/descriptions for all six traits.

- [ ] **Step 8: Run draft/domain/UI regression tests**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs \
  tests/node/expeditionRunDrafts.test.js \
  tests/node/expeditionExtraction.test.js \
  tests/node/expeditionPressure.test.js
pnpm exec vitest run \
  tests/ui/RunDraftModal.test.tsx \
  tests/ui/postGigHandlerLogic.test.jsx \
  tests/ui/useArrivalLogic.test.jsx
pnpm run typecheck:core
```

Expected: PASS; same seed/source yields the same candidates, duplicate offers/selects are no-ops, and no run holds more than two temporary draft traits under the standard policy.

- [ ] **Step 9: Commit**

```bash
git add src/data/expedition/runTraits.ts src/domain/expedition/runDrafts.ts src/ui/expedition/RunDraftModal.tsx src/types/expedition.d.ts src/domain/expedition/defaults.ts src/context src/hooks src/domain/expedition public/locales tests
git commit -m "feat(expedition): add targeted run trait drafts"
```

### Task 14: Build Compact Pressure and Obligations UI

**Files:**
- Create: `src/ui/expedition/PressurePanel.tsx`
- Create: `src/ui/expedition/ObligationsPanel.tsx`
- Modify: `src/ui/expedition/ExpeditionStatusStrip.tsx`
- Modify: `src/ui/expedition/RunSummaryCard.tsx`
- Modify: `public/locales/en/ui.json`, `public/locales/de/ui.json`
- Test: `tests/ui/ExpeditionPressurePanel.test.tsx`
- Test: `tests/ui/ExpeditionObligations.test.tsx`

- [ ] **Step 1: Add failing UI tests**

Pin the UI contract:

```tsx
render(<ExpeditionStatusStrip heat={67} routeStep={4} />)
expect(screen.getByText(/67/)).toBeInTheDocument()
expect(screen.queryByText(/Exposure 55/)).not.toBeInTheDocument()

render(<PressurePanel heat={67} exposure={55} />)
expect(screen.getByText(/55/)).toBeInTheDocument()
expect(screen.queryByText(/12%|0\.12/)).not.toBeInTheDocument()

render(<ObligationsPanel obligations={[activeObligation, completedObligation, failedObligation]} />)
expect(screen.getAllByTestId('expedition-obligation')).toHaveLength(3)
```

Add a Run Summary assertion that finale label is absent for `finaleType:null` and visible after resolution.

- [ ] **Step 2: Implement panels**

Implement panels from pure view-model selectors:

```tsx
export const PressurePanel = ({ heat, exposure }: Props) => {
  const view = buildPressureViewModel(heat, exposure)
  return <dl><dt>{t('ui:expedition.pressure.heat')}</dt><dd>{view.heatLabel}</dd><dt>{t('ui:expedition.pressure.exposure')}</dt><dd>{view.exposureLabel}</dd></dl>
}

export const ObligationsPanel = ({ obligations }: Props) => (
  <ul>{sortObligationsForDisplay(obligations).map(item => <ObligationRow key={item.id} obligation={item} />)}</ul>
)
```

- [ ] **Step 3: Add translations**

Add matching locale structures; for example:

```json
{ "expedition": { "pressure": { "heat": "Heat", "exposure": "Exposure" }, "obligation": { "active": "Active", "completed": "Completed", "failed": "Failed" }, "finale": { "rival_battle": "Rival battle", "illegal_show": "Illegal show" } } }
```

```json
{ "expedition": { "pressure": { "heat": "Heat", "exposure": "Aufmerksamkeit" }, "obligation": { "active": "Aktiv", "completed": "Erfüllt", "failed": "Gescheitert" }, "finale": { "rival_battle": "Rivalen-Duell", "illegal_show": "Illegale Show" } } }
```

Add every remaining band/contract/relationship/finale id to the same structures in both locale files.

- [ ] **Step 4: Run UI/i18n tests**

```bash
pnpm exec vitest run tests/ui/ExpeditionPressurePanel.test.tsx tests/ui/ExpeditionObligations.test.tsx
pnpm run test:additional
pnpm run typecheck:core
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/expedition public/locales tests/ui/ExpeditionPressurePanel.test.tsx tests/ui/ExpeditionObligations.test.tsx
git commit -m "feat(expedition): surface pressure and obligations"
```

---

### Task 15: Add G4 Pressure/Contract/Rival/Draft Metrics to the Balance Simulator

**Files:**
- Modify: `scripts/game-balance-simulation.mjs`
- Modify: `scripts/utils/balance-report-metadata.mjs`
- Test: `tests/node/game-balance-simulation.test.js`, `tests/node/balanceSourceFiles.test.js`

- [ ] **Step 1: Add failing report contract**

Require per scenario/strategy:

```js
[
  'avgHeatAtExtraction',
  'p90HeatAtExtraction',
  'avgExposureAtExtraction',
  'authorityEncounterRunsPct',
  'rivalEncounterRunsPct',
  'avgObligationsAccepted',
  'obligationCompletionPct',
  'obligationFailurePct',
  'avgMaxObligationStack',
  'finaleTypeShares',
  'heatRewardCorrelation',
  'avgDraftsOffered',
  'avgDraftsAccepted',
  'runTraitPickRates'
]
```

- [ ] **Step 2: Verify failure**

```bash
pnpm run test:node
```

Expected: new report assertions fail.

- [ ] **Step 3: Import production pressure/contract/director/finale helpers**

Import the canonical production helpers directly in `scripts/game-balance-simulation.mjs`:

```js
import {
  applyPressureDelta,
  getHeatBand,
  getExposureBand
} from '../src/domain/expedition/pressure.ts'
import {
  evaluateObligation,
  getObligationProgress
} from '../src/domain/expedition/contracts.ts'
import {
  getPressureEventChanceMultiplier
} from '../src/domain/expedition/pressureDirector.ts'
import {
  resolveExpeditionRivalOutcome
} from '../src/domain/expedition/rivals.ts'
import {
  resolveExpeditionFinaleType
} from '../src/domain/expedition/finale.ts'
```

Add those five domain files plus `src/data/expedition/contracts.ts`, `src/data/expedition/runTraits.ts`, `src/domain/expedition/runDrafts.ts`, `src/data/events/pressure.ts`, and `src/data/events/rival.ts` to the existing frozen `BALANCE_SOURCE_FILES` array in `scripts/utils/balance-report-metadata.mjs`. The simulator calls `getPressureEventChanceMultiplier`; it must not duplicate the director weighting formula.

- [ ] **Step 4: Add explicit strategy variants**

At minimum:

```text
Clean Sponsor: keep Heat <40, accept clean contracts, Manager/Nico/Tom
High Heat: accept Underground opportunities, Security/Mika/Tom
Rival Hunt: prefer rival path/events, performance-first
Baseline: neutral contract acceptance, extract based on safety threshold
```

Each is its own scenario id/seed stream.

- [ ] **Step 5: Add soft dominance diagnostics**

Warn when one strategy simultaneously has:

```text
- failure rate no worse than every comparator by >2 percentage points AND
- median secured reward at least 15% higher than every comparator
```

Do not make this a hard gate yet; first collect stable distributions.

- [ ] **Step 6: Run G4 gate**

```bash
pnpm run test:node
pnpm run test:ui
pnpm run typecheck:core
pnpm run deadcode:check
pnpm run simulate:balance
```

Expected: PASS; report contains calibration + holdout pressure/contract/rival metrics.

- [ ] **Step 7: Commit**

```bash
git add scripts/game-balance-simulation.mjs reports tests
git commit -m "test(balance): measure expedition pressure strategies"
```

---

## G4 Exit Criteria

- Heat and Exposure are distinct from controversy/fame and remain bounded.
- Obligations are voluntary run constraints and settle exactly once.
- Existing Brand Deal payouts still have one economic owner.
- Social posts can intentionally trade Heat/Exposure rather than only followers.
- Event Director only multiplies eligible event chance and respects conditions/cooldowns.
- Every severe authority event has a telegraphed and at least one expensive safe exit.
- Existing single active rival remains the run actor; history persists in `career`.
- Finale type is context-derived once and feeds the existing gig path.
- Simulator can compare Clean/High-Heat/Rival strategies and flag dominance.
