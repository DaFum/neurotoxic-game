# tests/logic - Agent Instructions

## Agent Role and Limitations

- Agents for `tests/logic/**` help keep pure logic tests deterministic, focused, and fixture-driven.
- They are not a source of truth for product behavior, must not use network access, and must treat nondeterministic outputs as invalid unless explicitly controlled.
- Rely on this guide for contract-level logic assertions; write custom test logic when behavior spans DOM, integration, or reducer orchestration.

## Scope

Applies to `tests/logic/**`.

## Rules

- Keep logic tests pure, deterministic, and free of DOM wiring unless strictly required.
- Use narrowly scoped fixtures and explicit state-transition assertions.
- Prefer table-driven assertions for clamp and bounds behavior.

## Gotchas

- Reducer tests should assert result values and immutability of untouched branches.
- If integration suites already cover behavior, keep only contract-level logic assertions here.
