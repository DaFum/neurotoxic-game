# Debugging Failed Golden Path Tests

Systematic guide for diagnosing and fixing failing golden path tests.

## Quick Diagnosis Flow

1. **Read the error message** — note the line number and assertion that failed
2. **Identify the type** — boundary check, transition, state mutation, or sequence issue
3. **Check preconditions** — is the state what we think it is before the action?
4. **Verify the action** — did we call the right action with the right payload?
5. **Run in isolation** — test just that one assertion to narrow scope

## Common Failure Patterns

### Pattern 1: "assert.equal(state.player.money, 450)"

**Symptom:**

```
AssertionError [ERR_ASSERTION]: 470 == 450
```

**Diagnosis:**

- Money didn't decrease as expected
- Likely: The action wasn't applied, or was applied twice, or clamped to 0 earlier

**Fix Checklist:**

```javascript
// ✅ Did you apply the action?
state = applyAction(state, ActionTypes.UPDATE_PLAYER, { money: 450 })

// ✅ Is the precondition correct?
// Before the action, verify state.player.money === 500 (example)
assert.equal(state.player.money, 500, 'precondition: started with 500')
state = applyAction(state, ActionTypes.UPDATE_PLAYER, { money: 450 })
assert.equal(state.player.money, 450, 'After action, has 450')

// ✅ Is the reducer actually updating?
console.log('State before:', state.player.money)
state = applyAction(state, ActionTypes.UPDATE_PLAYER, { money: 400 })
console.log('State after:', state.player.money)

// ✅ Did UPDATE_PLAYER clamp unexpectedly?
// Negative money is clamped to 0
const newMoney = 100 - 200 // -100
state = applyAction(state, ActionTypes.UPDATE_PLAYER, { money: newMoney })
// Result: money = 0, not -100
```

**Prevention:**
Always set up preconditions explicitly:

```javascript
await t.test('Money decreases on travel', () => {
  // Precondition
  state = applyAction(state, ActionTypes.UPDATE_PLAYER, { money: 500 })
  assert.equal(state.player.money, 500, 'START: money is 500')

  // Action
  state = applyAction(state, ActionTypes.UPDATE_PLAYER, { money: 450 })

  // Assertion
  assert.equal(state.player.money, 450, 'END: money is 450')
})
```

---

### Pattern 2: "assert.equal(state.currentScene, 'PRE_GIG')"

**Symptom:**

```
AssertionError [ERR_ASSERTION]: 'GIG' == 'PRE_GIG'
```

**Diagnosis:**

- Scene didn't transition as expected
- Likely: Wrong action type, invalid state for transition, or scene changed again later

**Fix Checklist:**

```javascript
// ✅ Are you using the right action?
// START_GIG → PRE_GIG (correct)
state = applyAction(state, ActionTypes.START_GIG, venue)
assert.equal(state.currentScene, GAME_PHASES.PRE_GIG)

// ✅ Is the precondition correct?
// START_GIGrequires currentScene === OVERWORLD (usually)
state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.OVERWORLD)
state = applyAction(state, ActionTypes.START_GIG, venue)

// ✅ Did you accidentally change scene again?
state = applyAction(state, ActionTypes.START_GIG, venue)
// ...later...
state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.GIG) // ← overwrites
assert.equal(state.currentScene, GAME_PHASES.PRE_GIG) // ✗ Fails

// ✅ Is the reducer bugged?
// Check gameReducer.js for CHANGE_SCENE handler
```

**Prevention:**
Use intermediate assertions to track state changes:

```javascript
await t.test('START_GIG transitions correctly', () => {
  state = applyAction(state, ActionTypes.CHANGE_SCENE, GAME_PHASES.OVERWORLD)
  assert.equal(
    state.currentScene,
    GAME_PHASES.OVERWORLD,
    'Precondition: in OVERWORLD'
  )

  state = applyAction(state, ActionTypes.START_GIG, venue)
  assert.equal(
    state.currentScene,
    GAME_PHASES.PRE_GIG,
    'START_GIG transitions to PRE_GIG'
  )

  // Don't accidentally change scene
  assert.equal(
    state.currentScene,
    GAME_PHASES.PRE_GIG,
    'Still in PRE_GIG after data updates'
  )
})
```

