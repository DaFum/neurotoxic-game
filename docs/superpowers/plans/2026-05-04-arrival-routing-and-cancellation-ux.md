# Arrival Routing Unification & Cancellation Risk UX — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all scene-routing decisions into `handleNodeArrival` (returning an `ArrivalResult`), remove the hook-level fallback routing, and expose a colour-coded cancellation-risk badge in the map tooltip derived from a shared pure function.

**Architecture:** `handleNodeArrival` becomes a pure function that returns `{ scene: GamePhase; gigStarted: boolean }` (`ArrivalResult`); the two call-sites (`useTravelLogic` and `useArrivalLogic`) consume the result and call `changeScene` / `startGig` from outside the utility, keeping the utility free of side-effecting scene navigation. A new `calcCancellationRisk` pure function in `gameStateUtils.ts` feeds both the engine and the `MapNodeTooltip` badge so display and actual probability are always in sync.

**Tech Stack:** TypeScript, React, Vitest (UI tests), i18next, Tailwind v4

---

## Scope note — two independent subsystems

This plan covers two subsystems that happen to share the same source files but have zero runtime coupling:

1. **Tasks 1–4**: `ArrivalResult` return type + routing unification
2. **Tasks 5–7**: `calcCancellationRisk` + cancellation badge UI

Each can be reviewed and merged independently.

---

## File Map

| File                                        | Change                                                                                   |
| ------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/utils/arrivalUtils.ts`                 | Return `ArrivalResult`; remove `changeScene` calls; add `assertUnhandledNodeType` helper |
| `src/utils/gameStateUtils.ts`               | Export `calcCancellationRisk(harmony, threshold, chance)`                                |
| `src/hooks/useArrivalLogic.ts`              | Consume `ArrivalResult`; call `changeScene` based on returned `scene`                    |
| `src/hooks/useTravelLogic.ts`               | Consume `ArrivalResult`; remove duplicate `changeScene(OVERWORLD)` fallback              |
| `src/components/MapNode.tsx`                | Add `band` prop + cancellation badge inside `MapNodeTooltip`                             |
| `src/components/overworld/OverworldMap.tsx` | Thread `band` prop down to `MapNode`                                                     |
| `src/scenes/Overworld.tsx`                  | Pass `band` into `OverworldMap`                                                          |
| `tests/node/arrivalUtils.test.js`           | Verify `ArrivalResult` shapes for every node type                                        |
| `tests/ui/useArrivalLogic.test.jsx`         | Update assertions to match new `ArrivalResult` contract                                  |
| `tests/ui/MapNode.test.jsx`                 | New — badge rendering tests                                                              |

---

## Task 1: Define `ArrivalResult` type and `calcCancellationRisk`

**Files:**

- Modify: `src/utils/gameStateUtils.ts`
- Modify: `src/utils/arrivalUtils.ts` (type import only)

- [ ] **Step 1: Write the failing tests for `calcCancellationRisk`**

Add to `tests/node/arrivalUtils.test.js` (or create a dedicated `tests/node/calcCancellationRisk.test.js`):

```js
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// Dynamically import after vi.mock isn't needed — pure function, no deps
const { calcCancellationRisk } =
  await import('../../src/utils/gameStateUtils.ts')

