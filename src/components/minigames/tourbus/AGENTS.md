# src/components/minigames/tourbus - Agent Instructions

## Completion

- Completion stats must display `conditionLoss` returned by `calculateTravelMinigameResult()`. This is the scaled damage value (`Math.floor(Math.max(0, damage) / 2)`, so 100 damage means 50 condition loss), not raw `100 - damage` as van condition.
- Treat route/location IDs as canonical venue IDs; include legacy string forms such as `venues:club_toxic.name` and `venues:club_toxic` in tests when travel semantics change.

## Obstacles

- Offline or generation-disabled obstacle sprites:
  1. Keep the `rock`, `barrier`, and `fuel` sprite URLs in `TourbusStageController.ts` as `null`.
  2. Let `TourbusObstacleManager` use distinctly colored Pixi `Graphics` fallbacks.
  3. Do not substitute the shared offline fallback SVG, which makes all three obstacle types render identically and unreadably.
