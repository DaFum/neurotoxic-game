# src/scenes/kabelsalat/hooks — Agent Instructions

## Scope

Applies to `src/scenes/kabelsalat/hooks/**`.

## Domain Gotchas

- Cable lookups must treat IDs as trusted unions (`CableId`/`SocketId`) and validate existence with `Object.hasOwn()` before dereferencing map entries.
- Timeout loss and manual completion flows must converge through the same finalize callback so routing to `GAME_PHASES.GIG` stays deterministic.

## Recent Findings (2026-04)

- Interaction hooks that read `CABLE_MAP` should fail loudly on impossible missing entries rather than silently no-op, to surface data-shape regressions early.
- Game-end hooks should keep timer IDs in refs and clear them only on true unmount to survive React StrictMode mount/cleanup replay without losing scheduled transitions.
- When interaction handlers accept boundary `string` IDs from UI events, narrow them to `SocketId`/`CableId` immediately via `Object.hasOwn`-based type guards before any map lookup to avoid downstream casts.
- Keep game-end callback signatures explicit (`finalizeGameEnd(isPowered: boolean)`); losing the boolean at state interface boundaries turns successful manual advances into falsy/failed payloads.
