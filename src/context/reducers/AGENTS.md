# src/context/reducers - Agent Instructions

## Scope

Applies to `src/context/reducers/**`.

## Rules

- Reducers apply already-sanitized action payloads and must not duplicate action-creator clamps.
- Keep exhaustive handling with `assertNever(action)` in default branches.
- Whitelist persisted or loaded payload fields before constructing state.
- Preserve immutability of untouched branches in reducer tests.

## Gotchas

- Loaded save compatibility must cover legacy venue, settings, and unlock formats.
- Reducer typing regressions should fail `pnpm run typecheck`; whole-project issues belong to `pnpm run typecheck:core`.
