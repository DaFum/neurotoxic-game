# tests/security — Agent Instructions

## Scope

Applies to `tests/security/**`.

## Test Responsibilities

- Keep this folder focused on hostile-input behavior and boundary hardening.
- Prefer assertions that prove malformed payloads are rejected before state mutation.
- Avoid duplicating happy-path unit behavior already covered in `tests/node/**`.

## Domain Gotchas

- Prototype-pollution probes must include `__proto__`, `constructor`, and `prototype` keys at nested levels (objects and arrays).
- Security tests for storage helpers should prioritize sanitation and rejection paths; duplicate/primitive checks belong in the core unit suite.
- When testing APIs, assert both status code and stable error shape so hardening regressions are visible.

## Recent Findings (2026-04)

- Security overlap with unit suites tends to creep in around unlock/storage helpers; keep this domain adversarial-only.
- `unlocksValidation` should assert hostile payload hardening (polluted storage, malformed JSON, non-string attacks) and leave duplicate/happy-path checks to `tests/node/unlockManager.test.js`.
