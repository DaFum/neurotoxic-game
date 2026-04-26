# src/scenes/kabelsalat — Agent Instructions

## Scope

Applies to `src/scenes/kabelsalat/**`.

## Domain Gotchas

- Keep cable/socket IDs typed end-to-end (`CableId`, `SocketId`) to avoid widening to generic strings and reintroducing `as` casts.
- Win/loss transitions must both finalize through the shared game-end path and route to `GAME_PHASES.GIG`.

## Recent Findings (2026-04)

- Sparse cable lookup assumptions should fail loudly during map construction/selection instead of silently skipping entries.
