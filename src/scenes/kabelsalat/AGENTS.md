# src/scenes/kabelsalat - Agent Instructions

## Rules

- Keep `forceAdvance(isPowered: boolean)` typed end-to-end through hooks and consumers.
- Preserve socket-order literals with `as const`; do not widen to `string[]`.
- Game-end paths must call `changeScene(GAME_PHASES.GIG)` for win/continue flows.

## Gotchas

- Scene transitions out of Kabelsalat must be StrictMode-safe: a manual fallback button must still route to `GIG` if the auto-advance effect double-fires or is dropped. Do not rely on a single `useEffect` to handle scene change.
- Socket/cable shuffles must use an in-place Fisher-Yates over `getSafeRandom()` from `src/utils/crypto` (which falls back to `Math.random()` once if the Crypto API is unavailable). Never use `sort(() => Math.random() - 0.5)` — biased and previously flagged insecure. Use `secureRandom()` directly only for non-shuffle visuals where a throw on missing Crypto is acceptable.
- `CONNECTOR_TYPES` is derived from the `CABLES` array; do not maintain a parallel hard-coded list.
- When changing end-flow logic, cover timeout-loss, fully-wired win, StrictMode replay, and manual overlay continue paths.
