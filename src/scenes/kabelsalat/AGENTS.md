# src/scenes/kabelsalat - Agent Instructions

## Scope

Applies to `src/scenes/kabelsalat/**` unless a deeper `AGENTS.md` overrides it.

## Rules

- Keep `forceAdvance(isPowered: boolean)` typed end-to-end.
- Preserve socket-order literals with `as const` so they do not widen to `string[]`.
- Game-end paths must eventually call `changeScene('GIG')` for win/continue flows.

## Gotchas

- Tests should cover timeout-loss, fully wired win, StrictMode replay, and manual overlay continue paths when end-flow logic changes.
