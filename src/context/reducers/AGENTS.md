# src/context/reducers - Agent Instructions

## Scope

Applies to `src/context/reducers/**`.

## Rules

- Reducers may receive payloads that were already sanitized by action creators, but they must still protect final state invariants.
- Use canonical clamp helpers from `gameStateUtils` when writing bounded values into state, especially when the reducer computes next state from previous state plus a delta, reward, cost, or functional update.
- Do not remove a reducer clamp merely because the action creator normalizes the incoming payload. Action-creator sanitation protects payload shape; reducer clamps protect stored state.
- Avoid redundant no-op payload normalization in reducers when the action creator can validate the raw field once, but keep terminal state clamps where bounded state is produced.
- Keep exhaustive handling with `assertNever(action)` in default branches.
- Whitelist persisted or loaded payload fields before constructing state.
- Preserve immutability of untouched branches in reducer tests.

## Gotchas

- Loaded save compatibility must cover legacy venue, settings, and unlock formats.
- Reducer typing regressions should fail `pnpm run typecheck`; whole-project issues belong to `pnpm run typecheck:core`.
