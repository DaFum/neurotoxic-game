# src/schemas — Agent Instructions

## Scope

Applies to `src/schemas/**`.

## Schema Rules

- Keep schemas as the source of truth for validation/shape guarantees.
- Changes to schema constraints must preserve compatibility with existing saves/tests unless explicitly migrated.
- Avoid embedding app logic in schema modules; keep them declarative.

## Migration Rules

- When updating schema typing, ensure consuming validators and tests remain in sync.

## Nested TypeScript Notes

- Treat schema files as contract sources: when a schema changes, update inferred/declared TypeScript types and validator tests in the same PR.
- Preserve nullish semantics in optional schema fields (`??` patterns) so valid falsy values are not lost.
- Keep schema helpers declarative and strongly typed; avoid embedding app-level side effects in schema modules.


## Domain Gotchas

- Keep changes in this scope aligned with upstream root and parent AGENTS constraints; avoid duplicating guidance already covered by adjacent scopes.
- When behavior contracts change here, update the closest tests/consumers in the same PR to keep scope boundaries trustworthy.

## Recent Findings (2026-04)

- Treat UI reachability changes as potential schema-impacting events when persisted flags exist; stale flags should be either migrated or removed intentionally.
