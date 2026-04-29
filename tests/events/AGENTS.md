# tests/events - Agent Instructions

## Agent purpose

Agents operating on `tests/events/**` simulate event-driven behavior, validate event payloads, and run lightweight deterministic flows. They must not call external networks, depend on broad production data beyond targeted fixtures, or rely on nondeterministic timing without explicit tolerances. Use these instructions for event contract tests, such as validating a new event's trigger/category/options; do not use them for reducer math or full integration flows.

## Scope

Applies to `tests/events/**`.

## Rules

- Validate event pool contracts: required fields, trigger/category consistency, option structure, and i18n keys.
- Keep condition tests deterministic and data-focused.
- Verify both truthy and falsy condition branches.

## Gotchas

- Do not re-test reducer math here; reducer/application semantics belong in node reducer or engine suites.
