# src/scenes/kabelsalat - Agent Instructions

## Scope

Applies to `src/scenes/kabelsalat/**` unless a deeper `AGENTS.md` overrides it.

## Rules

- Keep `forceAdvance(isPowered: boolean)` typed end-to-end.
- Preserve socket-order literals with `as const` so they do not widen to `string[]`.
- Game-end paths must eventually call `changeScene('GIG')` for win/continue flows.

## Gotchas

- Tests should cover timeout-loss, fully wired win, StrictMode replay, and manual overlay continue paths when end-flow logic changes.
- Scene transitions out of Kabelsalat must be StrictMode-safe: a manual fallback button must still route to `GIG` if the auto-advance effect double-fires or is dropped. Do not rely on a single `useEffect` to handle scene change.
- Socket/cable shuffles must use an in-place Fisher-Yates over `getSafeRandom()` from `src/utils/crypto` (which falls back to `Math.random()` once if the Crypto API is unavailable), never the `sort(() => Math.random() - 0.5)` pattern — it's biased and was previously flagged as insecure. Use `secureRandom()` directly only for non-shuffle visuals where a throw on missing Crypto is acceptable.
- `CONNECTOR_TYPES` is derived from the `CABLES` array; do not maintain a parallel hard-coded list.
