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
