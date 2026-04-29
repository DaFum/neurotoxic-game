# src/scenes/kabelsalat/components/plugs — Agent Instructions

## Scope

Applies to `src/scenes/kabelsalat/components/plugs/**`.

## Domain Gotchas

- Plug interaction props should keep `CableId`/`SocketId` literal safety; avoid widening IDs to generic `string` before hook handlers.
- Visual plug state must reflect hook-provided powered/connected state and should not recompute source-of-truth game logic locally.

## Recent Findings (2026-04)

- Most plug regressions come from prop-contract drift after hook refactors; keep prop names and callback parameter order stable.
