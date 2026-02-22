# AGENTS.md — `src/hooks/minigames/`

Scope: Applies to Minigame logic hooks (`useTourbusLogic.js`, `useRoadieLogic.js`).

## Purpose

These hooks encapsulate the "Game Loop" logic for arcade minigames, separate from the PixiJS rendering layer. They are responsible for:

- **State Management**: Position, speed, health, score, and collisions.
- **Timing**: `requestAnimationFrame` loops (via internal refs or effects) to drive simulation.
- **Input Handling**: Keyboard/Touch listeners mapped to game actions.
- **Completion**: Dispatching results to `gameReducer` via action creators.

## Architectural Constraints

1.  **Rendering Agnostic**: These hooks must NOT import `PIXI` or manipulate DOM elements directly. They return reactive state (or refs) that `StageController` classes consume.
2.  **State Safety**: Use `useRef` for high-frequency mutable state (e.g., player X/Y coordinates) to avoid React render thrashing. Only sync to React state (`useState`) for UI updates (score, health bars).
3.  **Cleanup**: Ensure all event listeners (`keydown`, `keyup`) and animation frames are cleared in the `useEffect` cleanup function.
4.  **No Direct Reducer Loops**: Do not dispatch reducer actions on every frame. Accumulate damage/score locally and dispatch only on game completion or major events (e.g., arrival).

## Minigame Specifics

### `useTourbusLogic`

- **Context**: Used in `TourbusScene`.
- **Responsibility**: Lane switching (3 lanes), obstacle spawning, forward progress.
- **Output**: `busState` (lane, x, y), `obstacles` (array), `progress` (0-1).

### `useRoadieLogic`

- **Context**: Used in `RoadieRunScene`.
- **Responsibility**: Grid-based movement, traffic simulation, item weight mechanics.
- **Output**: `roadiePos` (x, y), `equipment` (list), `traffic` (array).

## Validation

Verify logic stability via unit tests:

```bash
npm run test tests/minigameState.test.js
```

_Last updated: 2026-02-21._
