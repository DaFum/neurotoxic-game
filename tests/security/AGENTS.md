# tests/security - Agent Instructions

## Scope

Applies to `tests/security/**`.

## Rules

- Keep this folder focused on hostile-input behavior and boundary hardening.
- Assert malformed payloads are rejected before state mutation.
- API hardening tests should assert both status code and stable error shape.

## Gotchas

- Prototype-pollution probes must include `__proto__`, `constructor`, and `prototype` at nested object/array levels.
- Use raw JSON strings for `__proto__` probes so hostile keys are actually serialized.
- Happy-path duplicate checks belong in core unit suites, not security tests.
