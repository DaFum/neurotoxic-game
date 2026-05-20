# tests/golden-path - Agent Instructions

- Use `node:test` + `node:assert/strict`; drive the real `gameReducer` and real action creators end-to-end. Do not stub reducers, action creators, or `createInitialState`.
- Exercise full INTRO → MENU → OVERWORLD → PREGIG → GIG → POSTGIG cycles (and GAMEOVER paths). Single-action coverage belongs in `tests/reducers/**` or `tests/context/reducers/**`.
- Build venues with canonical keys (`id`, `capacity`, `price`, `pay`, `dist`, `diff`); `currentGig` is the venue object — assert `state.currentGig?.capacity`, never `state.currentGig?.venue`.
- Assert resource bounds (money, harmony, fuel, van condition) survive across multiple cycles; clamps are the contract under test.
