# src/schemas — Agent Instructions

## Scope

Applies to `src/schemas/**`.

## Schema Rules

- Keep schemas as the source of truth for validation/shape guarantees.
- Changes to schema constraints must preserve compatibility with existing saves/tests unless explicitly migrated.
- Avoid embedding app logic in schema modules; keep them declarative.

## Migration Rules

- When updating schema typing, ensure consuming validators and tests remain in sync.

## Nested TypeScript Hinweise

- Schema-Änderungen sind Contract-Änderungen: zugehörige Typen und Validierungs-Tests zusammen aktualisieren.
- Bei optionalen Feldern nullish-sicher modellieren (`??`), damit `0`/`''` als gültige Werte erhalten bleiben.
