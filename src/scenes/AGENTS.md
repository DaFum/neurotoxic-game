# src/scenes — Agent Instructions

## Scope

Applies to `src/scenes/**`.

## Scene Rules

- Scenes should compose hooks/components; keep core mutation logic in hooks/context/reducers.
- All player-facing text must remain i18n-driven.
- Preserve scene transition contracts with `GameState` action flow.

## Domain Gotchas

- `START_GIG` resets gig modifiers.
- `COMPLETE_TRAVEL_MINIGAME` does not perform routing reset; arrival flow is handled by `useArrivalLogic`.

## Migration Rules

- Convert scene typing incrementally, validating each scene cluster with targeted UI tests.

## TypeScript Gotcha: Interface ↔ PropTypes Sync

- If a React component exposes both a TypeScript props interface and `propTypes`, keep optional/required fields in strict sync in the same PR.
- Example: if `controllerFactory?: ...` in `src/types/components.d.ts`, then the runtime contract must be `PropTypes.func` (not `PropTypes.func.isRequired`) in `src/components/MinigameSceneFrame.tsx`.

