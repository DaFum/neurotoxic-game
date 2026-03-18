---
name: golden-path-test-author
description: |
  Write and maintain integration tests for the critical game loop: INTRO → MENU → OVERWORLD → PREGIG → GIG → POSTGIG → OVERWORLD → GAMEOVER.

  Trigger when: asked to add regression tests, verify game flow continuity, ensure state transitions work, check critical paths don't break, test bankruptcy/game-over paths, validate state clamping (money/harmony/fuel), audit action sequences, or diagnose transition bugs.

  Use when testing reducer + action creators together (not individual actions in isolation). Covers FULL CYCLE tests, STATE SAFETY invariants, and TRANSITION SEQUENCES.
---

# Golden Path Test Author

Ensure the critical game loop—**INTRO → MENU → OVERWORLD → PREGIG → GIG → POSTGIG → OVERWORLD**—works without regression. Validates state transitions, resource boundaries (money ≥ 0, harmony ∈ [1,100], fuel ∈ [0,100]), and scene sequencing.

## What Is a Golden Path Test?

A **golden path test** runs a sequence of actions (state transitions) end-to-end, verifying:
- **Scene transitions**: `CHANGE_SCENE` moves between valid game phases
- **State mutations**: `TRAVEL`, `START_GIG`, `ADVANCE_DAY` update player/band correctly
- **Resource safety**: Money never negative, harmony clamped [1, 100], fuel ∈ [0, 100]
- **Event cycles**: Full gig loop (start → perform → earn/lose money → return) works
- **Edge cases**: Bankruptcy triggers `GAMEOVER`, low fuel affects travel, etc.

Use `node:test` + `node:assert` to test the **reducer + action creators together**, not individual reducers in isolation.

## Core Workflow

### 1. Choose Your Test Target
| Target | Use Case | Notes |
|--------|----------|-------|
| **Full cycle** | INTRO → GAMEOVER in one test | ~50 state transitions; validates sequence integrity |
| **Single transition** | E.g., "test TRAVEL costs fuel" | Focused; isolates one action |
| **Edge case** | Bankruptcy, van breakdown, low harmony | Tests boundaries |
| **State safety** | "Verify money never goes negative" | Runs same action 5+ times; checks invariant |

### 2. Scaffold the Test File
Create `tests/golden-path/[name].test.js`:
```javascript
import test from 'node:test'  // use async `test()` to group subtests
import assert from 'node:assert/strict'
import { gameReducer, ActionTypes } from '../src/context/gameReducer.js'
import { createInitialState } from '../src/context/initialState.js'

const applyAction = (state, type, payload) =>
  gameReducer(state, { type, payload })

test('Golden Path: [Your Test Name]', async t => {
  let state = createInitialState()
  // ... subtests below
})
```

### 3. Define Input + Expected Output
For each action, specify:
- **precondition**: What must be true before the action (e.g., "state has 10 fuel")
- **action**: The reducer action type + payload
- **assertion**: What should be true after (e.g., "fuel is 9")

See **references/state-shapes.md** for game state structure and **references/common-assertions.md** for assertion patterns.

### 4. Run and Debug
```bash
pnpm run test -- tests/golden-path/[name].test.js
```
If it fails, see **references/debugging-guide.md** for diagnosis steps.

## Complete Example: Travel + Day Advance

