# src/types — Agent Instructions

## Scope

Applies to `src/types/**`.

## Type Modeling Rules

- Prefer shared domain contracts over duplicating inline structural types across modules.
- Keep declaration files aligned with runtime data shapes in `src/context`, `src/data`, and `src/utils/audio`.
- Favor additive, backward-compatible typing during migration.

## Migration Rules

- Tighten action/state/audio contracts first; then remove downstream `@ts-nocheck` consumers in dependent modules.
