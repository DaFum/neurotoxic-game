# tests/context/reducers — Agent Instructions

## Scope

Applies to `tests/context/reducers/**`.

## Test Responsibilities

- Exercise reducer behavior through realistic action payloads and persisted-state edge cases.
- Prefer explicit assertions for clamping, sanitization, and migration behavior.

## TypeScript Notes

- Keep action payload fixtures aligned with discriminated union shapes from action creators.
- For untrusted payload tests, include malformed/hostile shapes and assert whitelist behavior.

## Gotchas

- Cover backward-compatibility paths for loaded saves (legacy venue/settings/unlocks formats).
- When adding reducer branches, ensure exhaustive-case coverage in tests mirrors reducer expectations.
