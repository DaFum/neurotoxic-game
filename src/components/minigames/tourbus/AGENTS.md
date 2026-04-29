# src/components/minigames/tourbus - Agent Instructions

## Scope

Applies to `src/components/minigames/tourbus/**`.

## Rules

- Keep Tourbus hook logic free of Pixi imports and renderer-only state.
- Preserve travel completion handoff through `useArrivalLogic` and shared minigame callbacks.

## Gotchas

- Treat route/location IDs as canonical venue IDs; include legacy venue cases in tests when travel semantics change.