---

### Pattern 3: "assert.ok(state.band.harmony >= 1)"

**Symptom:**

```
AssertionError [ERR_ASSERTION]: 0 >= 1
```

**Diagnosis:**

- Boundary check failed
- Likely: A large negative delta wasn't clamped by the reducer

**Fix Checklist:**

```javascript
// ✅ Is the action using a clamping reducer?
// UPDATE_BAND → clamps [1, 100]
// APPLY_EVENT_DELTA → clamps [1, 100]
state = gameReducer(state, {
  type: ActionTypes.APPLY_EVENT_DELTA,
  payload: { band: { harmony: -500 } }
})
assert.ok(state.band.harmony >= 1, 'Clamped to minimum 1')

// ✅ Did you use the wrong action?
// Direct state mutation (never do this)
// state.band.harmony = -50  // ✗ Wrong!
// Use an action instead:
state = applyAction(state, ActionTypes.UPDATE_BAND, { harmony: 1 })

// ✅ Check the reducer code
// In gameReducer.js, search for "APPLY_EVENT_DELTA" or "UPDATE_BAND"
// Verify the clamping logic exists
```

**Prevention:**
Add inline clamping helpers:

```javascript
// Define a helper
const clampHarmony = value => Math.min(100, Math.max(1, value))

// Use in precondition
const targetHarmony = clampHarmony(-50)
state = applyAction(state, ActionTypes.UPDATE_BAND, { harmony: targetHarmony })
assert.equal(state.band.harmony, 1, 'Clamped to 1')
```

---

### Pattern 4: "Test file won't run: import error"

**Symptom:**

```
Error: Cannot find module '../../src/context/gameReducer.js'
```

**Diagnosis:**

- Path is wrong
- File doesn't exist
- File was moved or renamed

**Fix Checklist:**

```javascript
// ✅ Check the path relative to the test file
// If test file is: tests/golden-path/travel.test.js
// And reducer is:   src/context/gameReducer.js
// Then import:      ../../src/context/gameReducer.js
//           (../)   (up to tests/)
//           (../)   (up to root)
//           src/... (down to reducer)

// ✅ Verify the file exists
// From repo root:
ls src/context/gameReducer.js

// ✅ Check for typos
// ❌ gameReducer.js
// ✅ gameReducer.js
```

**Prevention:**
Use a consistent import pattern:

```javascript
// At the top of each test file, document the structure
// tests/golden-path/[name].test.js
//   ../../src/context/gameReducer.js
//   ../../src/context/initialState.js
//   ../../src/context/gameConstants.js

import { gameReducer, ActionTypes } from '../../src/context/gameReducer.js'
import { createInitialState } from '../../src/context/initialState.js'
import { GAME_PHASES } from '../../src/context/gameConstants.js'
```

---

### Pattern 5: "State is undefined after action"

**Symptom:**

```
TypeError: Cannot read property 'player' of undefined
  at [test-line]
```

**Diagnosis:**

- `applyAction()` or `gameReducer()` returned `undefined`
- Likely: The reducer function has a bug or isn't returning state

**Fix Checklist:**

```javascript
// ✅ Is applyAction() defined correctly?
const applyAction = (state, type, payload) =>
  gameReducer(state, { type, payload })

// ✅ Are you calling it correctly?
state = applyAction(state, ActionTypes.START_GIGocal, venue) // ← passes state back
assert.ok(state, 'State returned')

// ✅ Is the reducer bugged?
// In gameReducer.js, verify:
// - The reducer returns state in all branches
// - No missing "return" statement
// Example bug:
function gameReducer(state, action) {
  switch (action.type) {
    case 'UPDATE_PLAYER':
      // ✗ BUG: no return
      return { ...state, player: { ...state.player, money: 100 } }
    default:
    // ✗ BUG: missing return
  }
}
```

