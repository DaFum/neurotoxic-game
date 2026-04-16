# src/hooks — Agent Instructions

## Scope
Applies to `src/hooks/**`.

## Hook Rules
- Keep hooks focused on orchestration/state derivation; avoid embedding heavy rendering concerns.
- Include `t` in dependency arrays when translations are used inside callbacks/effects.
- Route state mutations through context action creators.

## Domain Gotchas
- `useArrivalLogic` owns arrival routing decisions.
- Minigame hooks (`useTourbusLogic`, `useRoadieLogic`) must not import PIXI directly.

## Migration Rules
- Remove `@ts-nocheck` per feature slice and validate with the matching test runner for neighboring tests.
