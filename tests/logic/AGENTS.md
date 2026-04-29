# tests/logic - Agent Instructions

## Scope

Applies to `tests/logic/**`.

## Rules

- Keep logic tests pure, deterministic, and free of DOM wiring unless strictly required.
- Use narrowly scoped fixtures and explicit state-transition assertions.
- Prefer table-driven assertions for clamp and bounds behavior.

## Gotchas

- Reducer tests should assert result values and immutability of untouched branches.
- If integration suites already cover behavior, keep only contract-level logic assertions here.
