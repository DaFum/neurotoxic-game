# src/hooks - Agent Instructions

- Derive toast values from pre-dispatch state; `useReducer` dispatch does not synchronously update refs.
- Travel confirmation/resource checks must include guaranteed daily upkeep when the route also calls `advanceDay()`.
- Processing locks (e.g. `processingItemId`) must clean up in `finally`, including pre-effect validation failures.
- `useArrivalLogic` keys `isHandlingRef` on the arriving `nodeId` with sentinel `undefined` (not `null` — `null` collides with valid empty `currentNodeId`). Do not reset the ref in the success path; the `useEffect` cleanup keyed on `player.currentNodeId` owns that lifecycle.
- Band harmony is clamped to minimum `1` (never `0`). `arrivalUtils` uses `harmony <= 1` as the deterministic gig-cancellation check with probabilistic cancellation above that. A `harmony <= 0` branch is unreachable — do not reintroduce one.
- `usePreGigLogic` "spend money to increase harmony" flows must refund and toast "maxed out" when `band.harmony >= 100`; clamps don't refund money.
- `usePostGigHandlers`: the `soldMerch` deduction and all state-mutation side effects inside `handleContinue` must run inside the `isProcessingActionRef` guard, not before it. Wrap the handler body in try/catch so the ref always resets.
- Use `?? 0` (not `|| 0`) when reading numeric inventory or merch values that can legitimately be `0`.
- Saved/legacy venue IDs may carry a namespace prefix (`'venues:berlin_so36'`) while `gameMap.cityStates` is keyed by the normalized form (`'berlin'`). Run `normalizeVenueId(id) ?? id ?? ''` before `getCityKeyFromVenueId` — skipping normalize silently misses saved entries and falls back to `deriveCityTraits` defaults. `usePostGigLogic`, `OverworldMap`, `arrivalUtils`, `systemReducer`, and `minigameReducer` all follow this pattern.
- `useSettingsActions` intentionally omits `settings.crtEnabled` from its `useCallback` dep array — the latest value is mirrored into a ref via `useLayoutEffect` so the toggle callback identity stays stable. Adding `crtEnabled` to deps (e.g. to silence a lint rule) re-creates the callback on every toggle and breaks downstream memoization.
