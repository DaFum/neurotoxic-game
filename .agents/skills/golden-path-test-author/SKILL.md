---
name: golden-path-test-author
description: Author or update integration tests for the critical game flow (menu -> overworld -> gig -> postgig). Use when asked to add regression coverage for key paths.
---

# Golden Path Test Author

## Critical Game Flow

MainMenu → Overworld → PreGig → Gig (rhythm game) → PostGig → (loop or GameOver)

## Key Files

- `src/scenes/MainMenu.jsx` → `src/scenes/Overworld.jsx` → `src/scenes/PreGig.jsx` → `src/scenes/Gig.jsx` → `src/scenes/PostGig.jsx`
- `src/scenes/GameOver.jsx` — end state
- `src/context/gameReducer.js` — state transitions driven by `ADVANCE_DAY`, `APPLY_EVENT_DELTA`, etc.
- `src/context/actionCreators.js` — action creators for state changes
- `src/context/initialState.js` — starting state for test setup
- `tests/` — existing tests use `node:test` + `node:assert/strict`

## Workflow

1. Identify the critical flow: MainMenu → Overworld → PreGig → Gig → PostGig.
2. Set up test state using `initialState.js` and action creators.
3. Write tests using `node:test` and `node:assert/strict` (the project's test framework).
4. Keep tests deterministic — mock randomness in `eventEngine.js` and `mapGenerator.js`.
5. Focus on state transitions: verify reducer handles each scene transition correctly.
6. Run `npm run test` and report results.

## Output

- Provide test files in `tests/` and brief rationale for each test case.

## Related Skills

- `state-safety-action-creator-guard` — ensures state invariants hold across the golden path
- `game-balancing-assistant` — balance changes need golden path regression tests
