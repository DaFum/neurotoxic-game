# tests/logic — Agent Instructions

## Scope

Applies to `tests/logic/**`.

## Test Responsibilities

- Keep logic tests pure and deterministic (no DOM wiring unless strictly required).
- Use narrowly-scoped fixtures per reducer/logic unit and assert state transitions explicitly.

## Domain Gotchas

- Prefer table-driven assertions for clamp/bounds behavior to reduce repetitive test bodies.
- For reducer tests, assert both result values and immutability of untouched branches.
- If behavior is already covered by integration suites, only keep contract-level logic assertions here.

## Recent Findings (2026-04)

- Fast feedback improves when logic suites avoid shared heavyweight setup and keep fixtures minimal.
