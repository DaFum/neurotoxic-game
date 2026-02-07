---
name: state-safety-action-creator-guard
description: Review or refactor state updates to enforce invariants (money >= 0, harmony > 0) and prefer action creators/ActionTypes. Use when reviewing PRs for state safety or adjusting reducers/hooks.
---

# Enforce State Safety and Action Creators

## Key Files

- `src/context/actionCreators.js` — canonical action creators (use these, not raw dispatch)
- `src/context/gameReducer.js` — reducer with balance clamps and state transitions
- `src/context/initialState.js` — default state shape and initial values
- `src/context/GameState.jsx` — context provider and `useGameState` hook
- `src/utils/eventEngine.js` — `processEffect` and `applyResult` produce state deltas
- `src/utils/economyEngine.js` — economy calculations that feed into state
- `src/utils/gameStateUtils.js` — state utility helpers
- `tests/actionCreators.test.js` — action creator tests
- `tests/gameReducer.test.js` — reducer tests including clamp assertions

## Workflow

1. Grep for raw `dispatch({type:` calls — these should use action creators from `actionCreators.js` instead.
2. Review `gameReducer.js` for every `case` that modifies `player.money` or `band.harmony` — confirm clamps at 0.
3. Check `eventEngine.js` `processEffect` for stat effects that could produce invalid state.
4. Verify `initialState.js` defaults are valid (money >= 0, harmony > 0).
5. Add/adjust unit tests in `tests/gameReducer.test.js` and `tests/actionCreators.test.js` to cover negative-value clamps.

## Output

- Provide a short list of violations and fixes.
- Update tests for any behavior change.

## Related Skills

- `game-balancing-assistant` — for tuning the values that state safety guards
- `refactor-with-safety` — when restructuring state management code
