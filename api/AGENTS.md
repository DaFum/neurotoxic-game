# api — Agent Instructions

## Scope
Applies to `api/**`.

## API Rules
- Keep endpoints backward compatible with current client contracts unless versioned changes are introduced.
- Validate request payload assumptions explicitly and keep response shapes stable for tests.
- Avoid introducing hidden side effects in route handlers.

## Migration Rules
- TS migration changes in API files should be behavior-preserving and accompanied by updated API tests.

## TypeScript Gotcha: Interface ↔ PropTypes Sync

- If a React component exposes both a TypeScript props interface and `propTypes`, keep optional/required fields in strict sync in the same PR.
- Example: if `controllerFactory?: ...` in `src/types/components.d.ts`, then the runtime contract must be `PropTypes.func` (not `PropTypes.func.isRequired`) in `src/components/MinigameSceneFrame.tsx`.

