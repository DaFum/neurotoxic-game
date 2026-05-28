# src/scenes/kabelsalat - Agent Instructions

## State / Types

- Keep `forceAdvance(isPowered: boolean)` typed end-to-end through hooks and consumers.
- Preserve socket-order literals with `as const`; do not widen to `string[]`.

## Transitions

- Game-end paths must call `changeScene(GAME_PHASES.GIG)` for win/continue flows.
- Transitions out of Kabelsalat must tolerate React StrictMode effect replay: use an idempotency ref and timer cleanup so auto-advance runs once, while the manual fallback button still routes to `GIG` if the effect is dropped.
- When changing end-flow logic, cover timeout-loss, fully-wired win, React StrictMode effect replay, and manual overlay continue paths.

## Shuffle

- Socket/cable shuffles must use an in-place Fisher-Yates over `getSafeRandom()` from `src/utils/crypto` (which falls back to `Math.random()` once if the Crypto API is unavailable). Never use `sort(() => Math.random() - 0.5)` — biased and previously flagged insecure. Use `secureRandom()` directly only for non-shuffle visuals where a throw on missing Crypto is acceptable.
