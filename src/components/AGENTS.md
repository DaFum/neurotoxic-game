# src/components - Agent Instructions

## Minigames

- Keep Pixi-dependent renderer/controller code (imports from `pixi.js`, Pixi classes, textures, sprites, and stage managers) out of React hook layers. Hooks should expose reactive state and callbacks only.
- The DEV-only `Shift+P` backdoor in `MinigameSceneFrame` must resolve the active minigame type from canonical reducer state (`useGameSelector(state => state.minigame?.type)`), never from the `window.gameState` debug global. Prefer `logic.finishMinigame()` when the minigame logic exposes it.

## State Slices

- Components consuming wide state slices (e.g. `ChatterOverlay`) must read fields via `useGameSelector` and pass a `useMemo`-wrapped prop object containing only those fields. Passing the full root `gameState` re-renders unrelated consumers whenever any game state field changes.