```javascript
import test from 'node:test'
import assert from 'node:assert/strict'
import { gameReducer, ActionTypes } from '../../src/context/gameReducer.js'
import { createInitialState } from '../../src/context/initialState.js'
import { GAME_PHASES } from '../../src/context/gameConstants.js'

const applyAction = (state, type, payload) =>
  gameReducer(state, { type, payload })

test('Golden Path: Travel costs money and fuel', async t => {
  let state = createInitialState()
  state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.OVERWORLD)

  await t.test('Setup: Set initial resources', () => {
    state = applyAction(state, ActionTypes.UPDATE_PLAYER, {
      money: 500,
      van: { ...state.player.van, fuel: 100 }
    })
    assert.equal(state.player.money, 500)
    assert.equal(state.player.van.fuel, 100)
  })

  await t.test('Action: Travel deducts money and fuel', () => {
    const travelCost = 50
    const fuelUsed = 15
    state = applyAction(state, ActionTypes.UPDATE_PLAYER, {
      money: state.player.money - travelCost,
      currentNodeId: 'node_1_0',
      van: { ...state.player.van, fuel: state.player.van.fuel - fuelUsed }
    })
    assert.equal(state.player.money, 450)
    assert.equal(state.player.van.fuel, 85)
  })

  await t.test('Invariant: Money never negative', () => {
    // Even if we travel with too little fuel/money, reducer clamps to 0
    const veryNegative = state.player.money - 999
    state = applyAction(state, ActionTypes.UPDATE_PLAYER, {
      money: veryNegative
    })
    assert.equal(state.player.money, 0, 'Money clamped to 0')
  })

  await t.test('Action: Day advance costs daily expenses', () => {
    // Reset to known state
    state = createInitialState()
    const moneyBefore = state.player.money
    state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.OVERWORLD)
    state = gameReducer(state, { type: ActionTypes.ADVANCE_DAY })
    assert.ok(
      state.player.money < moneyBefore,
      'Money reduced after day advance'
    )
    assert.ok(state.player.money >= 0, 'Money never negative')
  })
})
```

## State Safety Checklist

Every golden path test should verify:

- ✅ **Money clamping**: `money >= 0` after `UPDATE_PLAYER`, `APPLY_EVENT_DELTA`, `ADVANCE_DAY`
- ✅ **Harmony bounds**: `band.harmony ∈ [1, 100]` after any band update
- ✅ **Fuel bounds**: `van.fuel ∈ [0, 100]`
- ✅ **Van condition**: `van.condition ∈ [0, 100]`
- ✅ **Scene validity**: Only transition to valid target scenes (see GAME_PHASES)
- ✅ **Gig data**: `currentGig` exists before `START_GIG` → `GIG`, nulled after return to OVERWORLD

Use **references/common-assertions.md** for assertion helpers.

## Multi-Step Sequences (Advanced)

To test a full cycle with multiple actions:

```javascript
test('Golden Path: Full gig cycle from setup to earnings', async t => {
  let state = createInitialState()

  // Phase 1: Overworld → PreGig
  state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.OVERWORLD)
  state = applyAction(state, ActionTypes.START_GIG, venue)
  assert.equal(state.currentScene, GAME_PHASES.PRE_GIG)

  // Phase 2: PreGig setup
  state = applyAction(state, ActionTypes.SET_SETLIST, songs)
  state = applyAction(state, ActionTypes.SET_GIG_MODIFIERS, { soundcheck: true })

  // Phase 3: PreGig → Gig
  state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.GIG)

  // Phase 4: Gig performance (set stats)
  const gigStats = { score: 8000, perfectHits: 50, misses: 3 }
  state = applyAction(state, ActionTypes.SET_LAST_GIG_STATS, gigStats)

  // Phase 5: Gig → PostGig
  state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.POST_GIG)

  // Phase 6: Apply earnings
  state = applyAction(state, ActionTypes.UPDATE_PLAYER, {
    money: state.player.money + 250
  })

  // Phase 7: Return to Overworld
  state = applyAction(state, ActionTypes.SET_GIG, null)
  state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.OVERWORLD)
  assert.equal(state.currentScene, GAME_PHASES.OVERWORLD)
  assert.equal(state.currentGig, null)
})
```

## Debugging Failed Tests

See **references/debugging-guide.md** for:
- **Test fails on line X**: How to read assertion errors
- **State is unexpectedly undefined**: Check preconditions and mocks
- **Money went negative**: Audit the action sequence for missing clamping
- **Scene transition rejected**: Verify valid transitions in `GAME_PHASES`

## Testing All 5 Transitions

See **references/transition-examples.md** for complete examples:
1. **MENU → OVERWORLD** (scene + map setup)
2. **OVERWORLD → PREGIG** (`START_GIG` action)
3. **PREGIG → GIG** (scene change + setlist/modifiers)
4. **GIG → POSTGIG** (score capture + scene change)
5. **POSTGIG → OVERWORLD** (earnings + gig cleanup)

## Existing Tests

The project already has comprehensive golden path tests in `tests/goldenPath.test.js` (630+ lines). Review that file for patterns before writing new tests—don't duplicate what's already covered.

_Skill sync: compatible with React 19.2.4 / Vite 8.0.0 baseline as of 2026-03-17._
