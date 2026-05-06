# src/components/minigames - Agent Instructions

## Scope

Applies to `src/components/minigames/**` unless a deeper `AGENTS.md` overrides it.

## Rules

- Hooks return reactive game state only; do not import Pixi into minigame hooks.
- Completion flow must preserve fallback timers, unmount cleanup, and explicit scene continuation paths.
- Keep minigame state transitions routed through existing action creators and scene callbacks.

## Gotchas

- Completion overlays need both automatic and manual continue paths covered by tests when changed.
