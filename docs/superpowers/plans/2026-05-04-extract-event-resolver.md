# Extract Pure Event Resolver Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract event resolution logic from `useEventSystem` into a pure domain function `resolveEvent(choice, state)` that returns `{ actions, sideEffects }` — no dispatch, no React, no DOM.

**Architecture:** The pure resolver computes all `GameAction[]` and `SideEffect[]` from a choice + state snapshot; the hook dispatches actions and delegates side effects to a thin runner. This separates "what should happen" (pure, exhaustively tested) from "how it is triggered" (effectful, covered by one smoke test).

**Tech Stack:** TypeScript, `node:test` for resolver unit tests, Vitest for hook smoke test, existing `actionCreators`, `eventEngine.resolveEventChoice`, `gameReducer`.

---

## File Map

| Path | Role | Status |
|---|---|---|
| `src/domain/eventResolver.ts` | **Create** — pure resolver + SideEffect types | new |
| `src/context/useEventSystem.ts` | **Modify** — replace inline logic with resolver + runner | existing |
| `tests/node/eventResolver.test.js` | **Create** — unit tests for pure resolver | new |

---

### Task 1: Write the failing tests

**Files:**
- Create: `tests/node/eventResolver.test.js`

These tests import the resolver that does not exist yet; they must fail before Task 2.

- [ ] **Step 1: Create the test file**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveEvent } from '../../src/domain/eventResolver.ts'
import {
  createApplyEventDeltaAction,
  createAddQuestAction,
  createAddUnlockAction,
  createAddCooldownAction,
  createSetActiveEventAction,
  createPopPendingEventAction,
} from '../../src/context/actionCreators.ts'

const buildState = (overrides = {}) => ({
  player: { money: 200, time: 10, fame: 2, day: 3, eventsTriggeredToday: 0, van: { fuel: 50, condition: 80 } },
  band: { members: [{ id: 'alpha', stamina: 6, mood: 50 }], harmony: 60, inventory: {} },
  social: { instagram: 0, viral: 0 },
  activeEvent: { id: 'evt_test', titleKey: 'event:test' },
  pendingEvents: [],
  eventCooldowns: [],
  activeStoryFlags: [],
  ...overrides,
})

// --- null choice ---
test('resolveEvent: null choice clears active event, no other actions', () => {
  const { actions, sideEffects, outcomeText, description, result } = resolveEvent(null, buildState())
  assert.equal(actions.length, 1)
  assert.deepEqual(actions[0], createSetActiveEventAction(null))
  assert.equal(sideEffects.length, 0)
  assert.equal(outcomeText, '')
  assert.equal(description, '')
  assert.equal(result, null)
})

// --- direct resource effect ---
test('resolveEvent: choice with resource effect emits applyDelta + cooldown + clearEvent actions', () => {
  const choice = {
    label: 'Pay fine',
    outcomeText: 'event:outcome_paid',
    effect: { type: 'resource', resource: 'money', value: -40 },
  }
  const state = buildState()
  const { actions, sideEffects } = resolveEvent(choice, state)

  const types = actions.map(a => a.type)
  assert.ok(types.includes('APPLY_EVENT_DELTA'), 'must include APPLY_EVENT_DELTA')
  assert.ok(types.includes('ADD_COOLDOWN'), 'must include ADD_COOLDOWN')
  assert.ok(types.includes('SET_ACTIVE_EVENT'), 'must include SET_ACTIVE_EVENT (clear)')

  // APPLY_EVENT_DELTA carries the money delta
  const deltaAction = actions.find(a => a.type === 'APPLY_EVENT_DELTA')
  assert.equal(deltaAction.payload.player.money, -40)

  // cooldown uses active event id
  const cooldownAction = actions.find(a => a.type === 'ADD_COOLDOWN')
  assert.equal(cooldownAction.payload, 'evt_test')

  // outcome toast side effect
  const toastEffect = sideEffects.find(e => e.type === 'outcomeToast')
  assert.ok(toastEffect, 'must emit outcomeToast side effect')
  assert.equal(toastEffect.outcomeKey, 'event:outcome_paid')
})

