# tests/golden-path - Agent Instructions

## Scope

Applies to `tests/golden-path/**` and overrides `tests/AGENTS.md` where it conflicts.

## Rules

- Use `node:test` + `node:assert/strict`; drive the real `gameReducer` and real action creators end-to-end. Do not stub reducers, action creators, or `createInitialState`.
- Exercise full INTRO → MENU → OVERWORLD → PREGIG → GIG → POSTGIG cycles (and GAMEOVER paths); single-action coverage belongs in `tests/reducers/**` or `tests/context/reducers/**`.
- Build venues and other fixtures with canonical keys (`id`, `capacity`, `price`, `pay`, `dist`, `diff`); `currentGig` is the venue object — assert `state.currentGig?.capacity`, never `state.currentGig?.venue`.
- Assert resource bounds (money, harmony, fuel, van condition) survive across multiple cycles; clamps are the contract under test.