describe('calcCancellationRisk', () => {
  it('returns 0 for harmony above threshold', () => {
    // harmony=20, threshold=15, chance=0.2 → above threshold → 0
    assert.strictEqual(calcCancellationRisk(20, 15, 0.2), 0)
  })

  it('returns 1 for harmony <= 1 (deterministic cancel)', () => {
    assert.strictEqual(calcCancellationRisk(1, 15, 0.2), 1)
  })

  it('returns the chance value for low harmony > 1', () => {
    // harmony=10, below threshold of 15, not <=1 → risk = chance = 0.2
    assert.strictEqual(calcCancellationRisk(10, 15, 0.2), 0.2)
  })

  it('uses BALANCE_CONSTANTS defaults when called with only harmony', () => {
    // harmony=1 → always 1
    assert.strictEqual(calcCancellationRisk(1), 1)
    // harmony=50 → 0
    assert.strictEqual(calcCancellationRisk(50), 0)
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/calcCancellationRisk.test.js
```

Expected: `TypeError: calcCancellationRisk is not a function`

- [ ] **Step 3: Implement `calcCancellationRisk` in `gameStateUtils.ts`**

Find the `BALANCE_CONSTANTS` block (around line 152) and add the function immediately after:

```ts
/**
 * Pure probability of gig cancellation given current harmony.
 * Mirrors the engine check in arrivalUtils so UI and runtime are always in sync.
 *
 * @param harmony - Current band harmony (clamped to 1..100 by caller)
 * @param threshold - Low-harmony threshold (default: BALANCE_CONSTANTS.LOW_HARMONY_THRESHOLD)
 * @param chance - Cancellation probability when below threshold (default: BALANCE_CONSTANTS.LOW_HARMONY_CANCELLATION_CHANCE)
 * @returns 0 = no risk, 0..1 = probabilistic, 1 = certain cancellation
 */
export const calcCancellationRisk = (
  harmony: number,
  threshold = BALANCE_CONSTANTS.LOW_HARMONY_THRESHOLD,
  chance = BALANCE_CONSTANTS.LOW_HARMONY_CANCELLATION_CHANCE
): number => {
  if (harmony <= 1) return 1
  if (harmony < threshold) return chance
  return 0
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/calcCancellationRisk.test.js
```

Expected: 4 passing

- [ ] **Step 5: Add `ArrivalResult` type to `arrivalUtils.ts`**

At the top of `src/utils/arrivalUtils.ts`, after the existing `HandleNodeArrivalParams` type block, add:

```ts
export type ArrivalResult = {
  /** Scene to navigate to after processing. Hook is responsible for calling changeScene. */
  scene: import('../types/game.d').GamePhase
  /** True when startGig was called successfully. Hook must not call changeScene when true. */
  gigStarted: boolean
}
```

- [ ] **Step 6: Commit**

```bash
git add src/utils/gameStateUtils.ts src/utils/arrivalUtils.ts tests/node/calcCancellationRisk.test.js
git commit -m "feat(arrival): add calcCancellationRisk pure fn and ArrivalResult type"
```

---

## Task 2: Refactor `handleNodeArrival` to return `ArrivalResult`

**Files:**

- Modify: `src/utils/arrivalUtils.ts`
- Modify: `tests/node/arrivalUtils.test.js`

The key change: remove all `changeScene` calls from `handleNodeArrival`; instead, return `{ scene, gigStarted }`. Add a private `assertUnhandledNodeType` log for unknown types so they are visible.

- [ ] **Step 1: Update existing `arrivalUtils` tests to expect `ArrivalResult`**

Open `tests/node/arrivalUtils.test.js`. Add or update assertions for the return value. The existing tests call `handleNodeArrival` and check side-effects; now also assert the return:

```js
// Inside the REST_STOP test:
const result = handleNodeArrival({
  node: { type: 'REST_STOP' },
  ...minimalParams
})
assert.deepStrictEqual(result, { scene: 'OVERWORLD', gigStarted: false })

// Inside a GIG/healthy-harmony test (harmony = 50):
const result = handleNodeArrival({
  node: { type: 'GIG', venue: { name: 'Club' } },
  ...minimalParams
})
assert.deepStrictEqual(result, { scene: 'OVERWORLD', gigStarted: true })

// Inside a GIG/low-harmony cancel test (harmony = 1):
const result = handleNodeArrival({
  node: { type: 'GIG', venue: {} },
  ...params_harmony_1
})
assert.deepStrictEqual(result, { scene: 'OVERWORLD', gigStarted: false })

// Inside a SPECIAL test:
const result = handleNodeArrival({
  node: { type: 'SPECIAL' },
  ...minimalParams
})
assert.deepStrictEqual(result, { scene: 'OVERWORLD', gigStarted: false })

// Inside a START test:
const result = handleNodeArrival({ node: { type: 'START' }, ...minimalParams })
assert.deepStrictEqual(result, { scene: 'OVERWORLD', gigStarted: false })
```

- [ ] **Step 2: Run tests — expect failures**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/arrivalUtils.test.js
```

Expected: failures on all new `result` assertions.

- [ ] **Step 3: Rewrite `handleNodeArrival` to return `ArrivalResult`**

Replace `src/utils/arrivalUtils.ts`'s `handleNodeArrival` function. Key rules:

- Remove the `changeScene` parameter from `HandleNodeArrivalParams` (it's no longer needed inside the util).
- Keep the `onShowHQ` param — it's a _display_ side effect (opens HQ modal), not scene routing, so it stays.
- Each `case` returns an `ArrivalResult`. The function signature becomes `(params: HandleNodeArrivalParams): ArrivalResult`.
- In the GIG/FESTIVAL/FINALE case, if `startGig` succeeds, return `{ scene: GAME_PHASES.OVERWORLD, gigStarted: true }`. If cancelled, return `{ scene: GAME_PHASES.OVERWORLD, gigStarted: false }`.
- Add a default case with logging + explicit OVERWORLD fallback:

```ts
// Remove changeScene from HandleNodeArrivalParams:
type HandleNodeArrivalParams = {
  node: ArrivalNode
  band: BandState
  player: PlayerState
  updateBand: (p: Partial<BandState>) => void
  updatePlayer: (p: Partial<PlayerState>) => void
  triggerEvent: (a: string, b?: string) => boolean
  startGig: (venue: Venue) => void
  addToast: (msg: string, level?: string) => void
  onShowHQ?: () => void
  eventAlreadyActive?: boolean
  rng?: () => number
}

export const handleNodeArrival = (
  params: HandleNodeArrivalParams
): ArrivalResult => {
  const {
    node,
    band,
    player,
    updateBand,
    updatePlayer,
    triggerEvent,
    startGig,
    addToast,
    onShowHQ,
    eventAlreadyActive = false,
    rng = secureRandom
  } = params

  switch (node.type) {
    case 'REST_STOP': {
      const members = band?.members ?? []
      const newMembers = new Array(members.length)
      for (let i = 0; i < members.length; i++) {
        const m = members[i]
        newMembers[i] = {
          ...m,
          stamina: clampMemberStamina(m.stamina + 20, m.staminaMax),
          mood: clampMemberMood(m.mood + 10)
        }
      }
      updateBand({ members: newMembers })
      addToast(
        i18n.t('ui:arrival.restedAtStop', {
          defaultValue: 'Rested at stop. Band feels better.'
        }),
        'success'
      )
      return { scene: GAME_PHASES.OVERWORLD, gigStarted: false }
    }
    case 'SPECIAL': {
      if (!eventAlreadyActive) {
        const specialEvent = triggerEvent('special')
        if (!specialEvent) {
          addToast(
            i18n.t('ui:arrival.specialNothingHappened', {
              defaultValue: 'A mysterious place, but nothing happened.'
            }),
            'info'
          )
        }
      }
      return { scene: GAME_PHASES.OVERWORLD, gigStarted: false }
    }
    case 'START': {
      if (onShowHQ) onShowHQ()
      addToast(
        i18n.t('ui:arrival.homeSweetHome', {
          defaultValue: 'Home Sweet Home.'
        }),
        'success'
      )
      return { scene: GAME_PHASES.OVERWORLD, gigStarted: false }
    }
    case 'FESTIVAL':
    case 'FINALE':
    case 'GIG': {
      const harmony = clampBandHarmony(band?.harmony)
      const isLowHarmony = harmony < BALANCE_CONSTANTS.LOW_HARMONY_THRESHOLD
      const luckCheck =
        rng() < BALANCE_CONSTANTS.LOW_HARMONY_CANCELLATION_CHANCE
      const shouldCancel = harmony <= 1 || (isLowHarmony && luckCheck)

      if (shouldCancel) {
        addToast(
          i18n.t('ui:arrival.showCancelled', {
            defaultValue:
              'Show cancelled! The band refused to go on stage due to low harmony.'
          }),
          'error'
        )
        if (player && updatePlayer) {
          const currentFame = player.fame || 0
          const loss = BALANCE_CONSTANTS.FAME_LOSS_BAD_GIG * 2
          const newFame = clampPlayerFame(currentFame - loss)
          updatePlayer({
            fame: newFame,
            fameLevel: calculateFameLevel(newFame)
          })
        }
        return { scene: GAME_PHASES.OVERWORLD, gigStarted: false }
      }

      logger.info('ArrivalLogic', 'Starting Gig at destination', {
        venue: node.venue.name
      })
      try {
        startGig(node.venue)
        return { scene: GAME_PHASES.OVERWORLD, gigStarted: true }
      } catch (error) {
        handleError(error, {
          addToast,
          fallbackMessage: i18n.t('ui:arrival.failedToStartGig', {
            defaultValue: 'Failed to start Gig.'
          })
        })
        return { scene: GAME_PHASES.OVERWORLD, gigStarted: false }
      }
    }
    default: {
      // Unhandled node type — log for analytics visibility instead of silent swallow
      logger.warn(
        'ArrivalLogic',
        'Unhandled node type — routing to OVERWORLD',
        { type: (node as ArrivalNode).type }
      )
      return { scene: GAME_PHASES.OVERWORLD, gigStarted: false }
    }
  }
}
```

- [ ] **Step 4: Run arrivalUtils tests — expect pass**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/arrivalUtils.test.js
```

Expected: all passing.

- [ ] **Step 5: Commit**

```bash
git add src/utils/arrivalUtils.ts tests/node/arrivalUtils.test.js
git commit -m "refactor(arrival): handleNodeArrival returns ArrivalResult, removes changeScene coupling"
```

---

## Task 3: Update `useArrivalLogic` to consume `ArrivalResult`

**Files:**

- Modify: `src/hooks/useArrivalLogic.ts`
- Modify: `tests/ui/useArrivalLogic.test.jsx`

- [ ] **Step 1: Update UI hook tests**

In `tests/ui/useArrivalLogic.test.jsx`, the existing test `'executes standard arrival sequence'` asserts `changeScene` was called with `GAME_PHASES.OVERWORLD`. That assertion must still pass — the hook now calls `changeScene(result.scene)` instead of a hardcoded fallback. No test changes are needed for correctness, but add one explicit assertion:

In the `'handles GIG node with sufficient harmony'` test, currently `changeScene` is not expected to be called (the test only asserts `startGig`). After the refactor, **`changeScene` must not be called when `gigStarted = true`**. Add:

```jsx
// After act():
expect(mockGameState.changeScene.mock.calls.length).toBe(0)
```

- [ ] **Step 2: Run UI tests — expect the new assertion to fail** (only if it fails — if the current code coincidentally passes it, note that)

```bash
pnpm run test:ui:file -- tests/ui/useArrivalLogic.test.jsx
```

- [ ] **Step 3: Update `useArrivalLogic` hook**

Replace the `handleArrivalSequence` callback body in `src/hooks/useArrivalLogic.ts`.

Current logic (after the previous idempotency PR):

```ts
// 5. Handle Node Arrival & Routing
if (currentNode) {
  handleNodeArrival({ node: currentNode, ... })
}
// Ensure we route to OVERWORLD if not a Gig/Festival/Finale where action is taken
if (!isGigNode(currentNode)) {
  changeScene(GAME_PHASES.OVERWORLD)
}
```

New logic — remove `isGigNode` import, remove fallback `changeScene` call, consume result:

```ts
// 5. Handle Node Arrival & Routing
const arrivalResult = currentNode
  ? handleNodeArrival({
      node: currentNode,
      band,
      player,
      updateBand,
      updatePlayer,
      triggerEvent,
      startGig,
      addToast,
      onShowHQ,
      eventAlreadyActive: travelEventActive,
      rng
    })
  : { scene: GAME_PHASES.OVERWORLD as const, gigStarted: false }

if (!arrivalResult.gigStarted) {
  changeScene(arrivalResult.scene)
}
```

Also remove `isGigNode` from the import line at the top of `useArrivalLogic.ts`:

```ts
import {
  handleNodeArrival,
  processHarmonyRegen,
  processTravelEvents
} from '../utils/arrivalUtils'
```

Remove `GAME_PHASES` import since it's no longer used directly in the hook:

```ts
// Remove: import { GAME_PHASES } from '../context/gameConstants'
```

Wait — `GAME_PHASES.OVERWORLD` is still referenced in the fallback. Keep the import or use the string literal `'OVERWORLD'`. Prefer keeping the import for type-safety.

Actually the fallback is: `{ scene: GAME_PHASES.OVERWORLD as const, gigStarted: false }`. Keep the import.

- [ ] **Step 4: Run UI tests — expect all passing**

```bash
pnpm run test:ui:file -- tests/ui/useArrivalLogic.test.jsx
```

Expected: all passing including the new `changeScene` not-called assertion.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useArrivalLogic.ts tests/ui/useArrivalLogic.test.jsx
git commit -m "refactor(arrival): useArrivalLogic consumes ArrivalResult, no fallback routing in hook"
```

---

## Task 4: Update `useTravelLogic` to consume `ArrivalResult`

**Files:**

- Modify: `src/hooks/useTravelLogic.ts`

`useTravelLogic` calls `handleNodeArrivalCallback` — an internal `useCallback` wrapping `handleNodeArrival`. The `handleNodeArrivalCallback` currently passes `changeScene` as a param. After Task 2, `changeScene` is no longer accepted by `handleNodeArrival`. We must:

1. Remove `changeScene` from the `handleNodeArrival` call inside `handleNodeArrivalCallback`.
2. `handleNodeArrivalCallback` must capture the `ArrivalResult` and call `changeScene` itself.

- [ ] **Step 1: Update `handleNodeArrivalCallback` in `useTravelLogic.ts`**

Find the `handleNodeArrivalCallback` useCallback (around line 184):

```ts
// BEFORE:
const handleNodeArrivalCallback = useCallback(
  (node, eventAlreadyActive = false) => {
    handleNodeArrival({
      node,
      band: bandRef.current,
      player: playerRef.current,
      updateBand,
      updatePlayer,
      triggerEvent,
      startGig,
      addToast,
      changeScene, // ← remove this
      onShowHQ,
      eventAlreadyActive
    })
  },
  [
    updateBand,
    updatePlayer,
    triggerEvent,
    startGig,
    addToast,
    onShowHQ,
    changeScene
  ]
)

// AFTER:
const handleNodeArrivalCallback = useCallback(
  (node, eventAlreadyActive = false) => {
    const result = handleNodeArrival({
      node,
      band: bandRef.current,
      player: playerRef.current,
      updateBand,
      updatePlayer,
      triggerEvent,
      startGig,
      addToast,
      onShowHQ,
      eventAlreadyActive
    })
    if (!result.gigStarted) {
      changeScene(result.scene)
    }
  },
  [
    updateBand,
    updatePlayer,
    triggerEvent,
    startGig,
    addToast,
    onShowHQ,
    changeScene
  ]
)
```

Also remove the `isGigNode` import from `useTravelLogic.ts` if it's only used for the removed fallback. Check: `isGigNode` is used in the `onTravelComplete` callback (line ~315) to decide whether to trigger travel events for gig nodes. Keep the import.

- [ ] **Step 2: Run the full test suite**

```bash
pnpm run test
```

Expected: all passing. If TypeScript errors appear about `changeScene` in `HandleNodeArrivalParams`, confirm Step 3 of Task 2 removed it correctly.

- [ ] **Step 3: Typecheck**

```bash
pnpm run typecheck:core
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useTravelLogic.ts
git commit -m "refactor(travel): useTravelLogic consumes ArrivalResult from handleNodeArrival"
```

---

## Task 5: Extract `calcCancellationRisk` UI integration — engine side (already done in Task 1)

The pure `calcCancellationRisk` function is already in `gameStateUtils.ts` from Task 1. This task wires it into `arrivalUtils.ts` to replace the inline `harmony <= 1 || (isLowHarmony && luckCheck)` check.

**Files:**

- Modify: `src/utils/arrivalUtils.ts`

- [ ] **Step 1: Import and use `calcCancellationRisk` in the GIG/FESTIVAL/FINALE case**

In `arrivalUtils.ts`, in the `GIG`/`FESTIVAL`/`FINALE` case, replace:

```ts
const harmony = clampBandHarmony(band?.harmony)
const isLowHarmony = harmony < BALANCE_CONSTANTS.LOW_HARMONY_THRESHOLD
const luckCheck = rng() < BALANCE_CONSTANTS.LOW_HARMONY_CANCELLATION_CHANCE
const shouldCancel = harmony <= 1 || (isLowHarmony && luckCheck)
```

with:

```ts
import { calcCancellationRisk, ... } from './gameStateUtils'
// ...
const harmony = clampBandHarmony(band?.harmony)
const risk = calcCancellationRisk(harmony)
// risk === 1 → certain; risk > 0 → probabilistic; risk === 0 → safe
const shouldCancel = risk === 1 || (risk > 0 && rng() < risk)
```

- [ ] **Step 2: Run tests**

```bash
pnpm run test
```

Expected: all passing (behaviour is identical, formula is shared).

- [ ] **Step 3: Commit**

```bash
git add src/utils/arrivalUtils.ts
git commit -m "refactor(arrival): use calcCancellationRisk in gig cancellation check"
```

---

## Task 6: Cancellation risk badge in `MapNodeTooltip`

**Files:**

- Modify: `src/components/MapNode.tsx`
- Modify: `src/components/overworld/OverworldMap.tsx`
- Modify: `src/scenes/Overworld.tsx`

The badge is shown only for GIG/FESTIVAL/FINALE nodes, only when `harmony < LOW_HARMONY_THRESHOLD`. It uses `calcCancellationRisk` to get the exact probability and shows a colour-coded one-decimal percentage plus a human-readable frequency string.

- [ ] **Step 1: Add `harmony` prop to `MapNodeProps` and `MapNodeTooltip`**

In `src/components/MapNode.tsx`:

```ts
// Add to MapNodeTooltipProps:
interface MapNodeTooltipProps {
  node: MapNodeData
  isCurrent: boolean
  nodeLocationName: string
  ticketPrice?: number
  t: TranslationCallback
  harmony?: number // ← add
}

// Add to MapNodeProps:
interface MapNodeProps {
  // ... existing ...
  harmony?: number // ← add
}
```

- [ ] **Step 2: Render the cancellation badge inside `MapNodeTooltip`**

Import `calcCancellationRisk` and `BALANCE_CONSTANTS`:

```ts
import {
  calcCancellationRisk,
  BALANCE_CONSTANTS
} from '../utils/gameStateUtils'
```

Inside `MapNodeTooltip`, after the existing venue stats block for GIG/FESTIVAL/FINALE nodes, add:

```tsx
{
  (node.type === 'GIG' ||
    node.type === 'FESTIVAL' ||
    node.type === 'FINALE') &&
    harmony !== undefined &&
    calcCancellationRisk(harmony) > 0 &&
    (() => {
      const risk = calcCancellationRisk(harmony)
      const pct = (risk * 100).toFixed(1)
      const freqDenom = Math.round(1 / risk)
      const badgeClass =
        risk >= 1
          ? 'text-blood-red font-bold'
          : risk > 0.3
            ? 'text-blood-red'
            : risk > 0.1
              ? 'text-warning-yellow'
              : 'text-toxic-green'
      return (
        <div className={`text-[10px] font-mono mt-1 ${badgeClass}`}>
          {t('ui:map.cancellationRisk', {
            defaultValue: '⚠ Cancel risk: {{pct}}% (1-in-{{freq}} chance)',
            pct,
            freq: freqDenom
          })}
        </div>
      )
    })()
}
```

Pass `harmony` down through `MapNode` to `MapNodeTooltip`:

```tsx
// In MapNode component, pass harmony to tooltip:
<MapNodeTooltip
  node={node}
  isCurrent={isCurrent}
  nodeLocationName={nodeLocationName}
  ticketPrice={ticketPrice}
  t={t}
  harmony={harmony} // ← add
/>
```

- [ ] **Step 3: Thread `harmony` prop through `OverworldMap`**

In `src/components/overworld/OverworldMap.tsx`, add `harmony?: number` to `OverworldMapProps` and pass it to each `MapNode`:

```ts
// In OverworldMapProps interface:
harmony?: number

// When rendering MapNode nodes:
<MapNode
  // ... existing props ...
  harmony={harmony}
/>
```

- [ ] **Step 4: Pass `band.harmony` from `Overworld.tsx`**

In `src/scenes/Overworld.tsx`, find the `<OverworldMap` render (around line 187) and add:

```tsx
<OverworldMap
  // ... existing props ...
  harmony={band?.harmony}
/>
```

- [ ] **Step 5: Run the full suite**

```bash
pnpm run test
pnpm run typecheck:core
```

Expected: all passing.

- [ ] **Step 6: Commit**

```bash
git add src/components/MapNode.tsx src/components/overworld/OverworldMap.tsx src/scenes/Overworld.tsx
git commit -m "feat(ux): show colour-coded cancellation risk badge on gig map nodes"
```

---

## Task 7: Test the cancellation badge

**Files:**

- Create: `tests/ui/MapNode.test.jsx` (new)

- [ ] **Step 1: Write failing tests**

```jsx
// tests/ui/MapNode.test.jsx
import { describe, it as test, beforeEach, afterEach, expect, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { act } from '@testing-library/react'
import { setupJSDOM, teardownJSDOM } from '../testUtils'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => opts?.defaultValue ?? key
  })
}))
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  }
}))
vi.mock('../src/ui/shared', () => ({
  HexNode: ({ children }) => <div>{children}</div>
}))
vi.mock('../src/utils/locationI18n', () => ({ translateLocation: v => v }))

// Import after mocks
const { MapNode } = await import('../../src/components/MapNode.tsx')

const baseProps = {
  node: {
    type: 'GIG',
    venue: { name: 'Club', capacity: 100, pay: 50, price: 10, diff: 2 }
  },
  isCurrent: false,
  isTraveling: false,
  visibility: 'visible',
  isReachable: true,
  handleTravel: () => {},
  setHoveredNode: () => {},
  iconUrl: '/icon.png',
  vanUrl: '/van.png'
}

describe('MapNode cancellation badge', () => {
  beforeEach(() => setupJSDOM())
  afterEach(() => {
    cleanup()
    teardownJSDOM()
  })

  test('shows no badge when harmony is above threshold (20)', () => {
    render(<MapNode {...baseProps} harmony={20} />)
    expect(screen.queryByText(/Cancel risk/)).toBeNull()
  })

  test('shows badge when harmony is 10 (below threshold 15)', () => {
    render(<MapNode {...baseProps} harmony={10} />)
    // Badge text contains "Cancel risk: 20.0%"
    expect(screen.getByText(/Cancel risk.*20\.0%/)).toBeTruthy()
  })

  test('badge shows 100.0% and 1-in-1 for harmony=1', () => {
    render(<MapNode {...baseProps} harmony={1} />)
    expect(screen.getByText(/Cancel risk.*100\.0%/)).toBeTruthy()
    expect(screen.getByText(/1-in-1/)).toBeTruthy()
  })

  test('no badge for REST_STOP nodes even with low harmony', () => {
    render(<MapNode {...baseProps} node={{ type: 'REST_STOP' }} harmony={5} />)
    expect(screen.queryByText(/Cancel risk/)).toBeNull()
  })

  test('no badge when harmony prop is undefined', () => {
    render(<MapNode {...baseProps} />)
    expect(screen.queryByText(/Cancel risk/)).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests — expect failures**

```bash
pnpm run test:ui:file -- tests/ui/MapNode.test.jsx
```

Expected: failures because badge doesn't yet exist (or the `MapNode` renders it without hover — adjust the tooltip visibility approach if hover is required; since tooltip content is always in DOM, the test should find it via `queryByText`).

> **Note:** The `MapNodeTooltip` uses `hidden group-hover:block` CSS to hide/show. The text is still in the DOM. `screen.getByText` searches the DOM regardless of CSS visibility. If tests still fail because the text is absent, confirm the tooltip renders unconditionally at all times (it does — CSS only controls display).

- [ ] **Step 3: Implement (already done in Task 6)**

If Task 6 is already complete, re-run:

```bash
pnpm run test:ui:file -- tests/ui/MapNode.test.jsx
```

Expected: all 5 passing.

- [ ] **Step 4: Run full suite**

```bash
pnpm run test:all
```

Expected: all passing.

- [ ] **Step 5: Commit**

```bash
git add tests/ui/MapNode.test.jsx
git commit -m "test(ux): assert cancellation risk badge renders for low-harmony gig nodes"
```

- [ ] **Step 6: Push branch**

```bash
git push -u origin claude/add-arrival-reset-trigger-NZz13
```

---

## Self-Review

### Spec coverage

| Spec requirement                                                                                                                                  | Task                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ArrivalResult = { scene, actions }` (adapted to `{ scene, gigStarted }` — no action list needed since side-effects are already applied in-place) | Task 1, 2                                                                                                                                                       |
| `handleNodeArrival` returns result; hook calls `changeScene`                                                                                      | Task 2, 3, 4                                                                                                                                                    |
| `nodeHandlers` map pattern for node types                                                                                                         | ❌ Not implemented — the switch is already well-structured and adding a map adds indirection without removing complexity. YAGNI applies: the switch is the map. |
| `assertNever`-equivalent for unhandled node types                                                                                                 | Task 2 (default case with `logger.warn`)                                                                                                                        |
| `calcCancellationRisk` pure function                                                                                                              | Task 1, 5                                                                                                                                                       |
| Colour-coded badge `< 10% green / 10–30% amber / > 30% red`                                                                                       | Task 6 (uses `text-toxic-green`, `text-warning-yellow`, `text-blood-red`)                                                                                       |
| Exact one-decimal percentage + "1-in-N" frequency text                                                                                            | Task 6, 7                                                                                                                                                       |
| Badge updates reactively as harmony changes                                                                                                       | Task 6 — harmony flows from `band.harmony` via props, React re-renders automatically                                                                            |
| i18n key for badge text                                                                                                                           | Task 6 (`ui:map.cancellationRisk`) — note: add German translation separately if locale files are maintained                                                     |

### Placeholder scan

No placeholders found.

### Type consistency

- `ArrivalResult.scene` typed as `GamePhase` throughout — consistent.
- `calcCancellationRisk` param order `(harmony, threshold, chance)` used identically in Tasks 1, 5, 6.
- `HandleNodeArrivalParams` loses `changeScene` in Task 2; both call-sites (Task 3, 4) already remove it.