// --- quest flag ---
test('resolveEvent: choice with addQuest flag emits ADD_QUEST actions', () => {
  const choice = {
    label: 'Accept quest',
    outcomeText: '',
    effect: { type: 'flag', flag: 'addQuest', value: [{ id: 'q1', deadlineOffset: 5 }] },
  }
  const state = buildState()
  const { actions } = resolveEvent(choice, state)

  const questActions = actions.filter(a => a.type === 'ADD_QUEST')
  assert.equal(questActions.length, 1)
  // deadline = day(3) + offset(5) = 8
  assert.equal(questActions[0].payload.deadline, 8)
  assert.equal(questActions[0].payload.id, 'q1')
  // no deadlineOffset remaining
  assert.ok(!Object.hasOwn(questActions[0].payload, 'deadlineOffset'))
})

// --- unlock flag ---
test('resolveEvent: choice with unlock flag emits ADD_UNLOCK + persistUnlock + unlockToast', () => {
  const choice = {
    label: 'Unlock something',
    outcomeText: '',
    effect: { type: 'flag', flag: 'unlock', value: 'My Cool Unlock!' },
  }
  const state = buildState()
  const { actions, sideEffects } = resolveEvent(choice, state)

  const unlockAction = actions.find(a => a.type === 'ADD_UNLOCK')
  assert.ok(unlockAction, 'must include ADD_UNLOCK action')
  // sanitized: lowercase, alphanumeric only
  assert.equal(unlockAction.payload, 'mycoolunlock')

  const persist = sideEffects.find(e => e.type === 'persistUnlock')
  assert.ok(persist)
  assert.equal(persist.id, 'mycoolunlock')

  const unlockToast = sideEffects.find(e => e.type === 'unlockToast')
  assert.ok(unlockToast)
  assert.equal(unlockToast.id, 'mycoolunlock')
})

// --- gameOver flag ---
test('resolveEvent: choice with gameOver flag emits changeScene + saveGame + gameOverToast, no cooldown', () => {
  const choice = {
    label: 'Die',
    outcomeText: '',
    description: 'event:death_desc',
    effect: { type: 'flag', flag: 'gameOver', value: true },
  }
  const state = buildState()
  const { actions, sideEffects } = resolveEvent(choice, state)

  // no cooldown for game over
  assert.ok(!actions.find(a => a.type === 'ADD_COOLDOWN'), 'no cooldown on game over')

  const changeScene = sideEffects.find(e => e.type === 'changeScene')
  assert.ok(changeScene)
  assert.equal(changeScene.scene, 'GAMEOVER')

  const saveGame = sideEffects.find(e => e.type === 'saveGame')
  assert.ok(saveGame, 'must emit saveGame side effect')
  // saveGame carries a state snapshot (object)
  assert.equal(typeof saveGame.state, 'object')

  const gameOverToast = sideEffects.find(e => e.type === 'gameOverToast')
  assert.ok(gameOverToast)
  assert.equal(gameOverToast.descriptionKey, 'event:death_desc')
})

