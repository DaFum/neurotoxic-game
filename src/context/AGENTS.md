# AGENTS.md — `src/context/`

Scope: Applies to all files in `src/context/`.

## Purpose

`src/context/` is the authoritative global state layer:

- `initialState.js` — default slices + `createInitialState()`
- `gameReducer.js` — canonical state transition logic (`ActionTypes`)
- `actionCreators.js` — typed/centralized action factories
- `GameState.jsx` — provider, action wrappers, orchestration (map init, save/load, event flow)

## Code-Aligned State & Flow Rules

1. Money safety: reducer and event-delta paths share `clampPlayerMoney` for `player.money >= 0`.
2. Harmony safety: reducer and event-delta paths share `clampBandHarmony` for `band.harmony` in `1..100`.
3. Scene safety: load path sanitizes scene against allowed scene values.
4. Save safety: persisted payloads must pass `validateSaveData` before state restore.
5. Inventory safety: `applyInventoryItemDelta` is the canonical inventory mutator; numeric inventory deltas clamp at minimum `0` and boolean ownership flags are applied explicitly.
6. Gig flow contract: `START_GIG` transitions to `PREGIG`; gig completion paths persist stats then route to `POSTGIG`.

## Editing Rules

1. Keep reducer updates immutable and deterministic.
2. If adding/changing action behavior, update **all three**:
   - `ActionTypes`
   - reducer case handling
   - `actionCreators.js`
3. Keep side effects (storage/audio/event orchestration) in `GameState.jsx` or hooks, not in reducer/data files.
4. Preserve backwards compatibility for existing saves unless an explicit migration path is introduced.
5. Keep error handling safe: no sensitive data in logs/storage error surfaces.


## State Safety Guard (Code-Aligned)

- Shared guardrail helpers live in `src/utils/gameStateUtils.js` and are the single source of truth for money/harmony/inventory clamping.
- `applyInventoryItemDelta` enforces inventory invariants (numeric stacks never below `0`; boolean item flags are explicit true/false ownership toggles).
- Action creators and reducer cases must call canonical helpers instead of mutating inventory fields directly.
- `delta.flags` is for queue/flag orchestration only; it must not write gameplay stats directly or bypass inventory clamps (for example `flags.score` is unsupported by design).
- If you add new mutable state, update action creators and reducer cases together to avoid bypassing guardrails.

## Validation & Test Targets

When this scope changes, verify at minimum:

- `tests/actionCreators.test.js`
- `tests/gameReducer.test.js`
- `tests/goldenPath.test.js`

Then run:

```bash
npm run lint
npm run test
npm run build
```

_Last updated: 2026-02-19._
