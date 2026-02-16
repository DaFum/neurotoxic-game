---
name: golden-path-test-author
description: Write integration tests for the main game loop (Golden Path). Trigger when asked to add regression tests, verify game flow, or check critical paths.
---

# Golden Path Test Author

Ensure the critical game flow (Start -> Overworld -> Gig -> Result) works without regression.

## Critical Path

1.  **MainMenu**: `START_GAME` -> Initializes state.
2.  **Overworld**: `TRAVEL` -> Updates fuel/money/day.
3.  **PreGig**: `START_GIG` -> Transitions to Rhythm Game.
4.  **Gig**: `COMPLETE_GIG` -> Calculates score.
5.  **PostGig**: `CONTINUE` -> Returns to Overworld.

## Workflow

1.  **Select the Transition**
    Identify which part of the loop to test.
    *   *Example*: "Verify travel deducts fuel and advances time."

2.  **Scaffold the Test**
    Use `node:test` and `node:assert`.
    *   Import `initialState` and `gameReducer`.
    *   Mock dependencies if testing components (but prefer pure reducer tests for logic).

3.  **Define Inputs & Expected Outputs**
    *   *Input*: State with 10 fuel. Action `TRAVEL`.
    *   *Expected*: State with 9 fuel. Location updated.

4.  **Implement Mocking**
    If testing components or effects:
    *   Mock `Math.random` for deterministic events.
    *   Mock `AudioContext` (it doesn't exist in Node).

## Example

**Input**: "Test that traveling costs fuel."

**Action**:
Create `tests/integration/travel.test.js`:
```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gameReducer } from '../../src/context/gameReducer.js';
import { initialState } from '../../src/context/initialState.js';

test('Travel deducts fuel', () => {
  const startState = { ...initialState, player: { ...initialState.player, fuel: 10 } };
  const action = { type: 'TRAVEL', payload: { cost: 1, destination: 'node_2' } };

  const newState = gameReducer(startState, action);

  assert.equal(newState.player.fuel, 9);
  assert.equal(newState.player.currentLocation, 'node_2');
});
```

**Output**:
"Created `tests/integration/travel.test.js` verifying fuel deduction logic."