**Prevention:**
Add a safety check:

```javascript
await t.test('Action returns state', () => {
  let state = createInitialState()
  assert.ok(state, 'Initial state exists')

  state = applyAction(state, ActionTypes.ADVANCE_DAY)
  assert.ok(state, 'State returned from action')
  assert.ok(state.player, 'Player object exists')
  assert.ok(state.band, 'Band object exists')
})
```

---

### Pattern 6: "Assertion passes alone, fails in sequence"

**Symptom:**

```
✓ Test A passes in isolation
✓ Test B passes in isolation
✗ Test A → Test B fails (Test B assertion fails)
```

**Diagnosis:**

- State from Test A is affecting Test B
- Likely: Tests share state, or preconditions aren't isolated

**Fix Checklist:**

```javascript
// ✅ Each subtest should reset preconditions
test('Golden Path: Full cycle', async t => {
  let state = createInitialState() // ← Once at top

  await t.test('Step 1: Travel', () => {
    // ✗ DON'T reset state here
    state = applyAction(state, ActionTypes.UPDATE_PLAYER, { money: 450 })
    assert.equal(state.player.money, 450)
  })

  await t.test('Step 2: Day advance', () => {
    // ✓ DO rely on state from Step 1
    const moneyBefore = state.player.money
    state = gameReducer(state, { type: ActionTypes.ADVANCE_DAY })
    assert.ok(
      state.player.money < moneyBefore,
      'Daily cost applied to current state'
    )
  })
})

// ✅ If tests are INDEPENDENT (not a sequence), isolate state
test('Travel costs fuel', async t => {
  let state = createInitialState()
  state = applyAction(state, ActionTypes.UPDATE_PLAYER, {
    van: { ...state.player.van, fuel: 100 }
  })
  assert.equal(state.player.van.fuel, 100)
})

test('Day advance costs money', async t => {
  let state = createInitialState() // ← Fresh state for this test
  const moneyBefore = state.player.money
  state = gameReducer(state, { type: ActionTypes.ADVANCE_DAY })
  assert.ok(state.player.money < moneyBefore)
})
```

**Prevention:**

- Use **nested subtests** (`await t.test()`) for sequences
- Use **separate test blocks** for independent tests
- Document whether tests share state or are isolated

---

## Running Tests to Debug

### Run a Single Test File

```bash
pnpm run test -- tests/golden-path/travel.test.js
```

### Run a Single Test by Name

```bash
pnpm run test -- tests/goldenPath.test.js --grep "Travel costs fuel"
```

### Add Debug Logging

```javascript
await t.test('Travel deducts money', () => {
  console.log('BEFORE:', {
    money: state.player.money,
    fuel: state.player.van.fuel
  })
  state = applyAction(state, ActionTypes.UPDATE_PLAYER, { money: 450 })
  console.log('AFTER:', {
    money: state.player.money,
    fuel: state.player.van.fuel
  })
  assert.equal(state.player.money, 450)
})
```

Then run with output:

```bash
pnpm run test -- tests/golden-path/travel.test.js 2>&1 | grep -A5 "BEFORE"
```

### Compare with Working Tests

The project has extensive golden path tests in `tests/goldenPath.test.js` (630+ lines).

Use them as a reference:

1. Find a similar test that works
2. Compare structure, assertions, and action sequences
3. Identify differences
4. Apply fixes to your test

## Checklist Before Submitting

- [ ] All assertions have clear error messages
- [ ] Preconditions are explicitly set
- [ ] No state mutations outside of `applyAction()` or `gameReducer()`
- [ ] All imports resolve (no "cannot find module" errors)
- [ ] Boundaries are checked (money ≥ 0, harmony ∈ [1,100], fuel ∈ [0,100])
- [ ] Scene transitions are valid (check GAME_PHASES)
- [ ] Independent tests reset state; sequences share state intentionally
- [ ] Test runs locally: `pnpm run test -- tests/golden-path/[name].test.js`
