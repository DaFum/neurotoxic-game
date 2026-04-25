# src/context/reducers — Agent Instructions

## Scope

Applies to `src/context/reducers/**`.

## Reducer Responsibilities

- Reducers are deterministic state transformers; no hidden side effects or UI-only logic.
- For new actions, maintain full contract coherence across action types, creators, reducers, and tests.

## TypeScript Notes

- Keep discriminated union exhaustiveness (`assertNever`) intact when extending reducer action handling.
- Sanitize untrusted load/reset payloads via explicit whitelist construction, not generic object spread.
- Preserve serialized state compatibility unless a migration path is included in the same PR.

## Gotchas

- Travel/location fields are consumed by chatter, translation, and save migrations; update all readers/writers together.
- Settings and unlock persistence behavior is regression-sensitive; keep tests aligned with intended semantics.

## Recent Findings (2026-04)

- Reintroduced actions should be validated for no-op safety when feature flags/state preconditions are missing; reducers must remain deterministic.
