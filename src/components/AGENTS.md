# src/components - Agent Instructions

## Gotchas

- Minigame components must not import Pixi-only logic into hook layers.
- Components consuming wide state slices (e.g. `ChatterOverlay`) must read via `useGameSelector` and a `useMemo`-wrapped prop slice; passing the full `gameState` causes global re-render thrash and is a recurring perf regression.
