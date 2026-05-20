# src/components - Agent Instructions

## Minigames

- Keep Pixi-dependent renderer/controller code (imports from `pixi.js`, Pixi classes, textures, sprites, and stage managers) out of React hook layers. Hooks should expose reactive state and callbacks only.

## State Slices

- Components consuming wide state slices (e.g. `ChatterOverlay`) must read fields via `useGameSelector` and pass a `useMemo`-wrapped prop object containing only those fields. Passing the full root `gameState` re-renders unrelated consumers whenever any game state field changes.
