# src/components/minigames/tourbus - Agent Instructions

- Completion stats must display the condition loss returned by `calculateTravelMinigameResult()` (50% scaling of damage). Do not show raw `100 - damage` as van condition.
- Treat route/location IDs as canonical venue IDs; include legacy venue cases in tests when travel semantics change.
- The `rock`, `barrier`, and `fuel` obstacle sprite URLs in `TourbusStageController.ts` must stay `null` when offline (or generation is disabled). `TourbusObstacleManager` falls back to distinctly colored Pixi `Graphics` shapes; substituting the shared offline fallback SVG makes all three obstacle types render identically and unreadably.
