# src/context/reducers - Agent Instructions

## Scope

Applies to `src/context/reducers/**`.

## Rules

- Reducers must ensure state validity by using canonical clamp functions from `gameStateUtils` for all bounded values. While action creators should sanitize payloads where possible, terminal reducers are the final authority for state integrity, especially for functional updates and raw deltas.
- Keep exhaustive handling with `assertNever(action)` in default branches.
- Whitelist persisted or loaded payload fields before constructing state.
- Preserve immutability of untouched branches in reducer tests.

## Gotchas

- Loaded save compatibility must cover legacy venue, settings, and unlock formats.
- Reducer typing regressions should fail `pnpm run typecheck`; whole-project issues belong to `pnpm run typecheck:core`.
