# src/components/minigames - Agent Instructions

## Hooks

- Hooks return reactive game state only; do not import Pixi into minigame hooks.
- Keep minigame state transitions routed through existing action creators and scene callbacks.

## Completion

- Completion flow must preserve fallback timers, unmount cleanup, and explicit scene continuation callbacks such as `onComplete`.

## Tests

- Completion overlays need both automatic fallback and manual `CONTINUE` paths covered by neighboring UI/hook tests when changed.
