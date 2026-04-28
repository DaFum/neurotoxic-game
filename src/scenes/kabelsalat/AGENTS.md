# src/scenes/kabelsalat — Agent Instructions

## Scope

Applies to `src/scenes/kabelsalat/**`.

## Domain Gotchas

- Keep cable/socket IDs typed end-to-end (`CableId`, `SocketId`) to avoid widening to generic strings and reintroducing `as` casts.
- Win/loss transitions must both finalize through the shared game-end path and route to `GAME_PHASES.GIG`.
- Auto-transition timers must be StrictMode-safe; do not rely on per-effect cleanup patterns that cancel the only scheduled timeout during development effect replay.

## Recent Findings (2026-04)

- Sparse cable lookup assumptions should fail loudly during map construction/selection instead of silently skipping entries.
- Kabelsalat overlays need a manual advance button as a fallback path so users can always reach `GAME_PHASES.GIG` if delayed auto-transition timing ever regresses.
- Keep `forceAdvance` typed as `(isPowered: boolean) => void` across state/hook/component boundaries; narrowing it to `() => void` can silently turn manual win advances into loss payloads.
- Keep `INITIAL_SOCKET_ORDER` literal-typed (`as const`) and spread into mutable state arrays (`[...INITIAL_SOCKET_ORDER]`) to avoid `string[]` widening regressions.
