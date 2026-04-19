# src/assets — Agent Instructions

## Scope

Applies to `src/assets/**`.

## Asset Rules

- Keep asset references stable and consistent with loaders/import maps.
- Do not change asset naming/paths casually; test fixtures and loaders may depend on exact paths.
- Prefer additive asset updates over replacing/removing existing files in migration PRs.

## Migration Rules

- If asset path conventions change, update all loaders/tests in the same PR.

## TypeScript Gotcha: Interface ↔ PropTypes Sync

- If a React component exposes both a TypeScript props interface and `propTypes`, keep optional/required fields in strict sync in the same PR.
- Example: if `controllerFactory?: ...` in `src/types/components.d.ts`, then the runtime contract must be `PropTypes.func` (not `PropTypes.func.isRequired`) in `src/components/MinigameSceneFrame.tsx`.

