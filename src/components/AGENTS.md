# src/components — Agent Instructions

## Scope
Applies to `src/components/**`.

## UI Rules
- Use design tokens/CSS variables for styling; do not hardcode theme colors.
- Keep Tailwind usage v4-compatible.
- Keep text translatable via i18n keys/components.

## React Rules
- React 19: pass `ref` as standard prop; do not introduce `React.forwardRef()`.
- Keep components presentational where possible; push game-state mutations into hooks/context actions.

## Migration Rules
- Remove `@ts-nocheck` incrementally and avoid behavior + typing refactors in the same PR where possible.
