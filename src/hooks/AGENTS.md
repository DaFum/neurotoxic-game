# src/hooks - Agent Instructions

## State / Actions

- Derive toast values from pre-dispatch state; `useReducer` dispatch does not synchronously update refs.
- Processing locks (e.g. `processingItemId`) must clean up in `finally`, including pre-effect validation failures.
- `usePreGigLogic` "spend money to increase harmony" flows must refund and toast "maxed out" when `band.harmony >= 100`; clamps don't refund money.
- `usePostGigHandlers`: the `soldMerch` deduction and all state-mutation side effects inside `handleContinue` must run inside the `isProcessingActionRef` guard, not before it. Wrap the handler body in try/catch so the ref always resets.
- `deriveFinancials` in `src/utils/postGigUtils.ts` accepts optional `bandMerchPrices`; pass `band.merchPrices` from post-gig hooks.
- Use `?? 0` (not `|| 0`) when reading numeric inventory or merch values that can legitimately be `0`.
- `useSettingsActions` intentionally omits `settings.crtEnabled` from its `useCallback` dep array — the latest value is mirrored into a ref via `useLayoutEffect` so the toggle callback identity stays stable. Adding `crtEnabled` to deps (e.g. to silence a lint rule) re-creates the callback on every toggle and breaks downstream memoization.

## Travel / Arrival

- Travel confirmation/resource checks must include `getTotalDailyObligations(state)` (guaranteed daily cost plus asset upkeep/revenue and liability payments) for routes that call `advanceDay()` on completion or arrival. Do not call `calculateGuaranteedDailyCost` alone for these checks.
- `useArrivalLogic` lives ONLY in `TourbusScene`, which `SceneRouter` renders solely for `TRAVEL_MINIGAME`. Any state change that leaves that scene (notably `START_GIG` → `PRE_GIG`) unmounts the hook, so its post-commit effect cannot get a second pass. Never defer the arrival save to a later effect run — it would simply never be written.
- Consequence, currently accepted: the gig-arrival save is taken before the `startTransition` dispatch of `START_GIG` commits, and `handleLoadGame` restores `currentGig`/`gigModifiers`/`minigame` (it only forces `currentScene`). A reload right after a gig arrival therefore returns to the overworld carrying the previous gig's venue. Moving the arrival save to a lifecycle that outlives the scene change is the real fix.
- `useArrivalLogic` keys `isHandlingRef` on the arriving `nodeId` with sentinel `undefined`. `player.currentNodeId` can be `null`, so `null` is a real guarded value and cannot mean "idle".
- Do not reset `isHandlingRef` in the arrival success path; the `useEffect` cleanup keyed on `player.currentNodeId` owns that lifecycle. Error paths may reset it so the same node can be retried.
- Band harmony is clamped to minimum `1` (never `0`). `arrivalUtils` uses `harmony <= 1` as the deterministic gig-cancellation check with probabilistic cancellation above that. A `harmony <= 0` branch is unreachable — do not reintroduce one.
- Both travel arrival paths must call `processTravelEvents` with the same gig-node policy (the default, which skips GIG/FESTIVAL/FINALE so gig events fire in PreGig): the production path is `useArrivalLogic.handleArrivalSequence`; the legacy animation-failsafe `useTravelActions.onTravelComplete` (unreachable while `onStartTravelMinigame` is wired in `Overworld.tsx`) must stay aligned. Do not pass `{ includeGigNodes: true }` in the fallback.

## Venue IDs

- Saved/legacy venue IDs may carry a namespace prefix (`'venues:berlin_so36'`) while `gameMap.cityStates` is keyed by the city prefix (`'berlin'`).
- Normalize before deriving a city key: read the raw ID from the node/current gig, run `normalizeVenueId(raw)`, then pass a non-empty result to `getCityKeyFromVenueId`. If normalization returns `null` or the city key is `''`, use the local skip/fallback path instead of deriving traits from the unnormalized value.
- `usePostGigLogic`, `OverworldMap`, `arrivalUtils`, `systemReducer`, and `minigameReducer` all follow this venue normalization pattern.
