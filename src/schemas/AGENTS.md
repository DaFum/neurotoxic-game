# src/schemas — Agent Instructions

## Scope

Applies to `src/schemas/**`.

## Schema Rules

- Keep schemas as the source of truth for validation/shape guarantees.
- Changes to schema constraints must preserve compatibility with existing saves/tests unless explicitly migrated.
- Avoid embedding app logic in schema modules; keep them declarative.

## Migration Rules

- When updating schema typing, ensure consuming validators and tests remain in sync.

## TypeScript Gotcha: Interface ↔ PropTypes Sync

- If a React component exposes both a TypeScript props interface and `propTypes`, keep optional/required fields in strict sync in the same PR.
- Example: if `controllerFactory?: ...` in `src/types/components.d.ts`, then the runtime contract must be `PropTypes.func` (not `PropTypes.func.isRequired`) in `src/components/MinigameSceneFrame.tsx`.

