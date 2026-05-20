# src/scenes/kabelsalat/hooks - Agent Instructions

## Types / Transitions

- Keep `forceAdvance(isPowered: boolean)` typed through hook APIs and consumers.
- Guard one-shot end transitions against React StrictMode effect replay; effects may mount, clean up, and run again, so transitions need ref-based idempotency.
- Clean up fallback timers on unmount and completion.

## Tests

- End-flow tests must assert `changeScene('GIG')` for powered win and manual fallback continuation.