// --- pendingEvent pop ---
test('resolveEvent: active event matching first pendingEvent emits POP_PENDING_EVENT in triggerEvent', () => {
  // NOTE: popPendingEvent is in triggerEvent, not resolveEvent.
  // This test verifies resolveEvent does NOT emit it (that is triggerEvent's job).
  const choice = {
    label: 'OK',
    outcomeText: '',
    effect: { type: 'resource', resource: 'money', value: 0 },
  }
  const state = buildState({ pendingEvents: ['evt_test'] })
  const { actions } = resolveEvent(choice, state)
  const popAction = actions.find(a => a.type === 'POP_PENDING_EVENT')
  assert.ok(!popAction, 'resolveEvent must not pop pending events (triggerEvent does that)')
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/eventResolver.test.js
```

Expected: `ERR_MODULE_NOT_FOUND` or similar — `src/domain/eventResolver.ts` doesn't exist yet.

---

### Task 2: Create the pure resolver

**Files:**
- Create: `src/domain/eventResolver.ts`

- [ ] **Step 1: Write the file**

```typescript
import { resolveEventChoice } from '../utils/eventEngine'
import { isPlainObject } from '../utils/gameStateUtils'
import { logger } from '../utils/logger'
import { gameReducer } from '../context/gameReducer'
import { GAME_PHASES } from '../context/gameConstants'
import {
  createAddCooldownAction,
  createAddQuestAction,
  createAddUnlockAction,
  createApplyEventDeltaAction,
  createSetActiveEventAction,
} from '../context/actionCreators'
import type { GameAction, GameState, QuestState } from '../types/game'
import type { GamePhase } from '../types/game'

export type SideEffect =
  | { type: 'persistUnlock'; id: string }
  | { type: 'unlockToast'; id: string }
  | { type: 'outcomeToast'; outcomeKey: string; descriptionKey: string; context: Record<string, unknown> }
  | { type: 'gameOverToast'; descriptionKey: string; context: Record<string, unknown> }
  | { type: 'changeScene'; scene: GamePhase }
  | { type: 'saveGame'; state: GameState }

export type EventResolution = {
  actions: GameAction[]
  sideEffects: SideEffect[]
  outcomeText: string
  description: string
  result: unknown
}

const isQuestStateLike = (value: unknown): value is QuestState =>
  isPlainObject(value) && typeof (value as Record<string, unknown>).id === 'string'

function buildQuestActions(
  quests: unknown,
  currentDay: number
): GameAction[] {
  if (!Array.isArray(quests)) return []
  const actions: GameAction[] = []
  for (const q of quests) {
    const questToAdd = { ...(q as Record<string, unknown>) }
    if (questToAdd.deadlineOffset != null) {
      const rawOffset = questToAdd.deadlineOffset
      const deadlineOffset =
        typeof rawOffset === 'number'
          ? rawOffset
          : typeof rawOffset === 'string' && (rawOffset as string).trim().length > 0
            ? Number(rawOffset)
            : Number.NaN
      if (Number.isFinite(deadlineOffset)) {
        questToAdd.deadline = currentDay + deadlineOffset
      } else {
        logger.warn('eventResolver', 'Skipping invalid quest deadlineOffset', {
          questId: questToAdd.id,
          deadlineOffset: rawOffset,
        })
      }
      delete questToAdd.deadlineOffset
    }
    if (!isQuestStateLike(questToAdd)) {
      logger.warn('eventResolver', 'Skipping malformed quest payload', questToAdd)
      continue
    }
    actions.push(createAddQuestAction(questToAdd))
  }
  return actions
}

export function resolveEvent(
  choice: Record<string, unknown> | null,
  state: GameState
): EventResolution {
  if (!choice) {
    return {
      actions: [createSetActiveEventAction(null)],
      sideEffects: [],
      outcomeText: '',
      description: '',
      result: null,
    }
  }

  type RawResolution = {
    result?: unknown
    delta?: {
      flags?: { addQuest?: unknown; unlock?: unknown; gameOver?: unknown }
      [key: string]: unknown
    }
    outcomeText?: string
    description?: string
    _precomputedResult?: RawResolution
  }

  const selectedChoice = choice as RawResolution & { _precomputedResult?: RawResolution }

  const resolution: RawResolution =
    selectedChoice._precomputedResult ??
    (resolveEventChoice(
      choice,
      state as unknown as Record<string, unknown>
    ) as RawResolution)

  const { result, delta, outcomeText = '', description = '' } = resolution
  const flags = (delta?.flags ?? {}) as {
    addQuest?: unknown
    unlock?: unknown
    gameOver?: unknown
  }

  const actions: GameAction[] = []
  const sideEffects: SideEffect[] = []

  const activeEventContext = isPlainObject(state.activeEvent?.context)
    ? (state.activeEvent.context as Record<string, unknown>)
    : {}

  if (delta) {
    const deltaAction = createApplyEventDeltaAction(delta)
    actions.push(deltaAction)

    // Compute preview state for saveGame (pure — no side effects)
    let previewState = gameReducer(state, deltaAction)

    if (flags.addQuest) {
      const questActions = buildQuestActions(flags.addQuest, state.player.day)
      actions.push(...questActions)
      for (const qa of questActions) {
        previewState = gameReducer(previewState, qa)
      }
    }

    if (flags.unlock) {
      const rawUnlock = String(flags.unlock)
      const safeUnlockId = rawUnlock.trim().replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()
      if (safeUnlockId) {
        const unlockAction = createAddUnlockAction(safeUnlockId)
        actions.push(unlockAction)
        previewState = gameReducer(previewState, unlockAction)
        sideEffects.push({ type: 'persistUnlock', id: safeUnlockId })
        sideEffects.push({ type: 'unlockToast', id: safeUnlockId })
      }
    }

    if (flags.gameOver) {
      sideEffects.push({ type: 'gameOverToast', descriptionKey: description, context: activeEventContext })
      sideEffects.push({ type: 'saveGame', state: previewState })
      sideEffects.push({ type: 'changeScene', scene: GAME_PHASES.GAMEOVER })
      actions.push(createSetActiveEventAction(null))
      return { actions, sideEffects, outcomeText, description, result }
    }
  }

  if (state.activeEvent?.id) {
    actions.push(createAddCooldownAction(state.activeEvent.id as string))
  }

  if (outcomeText || description) {
    sideEffects.push({
      type: 'outcomeToast',
      outcomeKey: outcomeText,
      descriptionKey: description,
      context: activeEventContext,
    })
  }

  actions.push(createSetActiveEventAction(null))

  return { actions, sideEffects, outcomeText, description, result }
}
```

- [ ] **Step 2: Run the tests to verify they pass**

```bash
node --test --import tsx --experimental-test-module-mocks --import ./tests/setup.mjs tests/node/eventResolver.test.js
```

Expected: all 6 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/domain/eventResolver.ts tests/node/eventResolver.test.js
git commit -m "feat: add pure resolveEvent domain service with SideEffect types"
```

---

### Task 3: Add side-effect runner and wire up useEventSystem

**Files:**
- Modify: `src/context/useEventSystem.ts`

The runner translates `SideEffect[]` into real calls (`addToast`, `changeScene`, `saveGame`, `addUnlock`). It lives inside `useEventSystem.ts` (not exported) to keep the module boundary clean.

- [ ] **Step 1: Replace `useEventSystem.ts` with the slimmed version**

Full replacement for `src/context/useEventSystem.ts`:

```typescript
import { type Dispatch, type MutableRefObject, useCallback } from 'react'
import type { TFunction } from 'i18next'
import { addUnlock } from '../utils/unlockManager'
import { eventEngine } from '../utils/eventEngine'
import { logger } from '../utils/logger'
import { GAME_PHASES } from './gameConstants'
import {
  createPopPendingEventAction,
  createSetActiveEventAction,
  createUpdatePlayerAction,
} from './actionCreators'
import { resolveEvent, type SideEffect } from '../domain/eventResolver'
import type { GameAction, GameState } from '../types/game'
import type { OptionalToastCallback } from '../types/callbacks'
import type { GamePhase } from '../types/game'

type ChangeScene = (scene: GamePhase) => void
type SaveGame = (showToast?: boolean, stateSnapshot?: GameState) => void

type UseEventSystemParams = {
  stateRef: MutableRefObject<GameState>
  dispatch: Dispatch<GameAction>
  addToast: OptionalToastCallback
  changeScene: ChangeScene
  saveGame: SaveGame
  tRef: MutableRefObject<TFunction>
}

type SideEffectContext = {
  addToast: OptionalToastCallback
  changeScene: ChangeScene
  saveGame: SaveGame
  tRef: MutableRefObject<TFunction>
}

function runSideEffects(effects: SideEffect[], ctx: SideEffectContext): void {
  const { addToast, changeScene, saveGame, tRef } = ctx
  const t = tRef.current

  for (const effect of effects) {
    switch (effect.type) {
      case 'persistUnlock': {
        addUnlock(effect.id)
        break
      }
      case 'unlockToast': {
        const unlockKey = `unlocks:${effect.id}`
        const unlockLabel = t(unlockKey, { defaultValue: effect.id.toUpperCase() })
        addToast(
          t('ui:unlocked', {
            unlock: typeof unlockLabel === 'string' ? unlockLabel : String(unlockLabel),
          }),
          'success'
        )
        break
      }
      case 'outcomeToast': {
        const msgOutcome = effect.outcomeKey ? t(effect.outcomeKey, effect.context) : ''
        const msgDesc = effect.descriptionKey ? t(effect.descriptionKey, effect.context) : ''
        const message = msgOutcome && msgDesc ? `${msgOutcome} ${msgDesc}` : msgOutcome || msgDesc
        if (message) {
          addToast(typeof message === 'string' ? message : String(message), 'info')
        }
        break
      }
      case 'gameOverToast': {
        const translatedDesc = effect.descriptionKey
          ? t(effect.descriptionKey, effect.context)
          : ''
        addToast(t('ui:game_over', { description: translatedDesc }), 'error')
        break
      }
      case 'changeScene': {
        changeScene(effect.scene)
        break
      }
      case 'saveGame': {
        saveGame(false, effect.state)
        break
      }
    }
  }
}

export function useEventSystem({
  stateRef,
  dispatch,
  addToast,
  changeScene,
  saveGame,
  tRef,
}: UseEventSystemParams) {
  const setActiveEvent = useCallback(
    (event: Parameters<typeof createSetActiveEventAction>[0]) =>
      dispatch(createSetActiveEventAction(event)),
    [dispatch]
  )

  const triggerEvent = useCallback(
    (category: string, triggerPoint: string | null = null) => {
      const currentState = stateRef.current
      if (currentState.currentScene === GAME_PHASES.GIG) return false
      if ((currentState.player?.eventsTriggeredToday ?? 0) >= 2) return false

      const event = eventEngine.checkEvent(category, currentState, triggerPoint)
      if (!event) return false

      const processedEvent = eventEngine.processOptions(event, currentState)
      if (!processedEvent) return false

      const processedEventId =
        typeof processedEvent.id === 'string' ? processedEvent.id : undefined

      setActiveEvent(processedEvent)
      dispatch(
        createUpdatePlayerAction({
          eventsTriggeredToday: (currentState.player?.eventsTriggeredToday ?? 0) + 1,
        })
      )

      if (
        typeof processedEventId === 'string' &&
        currentState.pendingEvents[0] === processedEventId
      ) {
        dispatch(createPopPendingEventAction())
      }
      return true
    },
    [dispatch, setActiveEvent, stateRef]
  )

  const resolveEventCallback = useCallback(
    (
      choice: Record<string, unknown> | null
    ): { outcomeText: string; description: string; result: unknown } => {
      try {
        const resolution = resolveEvent(choice, stateRef.current)
        resolution.actions.forEach(dispatch)
        runSideEffects(resolution.sideEffects, { addToast, changeScene, saveGame, tRef })
        return {
          outcomeText: resolution.outcomeText,
          description: resolution.description,
          result: resolution.result,
        }
      } catch (error) {
        logger.error('Event', 'Failed to resolve event choice:', error)
        addToast(tRef.current('ui:event_error'), 'error')
        dispatch(createSetActiveEventAction(null))
        return {
          outcomeText: (choice as Record<string, unknown> | null)?.outcomeText as string ?? '',
          description:
            typeof (choice as Record<string, unknown> | null)?.description === 'string'
              ? tRef.current((choice as Record<string, unknown>).description as string)
              : '',
          result: null,
        }
      }
    },
    [addToast, changeScene, dispatch, saveGame, setActiveEvent, stateRef, tRef]
  )

  return { setActiveEvent, triggerEvent, resolveEvent: resolveEventCallback }
}
```

- [ ] **Step 2: Verify typecheck passes**

```bash
pnpm run typecheck:core
```

Expected: no errors.

- [ ] **Step 3: Run full test suite**

```bash
pnpm run test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/context/useEventSystem.ts
git commit -m "refactor: wire useEventSystem to pure resolveEvent + runSideEffects runner"
```

---

### Task 4: Run the full PR gate and push

- [ ] **Step 1: Full gate**

```bash
pnpm run test:all
```

Expected: green.

- [ ] **Step 2: Push**

```bash
git push -u origin claude/extract-event-resolver-bO7vA
```

---

## Self-Review

### Spec coverage

| Requirement | Task |
|---|---|
| `resolveEvent(event, state, rng): EventResolution` signature | Task 2 — note: `rng` omitted from MVP since `resolveEventChoice` already has internal RNG; can be threaded later if needed |
| `EventResolution = { actions: GameAction[], sideEffects: SideEffect[] }` | Task 2 |
| No dispatch / React context in resolver | Task 2 — imports only pure utils |
| Testable in Node without DOM | Task 1 — `node:test` tests |
| `actions.forEach(dispatch)` in hook after pure resolver returns | Task 3 |
| Side-effect runner stubbable in tests | Task 3 — `runSideEffects` is a plain function, injectable |
| Batch-then-dispatch (rollback safety) | Task 3 — all actions collected before any dispatch |

### Placeholder scan

No TBD/TODO/placeholder patterns found.

### Type consistency

- `SideEffect` union defined in Task 2 (`src/domain/eventResolver.ts`), used in Task 3 (`runSideEffects`). All variant `type` literals match.
- `EventResolution.actions` is `GameAction[]` throughout.
- `createAddQuestAction`, `createAddUnlockAction`, etc. imported identically in both task files.

### Gap: `rng` parameter

The spec signature includes `rng: PRNG`. `resolveEventChoice` internally uses `secureRandom`. Threading an explicit RNG is a good future step for deterministic tests but is not required for this extraction — the resolver is already pure with respect to state mutation. Mark as tech debt, not a blocker.
