# tests/context/reducers - Agent Instructions

## Scope

Applies to `tests/context/reducers/**`.

## Rules

- Exercise reducers through realistic action payloads and persisted-state edge cases.
- Keep action payload fixtures aligned with action creator discriminated unions.
- Include malformed/hostile payloads for whitelist behavior.

## Gotchas

- Cover loaded-save compatibility for legacy venue, settings, and unlock formats.
- When adding reducer branches, add exhaustive-case coverage that mirrors reducer expectations.
