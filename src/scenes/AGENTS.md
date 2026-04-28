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
- For minigames that auto-finalize on timer expiry, scene-level completion handlers should trigger scene transitions only; completion payload submission must remain in the hook finalize path.

## Migration Rules

- Convert scene typing incrementally, validating each scene cluster with targeted UI tests.

## Nested TypeScript Notes

- Scene transitions should use central constants/unions (not ad-hoc string literals) to preserve reducer safety.
- Avoid duplicating `GameState`-like scene-local shapes; import shared contracts from `src/types`.
- When scene payload contracts change, update related action creators and scene tests together.

## Recent Findings (2026-04)

- Scene modules should not keep dormant modal branches: either wire a reachable trigger or remove the render path and related hook usage together.
- Kabelsalat routing guardrails now live in `src/scenes/kabelsalat/AGENTS.md`; preserve both timeout-loss and fully-wired win transitions to `GAME_PHASES.GIG` when refactoring scene/hook boundaries.
