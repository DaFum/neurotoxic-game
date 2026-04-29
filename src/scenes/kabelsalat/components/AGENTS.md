# src/scenes/kabelsalat/components — Agent Instructions

## Scope

Applies to `src/scenes/kabelsalat/components/**` except deeper nested scopes.

## Domain Gotchas

- Keep component responsibilities visual and interaction-focused; shared game-end routing and phase transitions must stay in hooks/state orchestration.
- Socket/plug component contracts should preserve `SocketId`/`CableId` literal safety from upstream hooks; avoid widening to plain `string` in props.
- Overlay and board components must surface both win-path and timeout-loss continuations so users can always progress to `GAME_PHASES.GIG`.

## Recent Findings (2026-04)

- Regressions frequently come from UI-only refactors that bypass shared finalize callbacks; keep all completion paths wired through the same hook-level completion API.
