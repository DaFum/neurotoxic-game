# tests/context/reducers — Agent Instructions

## Scope

Applies to `tests/context/reducers/**`.

## Test Responsibilities

- Exercise reducer behavior through realistic action payloads and persisted-state edge cases.
- Prefer explicit assertions for clamping, sanitization, and migration behavior.

## TypeScript Notes

- Keep action payload fixtures aligned with discriminated union shapes from action creators.
- For untrusted payload tests, include malformed/hostile shapes and assert whitelist behavior.

## Domain Gotchas

- Cover backward-compatibility paths for loaded saves (legacy venue/settings/unlocks formats).
- When adding reducer branches, ensure exhaustive-case coverage in tests mirrors reducer expectations.

## Recent Findings (2026-04)

- When restoring previously removed UI actions, confirm reducer tests still cover the corresponding action payload path to guard against partial reintroduction.
