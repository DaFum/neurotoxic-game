# tests/node — Agent Instructions

## Scope

Applies to `tests/node/**`.

## Test Responsibilities

- Prefer focused `node:test` suites for reducer/state-machine regressions.
- Keep fixtures representative of sanitized runtime shapes.

## TypeScript/CheckJS Notes

- Explicitly model typed fixtures when testing strict CheckJS paths (especially optional nested fields).
- Add regression tests when state persistence semantics change (settings/unlocks/location).

## Gotchas

- When asserting travel/location behavior, include legacy and canonical venue ID cases.
- When asserting load/reset behavior, verify whitelist sanitization instead of raw spread assumptions.
