# tests/events - Agent Instructions

## Scope

Applies to `tests/events/**`.

## Rules

- Validate event pool contracts: required fields, trigger/category consistency, option structure, and i18n keys.
- Keep condition tests deterministic and data-focused.
- Verify both truthy and falsy condition branches.

## Gotchas

- Do not re-test reducer math here; reducer/application semantics belong in node reducer or engine suites.
