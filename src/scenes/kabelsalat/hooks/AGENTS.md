# src/scenes/kabelsalat/hooks - Agent Instructions

## Scope

Applies to `src/scenes/kabelsalat/hooks/**`.

## Rules

- Keep `forceAdvance(isPowered: boolean)` typed through hook APIs and consumers.
- Guard one-shot end transitions against StrictMode replay.
- Clean up fallback timers on unmount and completion.

## Gotchas

- End-flow tests must assert `changeScene('GIG')` for powered win and manual fallback continuation.
