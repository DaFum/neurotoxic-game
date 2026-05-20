# src/components/minigames/roadie - Agent Instructions

## Hook/Renderer Boundary

- Keep Roadie hook logic free of Pixi imports and imperative renderer state.

## Completion

- Preserve the Roadie handoff through `MinigameSceneFrame`'s `onComplete` callback (`RoadieRunScene.handleComplete` -> `changeScene(GIG)`).
- Timer cleanup must run on unmount and early completion so scenes cannot auto-advance after teardown.
