# src/hooks/minigames - Agent Instructions

- Do not import Pixi into minigame hooks; return reactive state and callbacks only.
- Minigame completion actions (`COMPLETE_TRAVEL_MINIGAME`, `COMPLETE_AMP_CALIBRATION`, `COMPLETE_KABELSALAT_MINIGAME`, `COMPLETE_ROADIE_MINIGAME`) must not change `currentScene`; `useArrivalLogic` or explicit scene callbacks own routing.
- Tourbus completion payload damage is raw minigame damage; van condition loss is derived at 50% scaling by `calculateTravelMinigameResult()`.
- StrictMode replays effects — guard one-shot completion handlers.
- Tourbus obstacle types are `FUEL`, `OBSTACLE`, `VOID_HAZARD` (~10% spawn). `minigameReducer` applies `voidHazardHits * 10` as a band stamina penalty. Adding obstacle types requires updating producer (`useTourbusLogic`) and consumer (`minigameReducer`, `TourbusObstacleManager`) together.
- Time-delta-based probabilities (e.g. `0.02 * (deltaMS / 100)` in `useAmpLogic.ts`) must clamp with `Math.max(0, Math.min(1, …))` before passing to `getSafeRandom()`. A negative `deltaMS` from a paused-tab resume produces a negative probability and skews RNG comparisons. `Math.min(1, …)` alone is insufficient.
