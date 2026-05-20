# src/utils - Agent Instructions

## Object emptiness

- Do not use `Object.keys(obj).length > 0` for emptiness checks; use `isEmptyObject` from `src/utils/gameStateUtils.ts`.

## Economy invariants

Source-of-truth priority: runtime helpers/constants win. If simulations,
tooltips, or docs disagree with `economyEngine.ts`, `gameStateUtils.ts`, or
`postGigUtils.ts`, update the consumers and rerun the required simulation
baseline instead of duplicating formulas.

### Gig financial reconciliation

- `MAX_GIG_NET = 7500` in `economyEngine.ts`. Excess net is added back to expenses as an `overageFee` line (`economy:gigExpenses.overageFee.*` i18n keys), not silently truncated. `calculateGigFinancials()` must reconcile `net === income.total - expenses.total`.
- Management cut is fame-progressive: `MANAGEMENT_CUT_RATE (0.15) × Math.min(1, playerFame / 200)`. Required to keep Bootstrap bankruptcy below the simulation gate.

### Shared formulas and simulations

- `MAX_GIG_NET`, `MANAGEMENT_CUT_RATE`, and `BASE_DRAW_RATIO` are mirrored by `scripts/game-balance-simulation.mjs` via direct import. Changing them invalidates `reports/game-balance-simulation-baseline.json`; re-run `pnpm run simulate:balance:baseline`.
- Fame level is `Math.floor(Math.sqrt(fame / 200))` (`calculateFameLevel` in `gameStateUtils.ts`). External formulas (sim scripts, tooltips) must import this helper, not duplicate the math.
- Gig pass/fail uses `perfScore >= 31` with `PERF_SCORE_MIN = 30` and `PERF_SCORE_SCALER = 150` in `postGigUtils.ts`. Simulation scripts must import `calculatePerformanceScore()` rather than re-implement it.

## Gig / merch threading

- `calculateTravelMinigameResult()` is the source of truth for Tourbus condition loss; its 50% damage-to-condition scaling must stay aligned with the reducer and completion UI.
- `postGigUtils.calculatePostGigStateUpdates` reads `social.activeDeals` (pre-decrement), not `updatedSocial.activeDeals`, for `comm_sellout_ad` penalty resolution; otherwise sponsorship penalties on the deal's final expiring gig are silently dropped.
- `EconomyContext.merchPrices` is a direct top-level field, not nested under `context.social`. Passing via `context.social.merchPrices` is silently ignored by `calculateMerchIncome`.
- Post-gig merch derives `context.cityTraits?: CityTraitState` from the normalized venue ID city key: use `state.gameMap?.cityStates?.[cityKey]` when present, otherwise call `deriveCityTraits(cityKey)`. If the city key is empty or `context.cityTraits` is omitted, `calculateMerchIncome` uses neutral 1.0 multipliers. Unrecognized trait fields fall through to merch profile lookup defaults; never read `cityStates` from top-level `GameState`.
- Per-item merch demand profiles live in `src/data/merch.ts` (`MERCH_PROFILES`, `SPENDING_PROFILE_MERCH_MULTIPLIER`). `DEFAULT_MERCH_PRICES` is re-exported from there; do not redefine merch prices in `economyEngine.ts`.

## Map / venues

- `getCityKeyFromVenueId(venueId)` in `mapGenerator.ts` extracts the prefix before the first `_`; returns `''` if no underscore. Use this helper instead of `node.venue.city` (which does not exist).
- When accessing venue IDs from `MapNode` objects, support both the current `venueId` property and the legacy `venue?.id` structure.
- `GeneratedMapNode.type` union includes `'supplyStop'`. When adding map node types, update the union, `_populateCityStates`, rollout logic, and any consumers that switch on `type`.
- Attention span in generated map nodes uses formula `Math.floor(random() * 45) + 15` (range 15–59).

## Crypto / probability

- `crypto.ts` exposes `__testInternals` only when `process.env.NODE_ENV === 'test'` (compiled away in production). Test setup must set `NODE_ENV='test'` before importing; tests must fail fast if `__testInternals` is missing.
- Probability inputs must clamp to `[0, 1]` and guard non-finite values before use (`eventEngine`, `mapGenerator`, `contrabandUtils`, `audio/AudioManager`).

## Events

- `resolveChoice` skillCheck in `eventEngine.ts` must branch `stat === 'luck'` BEFORE the `gameState.band[stat]` fallthrough. `band.luck` exists (default 0), so checking band stats first turns the random luck roll into a static 0.

## Merch demand

- `calculateMerchIncome` in `economyEngine.ts` computes `rawShare` for every item regardless of inventory; the cap is applied only at allocation (`sold = min(desired, inventory)`). Out-of-stock demand is intentionally lost, not redistributed — skipping zero-stock items at the share step would normalize in-stock shares to 1.0 and silently absorb missed sales.

## triggerEvent

- The `triggerEvent` callback across utilities uses the signature `(category: string, triggerPoint?: string) => boolean`. It returns `true` only after an event is selected, processed, and set active; `false` means no event was triggered.
