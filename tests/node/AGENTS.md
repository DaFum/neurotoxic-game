# tests/node — Agent Instructions

## Scope

Applies to `tests/node/**`.

## Test Responsibilities

- Prefer focused `node:test` suites for reducer/state-machine regressions.
- Keep fixtures representative of sanitized runtime shapes.
- Use `test:node:quick` for non-heavy local loops and `test:node:heavy` when touching Pixi/render-heavy node suites.

## TypeScript/CheckJS Notes

- Explicitly model typed fixtures when testing strict CheckJS paths (especially optional nested fields).
- Add regression tests when state persistence semantics change (settings/unlocks/location).

## Gotchas

- When asserting travel/location behavior, include legacy and canonical venue ID cases.
- When asserting load/reset behavior, verify whitelist sanitization instead of raw spread assumptions.
- Avoid parallel suites that only repeat callback-reference stability checks; colocate them with the main hook behavior suite to reduce per-file JSDOM/setup cost.
- Keep `songsData.test.js` focused on transform edge-cases with fixtures; keep `songs-real.test.js` focused on production dataset contracts.
- For wide effect matrices (for example `percentage_resource`), prefer table-driven cases instead of many near-identical tests.

## Recent Findings (2026-04)

- Add reducer-level coverage when a feature can become unreachable from UI; this separates state contract validity from scene wiring regressions.
- Large node runtime spikes frequently come from Pixi-heavy or repeated hook setup suites; prefer consolidated tests and isolate heavy suites when possible.
- Heavy split runs should remain optional acceleration only; `test:all` must continue to exercise both quick and heavy node coverage.
- Node test setup now seeds logger level to WARN when unset; avoid tests that depend on DEBUG-by-default console noise.
