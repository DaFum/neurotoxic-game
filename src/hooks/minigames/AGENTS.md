# src/hooks/minigames - Agent Instructions

## Scope

Applies to `src/hooks/minigames/**`.

## Rules

- Do not import Pixi into minigame hooks; return reactive state and callbacks only.
- Keep completion timers cancellable and cleaned up on unmount.
- Preserve fallback auto-advance and manual overlay continuation paths.
- Route travel completion through the shared minigame/arrival flow.

## Gotchas

- `COMPLETE_TRAVEL_MINIGAME` must not change scene directly.
- Tourbus completion payload damage is raw minigame damage; van condition loss is derived later at 50% scaling by `calculateTravelMinigameResult()`.
- StrictMode replay can rerun effects; guard one-shot completion handlers.
- Tourbus obstacle generation has three types — `FUEL`, `OBSTACLE`, `VOID_HAZARD` — and `VOID_HAZARD` spawns at ~10%; the reducer applies `voidHazardHits * 10` as a band stamina penalty in `minigameReducer`. Adding obstacle types requires updating both the producer (`useTourbusLogic`) and consumer (`minigameReducer`, `TourbusObstacleManager`) together.
