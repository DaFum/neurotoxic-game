# tests/events — Agent Instructions

## Scope

Applies to `tests/events/**`.

## Test Responsibilities

- Validate event pool contracts (required fields, trigger/category consistency, option structure).
- Keep event-condition tests deterministic and data-focused.

## Domain Gotchas

- Event `condition` coverage should verify both truthy and falsy branches without relying on random selection flow.
- Contract assertions must protect namespaced i18n keys and option/effect schema validity.
- Avoid re-testing reducer math here; reducer/application semantics belong in node reducer or engine suites.

## Recent Findings (2026-04)

- Data-contract regressions are easiest to catch with small, explicit fixture assertions instead of large integration-style event tests.
