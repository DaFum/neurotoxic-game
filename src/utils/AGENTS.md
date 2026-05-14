# src/utils - Agent Instructions

## Scope

Applies to `src/utils/**` unless a deeper `AGENTS.md` overrides it.

## Rules

- Utilities stay pure and side-effect-free unless the filename explicitly indicates IO, network, or storage.
- Treat external payloads and caught errors as `unknown` and narrow before access.
- Fail loudly on invalid invariants in strict domains instead of silently continuing with corrupted state.
- Avoid using `Object.keys(obj).length > 0` for checking object emptiness; use the custom `isEmptyObject` utility from `src/utils/gameStateUtils.ts`.
- Unlock logic must be kept strictly separated: use `src/utils/unlockManager.ts` exclusively for localStorage persistence and `src/utils/unlockCheck.ts` exclusively for state-based eligibility evaluation.

## Gotchas

- Retry/error helpers must preserve the original failure cause.
- Map layer fallback selection must explicitly assert non-null venues before capacity/type access.
- `pickRandomSubset` large-`k` branches must reject sparse arrays instead of unchecked assertions.
- Purchase effect helpers should fail on invalid numeric payloads and normalize stored upgrade IDs to strings.
- `calculateTravelMinigameResult()` is the source of truth for Tourbus condition loss; keep its 50% damage-to-condition scaling aligned with reducer and completion UI.
- `calculateGigFinancials()` reports must reconcile: `net === income.total - expenses.total`; add balancing items to expenses for payout dampeners or penalties.
- Hard gig cap: `MAX_GIG_NET = 7500` in `economyEngine.ts`. Excess net is added back to expenses as an `overageFee` line (`economy:gigExpenses.overageFee.*` i18n keys), not silently truncated.
- Management cut is fame-progressive: `MANAGEMENT_CUT_RATE (0.15) × Math.min(1, playerFame / 200)`. Zero at fame=0, full at fame≥200; required to keep Bootstrap bankruptcy below the simulation gate.
- `postGigUtils.calculatePostGigStateUpdates` reads `social.activeDeals` (pre-decrement), not `updatedSocial.activeDeals`, for `comm_sellout_ad` penalty resolution; otherwise sponsorship penalties on the deal's final expiring gig are silently dropped.
- `MAX_GIG_NET`, `MANAGEMENT_CUT_RATE`, and `BASE_DRAW_RATIO` are mirrored by `scripts/game-balance-simulation.mjs` by direct import. Changing them invalidates `reports/game-balance-simulation-baseline.json`; re-run `pnpm run simulate:balance:baseline`.
- Fame level is `Math.floor(Math.sqrt(fame / 200))` (`calculateFameLevel` in `gameStateUtils.ts`), not `floor(fame/100)`. Level 1 ≈ 200 fame, level 5 ≈ 5000, level 10 ≈ 20000. Any external formula (sim scripts, tooltips, derived UI) must use this helper, not duplicate the math.
- Gig pass/fail uses `perfScore >= 31` with `PERF_SCORE_MIN = 30` and `PERF_SCORE_SCALER = 150` in `postGigUtils.ts`. `calculatePerformanceScore()` is the source of truth — simulation scripts must import it rather than re-implementing normalization.
- Band harmony invariant is `[1, 100]` (clamped to min `1`, never `0`); `tests/node/reducerInvariants.test.js` enforces this across `clampBandHarmony` and `handleUpdateBand`. Money is `≥ 0`. Do not introduce branches that produce `harmony === 0`.
- `crypto.ts` exposes `__testInternals` only when `process.env.NODE_ENV === 'test'` (compiled away in production). Test setup must set `NODE_ENV='test'` before importing; tests must fail fast if `__testInternals` is missing rather than silently skipping.
- Probability inputs must clamp to `[0, 1]` and guard non-finite values before use; recurring fixes show this is the most common arithmetic foot-gun (`eventEngine`, `mapGenerator`, `contrabandUtils`, `audio/AudioManager`).
- When accessing venue IDs from `MapNode` objects, support both the current `venueId` property and the legacy `venue?.id` structure to maintain compatibility.
- `getCityKeyFromVenueId(venueId)` in `mapGenerator.ts` extracts the city prefix before the first `_` (e.g. `'berlin_so36'` → `'berlin'`); returns `''` if no underscore. Use this helper instead of `node.venue.city` (which does not exist).
- `GeneratedMapNode` type includes `'supplyStop'` in its `type` union. When adding map node types, update the union, `_populateCityStates`, the node-type rollout logic, and any consumers that switch on `type`.
- Attention span in generated map nodes has range 15–59 (formula: `Math.floor(random() * 45) + 15`).
- `EconomyContext.merchPrices` is a direct top-level field (`context.merchPrices`), not nested under `context.social`. Passing merch prices via `context.social.merchPrices` is incorrect and silently ignored by `calculateMerchIncome`.
- `deriveFinancials` in `postGigUtils.ts` takes an optional `bandMerchPrices?: GameState['band']['merchPrices']` param; it must be passed from `usePostGigLogic` (threaded via `context.merchPrices` into `calculateGigFinancials`).
- `RelationshipChange` type lives in `src/types/game.d.ts`; import it from there, not from `gameStateUtils.ts` (it was removed from that file).
- The `triggerEvent` callback across utilities consistently uses the signature `(category: string, triggerPoint?: string) => boolean`.
- Standard practice for error handling involves delegating error processing to the `handleError` utility from `src/utils/errorHandler.ts`.
